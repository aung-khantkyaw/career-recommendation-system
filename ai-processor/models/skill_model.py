import spacy
import logging
from typing import List, Dict
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SkillExtractionModel:
    def __init__(self):
        try:
            self.nlp = spacy.load('en_core_web_sm')
            logger.info("spaCy model loaded successfully")
        except OSError:
            logger.warning("spaCy model not found, using basic extraction")
            self.nlp = None
        
        self.tech_skills = self._load_tech_skills()
        self.soft_skills = self._load_soft_skills()
    
    def _load_tech_skills(self):
        return [
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust',
            'react', 'angular', 'vue', 'nodejs', 'django', 'flask', 'spring',
            'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis',
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform',
            'git', 'ci/cd', 'jenkins', 'linux', 'bash', 'shell',
            'machine learning', 'deep learning', 'nlp', 'data science',
            'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy',
            'agile', 'scrum', 'jira', 'confluence', 'figma', 'photoshop'
        ]
    
    def _load_soft_skills(self):
        return [
            'communication', 'leadership', 'teamwork', 'problem solving',
            'critical thinking', 'time management', 'adaptability', 'creativity',
            'collaboration', 'analytical', 'project management', 'presentation'
        ]
    
    def extract_skills(self, text: str) -> Dict[str, List[str]]:
        extracted = {
            'technical': [],
            'soft': [],
            'all': []
        }
        
        text_lower = text.lower()
        
        for skill in self.tech_skills:
            if skill in text_lower:
                extracted['technical'].append(skill)
                extracted['all'].append(skill)
        
        for skill in self.soft_skills:
            if skill in text_lower:
                extracted['soft'].append(skill)
                extracted['all'].append(skill)
        
        if self.nlp:
            extracted.update(self._extract_with_spacy(text))
        
        extracted['technical'] = list(set(extracted['technical']))
        extracted['soft'] = list(set(extracted['soft']))
        extracted['all'] = list(set(extracted['all']))
        
        logger.info(f"Extracted {len(extracted['all'])} skills")
        return extracted
    
    def _extract_with_spacy(self, text: str) -> Dict:
        doc = self.nlp(text)
        entities = []
        
        for ent in doc.ents:
            if ent.label_ in ['ORG', 'PRODUCT', 'WORK_OF_ART']:
                entities.append(ent.text)
        
        return {'entities': entities}
    
    def extract_experience(self, text: str) -> List[Dict]:
        experience = []
        
        patterns = [
            r'(\d+)\+?\s*years?\s*(of)?\s*(experience)',
            r'experience\s*(?:in|as|with)\s*([^.,\n]+)'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                experience.append({
                    'text': match.group(0),
                    'start': match.start(),
                    'end': match.end()
                })
        
        return experience
    
    def extract_education(self, text: str) -> List[str]:
        education_keywords = [
            'bachelor', 'master', 'phd', 'doctorate', 'degree',
            'university', 'college', 'institute', 'school'
        ]
        
        education = []
        sentences = text.split('.')
        
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in education_keywords):
                education.append(sentence.strip())
        
        return education
