import os
import psycopg2
from psycopg2.extras import RealDictCursor
from config import DATABASE_URL, INFRASTRUCTURE_MODE, REDIS_URL, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
from services.upstash_redis import UpstashRedis
import logging
import uuid
import json
import redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self):
        self.conn = None
        self.redis_client = None
        self.connect()
        self.connect_redis()
    
    def connect(self):
        try:
            self.conn = psycopg2.connect(DATABASE_URL)
            logger.info("Database connection established")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def connect_redis(self):
        """Connect to Redis for pub/sub"""
        try:
            self.redis_client = (UpstashRedis(UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
                                 if INFRASTRUCTURE_MODE == 'CLOUD' else redis.Redis.from_url(
                                     REDIS_URL, socket_connect_timeout=5, decode_responses=True))
            self.redis_client.ping()
            logger.info("Redis connection established for pub/sub")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}, pub/sub will be disabled")
            self.redis_client = None
    
    def publish_status_update(self, entity_type, entity_id, status):
        """Push status update to Redis queue (similar to embedding jobs)"""
        if not self.redis_client:
            return
        
        try:
            message = {
                'type': 'status_update',
                'entity_type': entity_type,
                'entity_id': entity_id,
                'status': status,
                'timestamp': str(uuid.uuid4())
            }
            self.redis_client.lpush('status_updates_queue', json.dumps(message))
            logger.debug(f"Pushed status update to queue: {entity_type} {entity_id} -> {status}")
        except Exception as e:
            logger.warning(f"Failed to push status update: {e}")
    
    def execute_query(self, query, params=None):
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params or ())
                if query.strip().upper().startswith('SELECT'):
                    return cursor.fetchall()
                else:
                    self.conn.commit()
                    return cursor.rowcount
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Query execution failed: {e}")
            # Try to reconnect if connection is closed
            if 'closed' in str(e).lower() or 'terminated' in str(e).lower():
                logger.info("Attempting to reconnect to database...")
                self.connect()
            raise
    
    def update_resume_status(self, resume_id, status, processed_data=None):
        query = """
            UPDATE "Resume"
            SET "processingStatus" = %s,
                "processedAt" = CURRENT_TIMESTAMP,
                skills = %s,
                education = %s,
                experience = %s
            WHERE id = %s
        """

        # Convert dict/list to JSON strings for PostgreSQL
        skills_json = json.dumps(processed_data.get('skills')) if processed_data and processed_data.get('skills') else None
        education_json = json.dumps(processed_data.get('education')) if processed_data and processed_data.get('education') else None
        experience_json = json.dumps(processed_data.get('experience')) if processed_data and processed_data.get('experience') else None

        params = (status,
                 skills_json,
                 education_json,
                 experience_json,
                 resume_id)
        result = self.execute_query(query, params)

        # Save embedding to Embedding table if provided
        if processed_data and processed_data.get('embedding'):
            self.save_embedding('RESUME', resume_id, processed_data['embedding'])

        return result
    
    def save_recommendations(self, resume_id, career_recommendations, job_recommendations):
        """Save recommendations grouped by career path"""
        
        # Group job recommendations by career path
        career_path_groups = {}
        
        # Add career recommendations as groups
        for rec in career_recommendations:
            career_path = rec.get('career_path') or rec['job_title']
            if career_path not in career_path_groups:
                career_path_groups[career_path] = {
                    'career_path': career_path,
                    'category': rec.get('category'),
                    'match_score': rec['match_score'],
                    'skills_matched': rec['skills_matched'],
                    'jobs': []
                }
            # Add as a "career path job" (no company)
            career_path_groups[career_path]['jobs'].append({
                'title': rec['job_title'],
                'company': None,
                'match_score': rec['match_score'],
                'skills_matched': rec['skills_matched'],
                'description': rec['description']
            })
        
        # Group job recommendations by their career path
        for rec in job_recommendations:
            career_path = rec.get('career_path') or rec['job_title']
            if career_path not in career_path_groups:
                career_path_groups[career_path] = {
                    'career_path': career_path,
                    'category': rec.get('category'),
                    'match_score': rec['match_score'],
                    'skills_matched': rec['skills_matched'],
                    'jobs': []
                }
            # Add as a job with jobId
            career_path_groups[career_path]['jobs'].append({
                'job_id': rec['job_id'],
                'match_score': rec['match_score'],
                'skills_matched': rec['skills_matched']
            })
        
        # Save each career path group as a row
        for group in career_path_groups.values():
            query = """
                INSERT INTO "CareerRecommendation" (id, "resumeId", "careerPath", "category", "matchScore", "skillsMatched", "jobs")
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            params = (
                str(uuid.uuid4()),
                resume_id,
                group['career_path'],
                group['category'],
                group['match_score'],
                group['skills_matched'],
                json.dumps(group['jobs'])
            )
            self.execute_query(query, params)

        logger.info(f"Saved {len(career_path_groups)} career path groups to database")

    def get_resume_by_id(self, resume_id):
        query = "SELECT * FROM \"Resume\" WHERE id = %s"
        result = self.execute_query(query, (resume_id,))
        return result[0] if result else None

    def get_active_api_keys(self):
        query = """
            SELECT provider, "llmModelName", "embeddingModelName", "apiKey"
            FROM "ApiKey"
            WHERE active = true
            AND ("expiresAt" IS NULL OR "expiresAt" > CURRENT_TIMESTAMP)
        """
        try:
            result = self.execute_query(query)
            return result if result else []
        except Exception as e:
            logger.warning(f"Failed to query ApiKey table: {e}")
            return []

    def update_career_path_status(self, career_path_id, status, embedding=None):
        query = """
            UPDATE "CareerPath"
            SET "processingStatus" = %s,
                "processedAt" = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        params = (status, career_path_id)
        result = self.execute_query(query, params)

        # Publish status update
        self.publish_status_update('CAREER_PATH', career_path_id, status)

        # Save embedding to Embedding table if provided
        if embedding:
            self.save_embedding('CAREER_PATH', career_path_id, embedding)

        return result

    def update_job_status(self, job_id, status, embedding=None):
        query = """
            UPDATE "Job"
            SET "processingStatus" = %s,
                "processedAt" = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        params = (status, job_id)
        result = self.execute_query(query, params)

        # Publish status update
        self.publish_status_update('JOB', job_id, status)

        # Save embedding to Embedding table if provided
        if embedding:
            self.save_embedding('JOB', job_id, embedding)

        return result

    def get_career_path_by_id(self, career_path_id):
        query = "SELECT * FROM \"CareerPath\" WHERE id = %s"
        result = self.execute_query(query, (career_path_id,))
        return result[0] if result else None

    def get_job_by_id(self, job_id):
        query = "SELECT * FROM \"Job\" WHERE id = %s"
        result = self.execute_query(query, (job_id,))
        return result[0] if result else None

    def get_skill_by_id(self, skill_id):
        query = "SELECT * FROM \"Skill\" WHERE id = %s"
        result = self.execute_query(query, (skill_id,))
        return result[0] if result else None

    def save_skill_embedding(self, skill_id, embedding):
        """Save skill embedding to Embedding table"""
        return self.save_embedding('SKILL', skill_id, embedding)

    def update_skill_status(self, skill_id, status, embedding=None):
        """Update skill processing status and optionally save embedding"""
        query = """
            UPDATE "Skill"
            SET "processingStatus" = %s,
                "processedAt" = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        params = (status, skill_id)
        result = self.execute_query(query, params)

        # Publish status update
        self.publish_status_update('SKILL', skill_id, status)

        # Save embedding to Embedding table if provided
        if embedding:
            self.save_embedding('SKILL', skill_id, embedding)

        return result

    def save_embedding(self, entity_type, entity_id, vector, model=None, dimension=None):
        """Save embedding to Embedding table"""
        if model is None:
            # Get current embedding model from active API key
            api_keys = self.get_active_api_keys()
            if api_keys and api_keys[0].get('embeddingModelName'):
                model = api_keys[0]['embeddingModelName']
            else:
                model = 'unknown'

        if dimension is None:
            dimension = len(vector) if vector else 0

        # Map entity type to FK column
        fk_column = None
        if entity_type == 'RESUME':
            fk_column = 'resumeId'
        elif entity_type == 'CAREER_PATH':
            fk_column = 'careerPathId'
        elif entity_type == 'JOB':
            fk_column = 'jobId'
        elif entity_type == 'SKILL':
            fk_column = 'skillId'
        else:
            raise ValueError(f"Invalid entity type: {entity_type}")

        query = f"""
            INSERT INTO "Embedding" (id, "{fk_column}", vector, dimension, model, "version", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT ("{fk_column}") DO UPDATE SET
                vector = EXCLUDED.vector,
                dimension = EXCLUDED.dimension,
                model = EXCLUDED.model,
                "version" = "Embedding"."version" + 1,
                "updatedAt" = CURRENT_TIMESTAMP
        """
        params = (
            str(uuid.uuid4()),
            entity_id,
            json.dumps(vector),
            dimension,
            model
        )
        return self.execute_query(query, params)

    def get_embedding(self, entity_type, entity_id, model=None, expected_dimension=None):
        """Get embedding from Embedding table"""
        if model is None:
            # Get current embedding model from active API key
            api_keys = self.get_active_api_keys()
            if api_keys and api_keys[0].get('embeddingModelName'):
                model = api_keys[0]['embeddingModelName']
            else:
                return None

        # Map entity type to FK column
        fk_column = None
        if entity_type == 'RESUME':
            fk_column = 'resumeId'
        elif entity_type == 'CAREER_PATH':
            fk_column = 'careerPathId'
        elif entity_type == 'JOB':
            fk_column = 'jobId'
        elif entity_type == 'SKILL':
            fk_column = 'skillId'
        else:
            raise ValueError(f"Invalid entity type: {entity_type}")

        query = f"""
            SELECT vector, dimension FROM "Embedding"
            WHERE "{fk_column}" = %s
            AND model = %s
            ORDER BY "version" DESC
            LIMIT 1
        """
        result = self.execute_query(query, (entity_id, model))
        if result and result[0]:
            embedding = {
                'vector': json.loads(result[0]['vector']),
                'dimension': result[0]['dimension']
            }
            # Check dimension mismatch
            if expected_dimension and embedding['dimension'] != expected_dimension:
                logger.warning(f"Dimension mismatch for {entity_type} {entity_id}: expected {expected_dimension}, got {embedding['dimension']}")
                return None
            return embedding
        return None

    def close(self):
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")
