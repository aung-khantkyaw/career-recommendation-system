import os
import json
import redis
import time
import logging
from datetime import datetime

from config import REDIS_URL, OPENROUTER_BASE_URL
from services.database import DatabaseService
from services.minio_service import MinIOService
from services.resume_parser import ResumeParser
from models.skill_model import SkillExtractionModel
from embeddings.generator import EmbeddingGenerator
from services.career_recommender import CareerRecommender

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

QUEUE_NAME = 'ai_jobs_queue'

class AIProcessor:
    def __init__(self):
        self.redis_client = redis.Redis.from_url(
            REDIS_URL,
            socket_connect_timeout=10,
            socket_timeout=None,
            decode_responses=True
        )
        # Test Redis connection
        try:
            self.redis_client.ping()
            logger.info("✅ Redis connection successful")
        except Exception as e:
            logger.error(f"❌ Redis connection failed: {e}")
            raise

        self.db_service = DatabaseService()
        self.minio_service = None
        self.resume_parser = None
        self.skill_extractor = SkillExtractionModel()
        self.embedding_generator = None
        self.api_keys = self.db_service.get_active_api_keys()

        # Update embedding generator with API keys from database first
        self.update_api_keys()

        # Initialize career recommender with the configured embedding generator
        self.career_recommender = CareerRecommender(embedding_generator=self.embedding_generator)

        logger.info("AI Processor initialized successfully")

    def _ensure_minio_service(self):
        """Lazy initialization of MinIO service"""
        if self.minio_service is None:
            try:
                self.minio_service = MinIOService()
                self.resume_parser = ResumeParser(self.minio_service)
                logger.info("MinIO service initialized")
            except Exception as e:
                logger.warning(f"MinIO service initialization failed: {e}")
                logger.warning("Resume processing will be unavailable")

    def update_api_keys(self):
        """Update AI models with active API keys from database"""
        for key in self.api_keys:
            provider = key['provider'].lower()
            llm_model = key.get('llmModelName')
            embedding_model = key.get('embeddingModelName')
            api_key = key['apiKey']

            if llm_model:
                logger.info(f"Configuring LLM model: {llm_model} for provider: {provider}")
                # Configure LLM model with API key
                if provider == 'google':
                    os.environ['GOOGLE_API_KEY'] = api_key
                elif provider == 'openrouter':
                    os.environ['OPENROUTER_API_KEY'] = api_key
                elif provider == 'openai':
                    os.environ['OPENAI_API_KEY'] = api_key

            if embedding_model:
                logger.info(f"Configuring Embedding model: {embedding_model} for provider: {provider}")
                # Initialize embedding generator with API key from database
                base_url = OPENROUTER_BASE_URL if provider == 'openrouter' else None
                self.embedding_generator = EmbeddingGenerator(
                    provider=provider,
                    model=embedding_model,
                    api_key=api_key,
                    base_url=base_url
                )
                logger.info(f"Embedding generator configured with {provider} provider")
                return  # Use the first available embedding model

        # Fallback to environment variables if no database keys found
        logger.warning("No embedding API keys found in database, falling back to environment variables")
        self.embedding_generator = EmbeddingGenerator()

        logger.info(f"Configured {len(self.api_keys)} active API keys")
    
    def process_job(self, job_data):
        job_id = job_data.get('job_id')
        job_type = job_data.get('job_type', 'resume_processing')

        logger.info(f"🔄 Processing Job ID: {job_id}, Type: {job_type}")

        try:
            if job_type == 'career_embedding':
                self.process_career_embedding(job_data)
            elif job_type == 'job_embedding':
                self.process_job_embedding(job_data)
            else:
                self.process_resume(job_data)

            logger.info(f"✅ Job ID: {job_id} completed successfully")

        except Exception as e:
            logger.error(f"❌ Job ID: {job_id} failed: {str(e)}")
            raise

    def process_career_embedding(self, job_data):
        career_path_id = job_data.get('career_path_id')
        logger.info(f"📊 Processing Career Path embedding: {career_path_id}")

        # Update status to processing
        self.db_service.update_career_path_status(career_path_id, 'PROCESSING')

        # Fetch career path data
        career_path = self.db_service.get_career_path_by_id(career_path_id)
        if not career_path:
            raise ValueError(f"Career path not found: {career_path_id}")

        # Combine text for embedding
        text = f"{career_path['title']} {career_path['category']} {career_path['description']} {' '.join(career_path.get('requiredSkills', []))}"

        # Generate embedding
        logger.info("🧠 Generating embedding for career path")
        embedding = self.embedding_generator.generate_embedding(text)

        # Update database with embedding
        self.db_service.update_career_path_status(career_path_id, 'COMPLETED', embedding)

        logger.info(f"📊 Career path embedding generated successfully")

    def process_job_embedding(self, job_data):
        job_id_field = job_data.get('job_id_field')
        logger.info(f"💼 Processing Job embedding: {job_id_field}")

        # Update status to processing
        self.db_service.update_job_status(job_id_field, 'PROCESSING')

        # Fetch job data
        job = self.db_service.get_job_by_id(job_id_field)
        if not job:
            raise ValueError(f"Job not found: {job_id_field}")

        # Combine text for embedding
        text = f"{job['title']} {job['company']} {job['description']} {' '.join(job.get('requirements', []))}"

        # Generate embedding
        logger.info("🧠 Generating embedding for job")
        embedding = self.embedding_generator.generate_embedding(text)

        # Update database with embedding
        self.db_service.update_job_status(job_id_field, 'COMPLETED', embedding)

        logger.info(f"💼 Job embedding generated successfully")

    def process_resume(self, job_data):
        job_id = job_data.get('job_id')
        resume_id = job_data.get('resume_id')
        file_name = job_data.get('file_name')

        logger.info(f"📄 Processing Resume ID: {resume_id}")

        # Ensure MinIO service is available
        self._ensure_minio_service()
        if self.minio_service is None:
            raise ValueError("MinIO service is not available. Cannot process resumes.")

        # Update status to processing
        self.db_service.update_resume_status(resume_id, 'processing')

        # Step 1: Download and parse resume from MinIO
        logger.info(f"📥 Downloading resume: {file_name}")
        resume_text = self.resume_parser.parse_resume(file_name)

        if not resume_text or len(resume_text) < 50:
            raise ValueError("Resume text is too short or empty")

        # Step 2: Extract skills using NLP
        logger.info("🔍 Extracting skills from resume")
        skills_data = self.skill_extractor.extract_skills(resume_text)
        user_skills = skills_data['all']

        # Step 3: Generate embedding
        logger.info("🧠 Generating embedding for resume")
        embedding = self.embedding_generator.generate_embedding(resume_text)

        # Step 4: Generate career recommendations
        logger.info("💼 Generating career recommendations")
        recommendations = self.career_recommender.recommend_careers(
            user_skills, resume_text, top_k=5
        )

        # Step 5: Update database with processed results
        logger.info("💾 Saving results to database")
        processed_data = {
            'skills': json.dumps(skills_data),
            'embedding': json.dumps(embedding)
        }
        self.db_service.update_resume_status(resume_id, 'completed', processed_data)

        # Step 6: Save recommendations
        self.db_service.save_recommendations(resume_id, recommendations)

        logger.info(f"📊 Extracted {len(user_skills)} skills, generated {len(recommendations)} recommendations")
    
    def run(self):
        logger.info(f"🚀 AI Worker Started. Listening to queue: {QUEUE_NAME}...")
        
        while True:
            try:
                # Blocking pop from queue
                queue, message = self.redis_client.brpop(QUEUE_NAME)
                
                if message:
                    job_data = json.loads(message)
                    self.process_job(job_data)
                    
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in queue message: {e}")
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                time.sleep(5)

if __name__ == "__main__":
    processor = AIProcessor()
    processor.run() 
