import os
import psycopg2
from psycopg2.extras import RealDictCursor
from config import DATABASE_URL
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self):
        self.conn = None
        self.connect()
    
    def connect(self):
        try:
            self.conn = psycopg2.connect(DATABASE_URL)
            logger.info("Database connection established")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
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
            raise
    
    def update_resume_status(self, resume_id, status, processed_data=None):
        query = """
            UPDATE resumes 
            SET processing_status = %s, 
                processed_at = CURRENT_TIMESTAMP,
                skills = %s,
                embedding = %s
            WHERE id = %s
        """
        params = (status, processed_data.get('skills') if processed_data else None, 
                 processed_data.get('embedding') if processed_data else None, resume_id)
        return self.execute_query(query, params)
    
    def save_recommendations(self, resume_id, recommendations):
        query = """
            INSERT INTO career_recommendations (resume_id, job_title, company, match_score, skills_matched, description)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        for rec in recommendations:
            params = (resume_id, rec['job_title'], rec['company'], rec['match_score'],
                     rec['skills_matched'], rec['description'])
            self.execute_query(query, params)
    
    def get_resume_by_id(self, resume_id):
        query = "SELECT * FROM resumes WHERE id = %s"
        result = self.execute_query(query, (resume_id,))
        return result[0] if result else None
    
    def close(self):
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")
