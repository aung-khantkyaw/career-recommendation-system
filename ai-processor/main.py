import os
import json
import redis
import time
import logging
from datetime import datetime

from config import REDIS_URL
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
        self.redis_client = redis.Redis.from_url(REDIS_URL)
        self.db_service = DatabaseService()
        self.minio_service = MinIOService()
        self.resume_parser = ResumeParser(self.minio_service)
        self.skill_extractor = SkillExtractionModel()
        self.embedding_generator = EmbeddingGenerator()
        self.career_recommender = CareerRecommender()
        
        logger.info("AI Processor initialized successfully")
    
    def process_job(self, job_data):
        job_id = job_data.get('job_id')
        resume_id = job_data.get('resume_id')
        file_name = job_data.get('file_name')
        
        logger.info(f"🔄 Processing Job ID: {job_id}, Resume ID: {resume_id}")
        
        try:
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
            
            logger.info(f"✅ Job ID: {job_id} completed successfully")
            logger.info(f"📊 Extracted {len(user_skills)} skills, generated {len(recommendations)} recommendations")
            
        except Exception as e:
            logger.error(f"❌ Job ID: {job_id} failed: {str(e)}")
            self.db_service.update_resume_status(resume_id, 'failed')
            raise
    
    def run(self):
        logger.info(f"🚀 AI Worker Started. Listening to queue: {QUEUE_NAME}...")
        
        while True:
            try:
                # Blocking pop from queue
                queue, message = self.redis_client.brpop(QUEUE_NAME)
                
                if message:
                    job_data = json.loads(message.decode('utf-8'))
                    self.process_job(job_data)
                    
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in queue message: {e}")
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                time.sleep(5)

if __name__ == "__main__":
    processor = AIProcessor()
    processor.run() 
