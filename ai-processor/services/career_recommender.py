import os
import logging
from typing import List, Dict
import json
from embeddings.generator import EmbeddingGenerator
from services.database import DatabaseService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CareerRecommender:
    def __init__(self, embedding_generator=None, db_service=None):
        self.embedding_generator = embedding_generator
        self.db_service = db_service or DatabaseService()
    
    def _load_career_paths(self) -> List[Dict]:
        """Load career paths from database"""
        try:
            query = """
                SELECT id, title, category, description, "requiredSkills", "softSkills"
                FROM "CareerPath"
                WHERE active = true
            """
            result = self.db_service.execute_query(query)
            logger.info(f"Loaded {len(result)} career paths from database")
            return [
                {
                    'id': row['id'],
                    'title': row['title'],
                    'category': row['category'],
                    'description': row['description'],
                    'required_skills': row['requiredSkills'] or [],
                    'soft_skills': row['softSkills'] or []
                }
                for row in result
            ]
        except Exception as e:
            logger.error(f"Failed to load career paths: {e}")
            return []
    
    def _load_jobs(self) -> List[Dict]:
        """Load jobs from database with career path info"""
        try:
            query = """
                SELECT j.id, j.title, j.company, j.location, j.description, j.requirements, j."careerPathId",
                       cp.title as career_path_title, cp.category as career_path_category
                FROM "Job" j
                LEFT JOIN "CareerPath" cp ON j."careerPathId" = cp.id
                WHERE j.status = 'ACTIVE'
            """
            result = self.db_service.execute_query(query)
            logger.info(f"Loaded {len(result)} jobs from database")
            return [
                {
                    'id': row['id'],
                    'title': row['title'],
                    'company': row['company'],
                    'location': row['location'],
                    'description': row['description'],
                    'requirements': row['requirements'] or [],
                    'career_path_id': row['careerPathId'],
                    'career_path_title': row.get('career_path_title'),
                    'career_path_category': row.get('career_path_category')
                }
                for row in result
            ]
        except Exception as e:
            logger.error(f"Failed to load jobs: {e}")
            return []
    
    def recommend_careers(self, user_skills: List[str], resume_text: str, top_k: int = 5) -> List[Dict]:
        """Recommend career paths based on resume"""
        recommendations = []
        
        # Load career paths from database
        career_paths = self._load_career_paths()
        
        if not career_paths:
            logger.warning("No career paths found in database")
            return []
        
        resume_embedding = self.embedding_generator.generate_embedding(resume_text)
        resume_dimension = len(resume_embedding)

        for career in career_paths:
            match_score = self._calculate_match_score(user_skills, career['required_skills'])

            # Get embedding from Embedding table with dimension check
            embedding_data = self.db_service.get_embedding('CAREER_PATH', career['id'], expected_dimension=resume_dimension)
            if embedding_data:
                career_embedding = embedding_data['vector']
            else:
                career_text = f"{career['title']} {career['description']} {' '.join(career['required_skills'])} {' '.join(career['soft_skills'])}"
                career_embedding = self.embedding_generator.generate_embedding(career_text)
                # Save new embedding to database
                self.db_service.save_embedding('CAREER_PATH', career['id'], career_embedding)

            semantic_similarity = self.embedding_generator.cosine_similarity(
                resume_embedding, career_embedding
            )
            
            combined_score = (match_score * 0.5) + (semantic_similarity * 0.5)
            
            skills_matched = [skill for skill in user_skills if skill in career['required_skills']]
            
            recommendations.append({
                'job_title': career['title'],
                'company': None,  # Career paths don't have companies
                'match_score': float(round(combined_score * 100, 2)),
                'skills_matched': skills_matched,
                'description': career['description'],
                'career_path': career['title'],
                'category': career['category']
            })
        
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        
        logger.info(f"Generated {len(recommendations[:top_k])} career recommendations")
        return recommendations[:top_k]
    
    def recommend_jobs(self, user_skills: List[str], resume_text: str, top_k: int = 5) -> List[Dict]:
        """Recommend jobs based on resume"""
        recommendations = []
        
        # Load jobs from database
        jobs = self._load_jobs()
        
        if not jobs:
            logger.warning("No jobs found in database")
            return []
        
        resume_embedding = self.embedding_generator.generate_embedding(resume_text)
        resume_dimension = len(resume_embedding)

        for job in jobs:
            match_score = self._calculate_match_score(user_skills, job['requirements'])

            # Get embedding from Embedding table with dimension check
            embedding_data = self.db_service.get_embedding('JOB', job['id'], expected_dimension=resume_dimension)
            if embedding_data:
                job_embedding = embedding_data['vector']
            else:
                job_text = f"{job['title']} {job['description']} {' '.join(job['requirements'])}"
                job_embedding = self.embedding_generator.generate_embedding(job_text)
                # Save new embedding to database
                self.db_service.save_embedding('JOB', job['id'], job_embedding)

            semantic_similarity = self.embedding_generator.cosine_similarity(
                resume_embedding, job_embedding
            )
            
            combined_score = (match_score * 0.5) + (semantic_similarity * 0.5)
            
            # Match skills more flexibly - case-insensitive and partial match
            skills_matched = []
            for user_skill in user_skills:
                for req_skill in job['requirements']:
                    if user_skill.lower() in req_skill.lower() or req_skill.lower() in user_skill.lower():
                        if user_skill not in skills_matched:
                            skills_matched.append(user_skill)
            
            # Use career path info from database
            career_path = job.get('career_path_title')
            category = job.get('career_path_category')
            
            recommendations.append({
                'job_id': job['id'],
                'match_score': float(round(combined_score * 100, 2)),
                'skills_matched': skills_matched,
                'career_path': career_path,
                'category': category
            })
        
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        
        logger.info(f"Generated {len(recommendations[:top_k])} job recommendations")
        return recommendations[:top_k]
    
    def _calculate_match_score(self, user_skills: List[str], required_skills: List[str]) -> float:
        if not required_skills:
            return 0.0
        
        matched = sum(1 for skill in user_skills if skill in required_skills)
        return matched / len(required_skills)

    def _calculate_match_score_flexible(self, user_skills: List[str], required_skills: List[str]) -> float:
        if not required_skills:
            return 0.0
        
        matched = sum(1 for skill in user_skills if skill.lower() in [req_skill.lower() for req_skill in required_skills])
        return matched / len(required_skills)
