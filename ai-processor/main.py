import os
import json
import redis
import time
import logging
import threading
from datetime import datetime
from openai import OpenAI

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
        self.embedding_generator = None
        self.llm_client = None
        self.api_keys = self.db_service.get_active_api_keys()

        # Update AI models with API keys from database first
        self.update_api_keys()

        # Initialize skill extractor with LLM client and model
        llm_model = None
        llm_provider = None
        for key in self.api_keys:
            if key.get('llmModelName'):
                llm_model = key['llmModelName']
                llm_provider = key['provider'].lower()
                break
        
        self.skill_extractor = SkillExtractionModel(llm_client=self.llm_client, llm_model=llm_model, llm_provider=llm_provider)

        # Initialize career recommender with the configured embedding generator and db service
        self.career_recommender = CareerRecommender(
            embedding_generator=self.embedding_generator,
            db_service=self.db_service
        )

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
        import google.genai as genai
        
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
                    # Initialize Google genai client
                    self.llm_client = genai.Client(api_key=api_key)
                    self.llm_provider = 'google'
                elif provider == 'openrouter':
                    os.environ['OPENROUTER_API_KEY'] = api_key
                    # Initialize OpenAI client for OpenRouter
                    self.llm_client = OpenAI(
                        api_key=api_key,
                        base_url=OPENROUTER_BASE_URL
                    )
                    self.llm_provider = 'openrouter'
                elif provider == 'openai':
                    os.environ['OPENAI_API_KEY'] = api_key
                    self.llm_client = OpenAI(api_key=api_key)
                    self.llm_provider = 'openai'

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
        
        # Try to initialize LLM client from environment variables
        if os.getenv('OPENROUTER_API_KEY'):
            self.llm_client = OpenAI(
                api_key=os.getenv('OPENROUTER_API_KEY'),
                base_url=OPENROUTER_BASE_URL
            )
            logger.info("LLM client initialized from environment variables")

        logger.info(f"Configured {len(self.api_keys)} active API keys")

    def listen_for_api_key_changes(self, shutdown_event):
        """Listen for API key changes via Redis pub/sub"""
        pubsub = self.redis_client.pubsub()
        pubsub.subscribe('api_key_changes')
        logger.info("📡 Listening for API key changes on channel: api_key_changes")

        while not shutdown_event.is_set():
            try:
                # Use get_message with timeout to allow checking shutdown flag
                message = pubsub.get_message(timeout=1.0)
                if message and message['type'] == 'message':
                    try:
                        data = json.loads(message['data'])
                        if data.get('type') == 'active_changed':
                            logger.info(f"🔄 API key active status changed: {data}")
                            # Reload API keys from database
                            self.api_keys = self.db_service.get_active_api_keys()
                            # Update AI models with new API keys
                            self.update_api_keys()
                            # Update skill extractor with new LLM client
                            llm_model = None
                            llm_provider = None
                            for key in self.api_keys:
                                if key.get('llmModelName'):
                                    llm_model = key['llmModelName']
                                    llm_provider = key['provider'].lower()
                                    break
                            self.skill_extractor = SkillExtractionModel(llm_client=self.llm_client, llm_model=llm_model, llm_provider=llm_provider)
                            logger.info("✅ AI models updated with new API keys")
                    except Exception as e:
                        logger.error(f"Error processing API key change: {e}")
            except Exception as e:
                if shutdown_event.is_set():
                    break
                logger.error(f"Error in pubsub listener: {e}")
                time.sleep(1)

        pubsub.unsubscribe('api_key_changes')
        logger.info("📡 API key change listener stopped")

    def process_job(self, job_data):
        job_id = job_data.get('job_id')
        job_type = job_data.get('job_type', 'resume_processing')

        logger.info(f"🔄 Processing Job ID: {job_id}, Type: {job_type}")

        try:
            if job_type == 'career_embedding':
                self.process_career_embedding(job_data)
            elif job_type == 'job_embedding':
                self.process_job_embedding(job_data)
            elif job_type == 'skill_embedding':
                self.process_skill_embedding(job_data)
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

    def process_skill_embedding(self, job_data):
        skill_id = job_data.get('skill_id')
        logger.info(f"🔧 Processing Skill embedding: {skill_id}")

        # Update status to processing
        self.db_service.update_skill_status(skill_id, 'PROCESSING')

        # Fetch skill data
        skill = self.db_service.get_skill_by_id(skill_id)
        if not skill:
            raise ValueError(f"Skill not found: {skill_id}")

        # Combine text for embedding
        text = f"{skill['name']} {skill['category']} {skill['description'] or ''}"

        # Generate embedding
        logger.info("🧠 Generating embedding for skill")
        embedding = self.embedding_generator.generate_embedding(text)

        # Update database with embedding
        self.db_service.update_skill_status(skill_id, 'COMPLETED', embedding)

        logger.info(f"🔧 Skill embedding generated successfully")

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
        self.db_service.update_resume_status(resume_id, 'PROCESSING')

        # Step 1: Download and parse resume from MinIO
        logger.info(f"📥 Downloading resume: {file_name}")
        resume_text = self.resume_parser.parse_resume(file_name)

        if not resume_text or len(resume_text) < 50:
            raise ValueError("Resume text is too short or empty")

        # Step 2: Extract skills using 3-layer extraction (Fast -> Smart -> Fallback)
        logger.info("🔍 Extracting skills from resume")
        skills_data = self.skill_extractor.extract_skills(resume_text)
        user_skills = skills_data['all']

        # Step 2.5: Use education and experience from extraction (LLM provides these)
        education_data = skills_data.get('education', [])
        experience_data = skills_data.get('experience', [])
        
        if not education_data:
            logger.info("🎓 Extracting education from resume (fallback)")
            education_data = self.skill_extractor.extract_education(resume_text)
        
        if not experience_data:
            logger.info("💼 Extracting experience from resume (fallback)")
            experience_data = [exp['text'] for exp in self.skill_extractor.extract_experience(resume_text)]

        # Step 3: Generate embedding
        logger.info("🧠 Generating embedding for resume")
        embedding = self.embedding_generator.generate_embedding(resume_text)

        # Step 3.5: Save processed data to database
        logger.info("💾 Saving processed data to database")
        processed_data = {
            'skills': skills_data,
            'embedding': embedding,
            'education': education_data,
            'experience': experience_data
        }
        self.db_service.update_resume_status(resume_id, 'COMPLETED', processed_data)

        # Step 4: Generate career recommendations
        logger.info("💼 Generating career recommendations")
        career_recommendations = self.career_recommender.recommend_careers(
            user_skills, resume_text, top_k=5
        )

        # Step 5: Generate job recommendations
        logger.info("💼 Generating job recommendations")
        job_recommendations = self.career_recommender.recommend_jobs(
            user_skills, resume_text, top_k=5
        )

        # Step 6: Save recommendations
        logger.info("💾 Saving results to database")
        self.db_service.save_recommendations(resume_id, career_recommendations, job_recommendations)

        logger.info(f"📊 Extracted {len(user_skills)} skills, generated {len(career_recommendations)} career recommendations, {len(job_recommendations)} job recommendations")
    
    def run(self):
        logger.info(f"🚀 AI Worker Started. Listening to queue: {QUEUE_NAME}...")

        # Create shutdown event for graceful shutdown
        shutdown_event = threading.Event()

        # Start API key change listener in a separate thread
        listener_thread = threading.Thread(target=self.listen_for_api_key_changes, args=(shutdown_event,), daemon=False)
        listener_thread.start()
        logger.info("📡 API key change listener started")

        try:
            while not shutdown_event.is_set():
                try:
                    # Blocking pop from queue with timeout to allow checking shutdown flag
                    result = self.redis_client.brpop(QUEUE_NAME, timeout=1.0)

                    if result:
                        queue, message = result
                        job_data = json.loads(message)
                        self.process_job(job_data)

                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON in queue message: {e}")
                except Exception as e:
                    if shutdown_event.is_set():
                        break
                    logger.error(f"Error in main loop: {e}")
                    time.sleep(5)
        except KeyboardInterrupt:
            logger.info("🛑 AI Worker stopped by user")
        finally:
            # Signal shutdown to listener thread
            shutdown_event.set()
            # Wait for listener thread to finish
            listener_thread.join(timeout=5.0)
            logger.info("👋 Shutting down AI Worker")

if __name__ == "__main__":
    processor = AIProcessor()
    processor.run() 
