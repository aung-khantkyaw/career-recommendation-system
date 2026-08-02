import os
import logging
from typing import List, Dict
from embeddings.generator import EmbeddingGenerator
from rag.retriever import CareerRetriever

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CareerRecommender:
    def __init__(self):
        self.embedding_generator = EmbeddingGenerator()
        self.rag_retriever = CareerRetriever()
        self.job_database = self._load_job_database()
    
    def _load_job_database(self) -> List[Dict]:
        return [
            {
                'id': 1,
                'job_title': 'Software Engineer',
                'company': 'Tech Corp',
                'required_skills': ['python', 'javascript', 'react', 'sql', 'git'],
                'description': 'Develop and maintain software applications using modern technologies.'
            },
            {
                'id': 2,
                'job_title': 'Data Scientist',
                'company': 'Data Analytics Inc',
                'required_skills': ['python', 'machine learning', 'data science', 'sql', 'pandas'],
                'description': 'Analyze complex data sets and build predictive models.'
            },
            {
                'id': 3,
                'job_title': 'DevOps Engineer',
                'company': 'Cloud Solutions',
                'required_skills': ['docker', 'kubernetes', 'aws', 'ci/cd', 'linux'],
                'description': 'Manage cloud infrastructure and deployment pipelines.'
            },
            {
                'id': 4,
                'job_title': 'Full Stack Developer',
                'company': 'Web Agency',
                'required_skills': ['react', 'nodejs', 'typescript', 'sql', 'mongodb'],
                'description': 'Build complete web applications from frontend to backend.'
            },
            {
                'id': 5,
                'job_title': 'Machine Learning Engineer',
                'company': 'AI Startup',
                'required_skills': ['python', 'tensorflow', 'pytorch', 'machine learning', 'deep learning'],
                'description': 'Design and implement machine learning systems at scale.'
            },
            {
                'id': 6,
                'job_title': 'Backend Developer',
                'company': 'Enterprise Systems',
                'required_skills': ['java', 'spring', 'sql', 'postgresql', 'redis'],
                'description': 'Develop robust backend services and APIs.'
            },
            {
                'id': 7,
                'job_title': 'Frontend Developer',
                'company': 'Digital Agency',
                'required_skills': ['javascript', 'react', 'typescript', 'css', 'html'],
                'description': 'Create responsive and interactive user interfaces.'
            },
            {
                'id': 8,
                'job_title': 'Cloud Architect',
                'company': 'Tech Giants',
                'required_skills': ['aws', 'azure', 'kubernetes', 'terraform', 'docker'],
                'description': 'Design and implement cloud infrastructure solutions.'
            }
        ]
    
    def recommend_careers(self, user_skills: List[str], resume_text: str, top_k: int = 5) -> List[Dict]:
        recommendations = []
        
        # Get RAG-based career insights
        rag_career_paths = self.rag_retriever.retrieve_career_paths(resume_text, user_skills, top_k)
        
        resume_embedding = self.embedding_generator.generate_embedding(resume_text)
        
        for job in self.job_database:
            match_score = self._calculate_match_score(user_skills, job['required_skills'])
            
            job_text = f"{job['job_title']} {job['description']} {' '.join(job['required_skills'])}"
            job_embedding = self.embedding_generator.generate_embedding(job_text)
            
            semantic_similarity = self.embedding_generator.cosine_similarity(
                resume_embedding, job_embedding
            )
            
            # Find matching RAG career path for additional context
            rag_match = next((path for path in rag_career_paths if job['job_title'] in path['career_path']), None)
            
            combined_score = (match_score * 0.5) + (semantic_similarity * 0.3) + (rag_match['relevance_score'] * 0.2 if rag_match else 0)
            
            skills_matched = [skill for skill in user_skills if skill in job['required_skills']]
            
            recommendations.append({
                'job_title': job['job_title'],
                'company': job['company'],
                'match_score': round(combined_score * 100, 2),
                'skills_matched': skills_matched,
                'description': job['description'],
                'career_path': rag_match['career_path'] if rag_match else None,
                'category': rag_match['category'] if rag_match else None
            })
        
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        
        logger.info(f"Generated {len(recommendations[:top_k])} career recommendations with RAG insights")
        return recommendations[:top_k]
    
    def _calculate_match_score(self, user_skills: List[str], required_skills: List[str]) -> float:
        if not required_skills:
            return 0.0
        
        matched = sum(1 for skill in user_skills if skill in required_skills)
        return matched / len(required_skills)
