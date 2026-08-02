import logging
from typing import List, Dict
from .knowledge_base import CareerKnowledgeBase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CareerRetriever:
    def __init__(self):
        self.knowledge_base = CareerKnowledgeBase()
    
    def retrieve_career_paths(self, resume_text: str, user_skills: List[str], top_k: int = 5) -> List[Dict]:
        query = f"Skills: {', '.join(user_skills)}. Experience: {resume_text[:500]}"
        relevant_docs = self.knowledge_base.retrieve_relevant_documents(query, top_k)
        
        results = []
        for doc in relevant_docs:
            matched_skills = [skill for skill in user_skills if skill in doc['required_skills']]
            match_score = len(matched_skills) / max(len(doc['required_skills']), 1)
            
            results.append({
                'career_path': doc['title'],
                'category': doc['category'],
                'description': doc['content'],
                'relevance_score': doc['relevance_score'],
                'skill_match_score': match_score,
                'matched_skills': matched_skills,
                'required_skills': doc['required_skills']
            })
        
        results.sort(key=lambda x: (x['relevance_score'] + x['skill_match_score']) / 2, reverse=True)
        return results
    
    def get_career_guidance(self, resume_text: str, user_skills: List[str]) -> str:
        career_paths = self.retrieve_career_paths(resume_text, user_skills, top_k=3)
        
        guidance = "Based on your resume and skills, here are the most suitable career paths:\n\n"
        
        for idx, path in enumerate(career_paths, 1):
            guidance += f"{idx}. {path['career_path']} (Relevance: {path['relevance_score']:.2f})\n"
            guidance += f"   Matched Skills: {', '.join(path['matched_skills'])}\n"
            guidance += f"   Additional Skills Needed: {', '.join(set(path['required_skills']) - set(path['matched_skills']))}\n\n"
        
        return guidance
