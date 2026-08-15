import spacy
import logging
from typing import List, Dict
import re
import json
import os
from spacy.matcher import PhraseMatcher
from openai import OpenAI
import psycopg2
from psycopg2.extras import RealDictCursor
from config import DATABASE_URL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SkillExtractionModel:
    def __init__(self, llm_client=None, llm_model=None, llm_provider=None):
        try:
            self.nlp = spacy.load('en_core_web_sm')
            logger.info("spaCy model loaded successfully")
        except OSError:
            logger.warning("spaCy model not found, using basic extraction")
            self.nlp = None
        
        self.llm_client = llm_client
        self.llm_model = llm_model or os.getenv('LLM_MODEL_NAME', 'nvidia/nemotron-3-ultra-550b-a55b:free')
        self.llm_provider = llm_provider or 'openai'
        
        # Database connection parameters
        self.db_url = DATABASE_URL
        
        # Load skills from database or fallback to hardcoded lists
        self.tech_skills, self.soft_skills = self._load_skills_from_db()
        
        # Initialize PhraseMatcher for fast extraction
        if self.nlp:
            # Database skills are normalized to lowercase while resume text keeps
            # its original casing (for example: Python, React, AWS).  The
            # default PhraseMatcher attribute is ORTH, which is case-sensitive,
            # so use LOWER to retain the case-insensitive behaviour of the
            # previous `text.lower()` implementation.
            self.matcher = PhraseMatcher(self.nlp.vocab, attr="LOWER")
            self._init_phrase_matcher()
    
    def _load_skills_from_db(self):
        """Load skills directly from PostgreSQL database"""
        try:
            logger.info("📡 Attempting to load skills from database")
            
            if not self.db_url:
                logger.warning("⚠️ DATABASE_URL not set, returning empty skill lists")
                return [], []
            
            conn = psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT name, category 
                FROM "Skill" 
                WHERE active = true 
                ORDER BY name
            """)
            
            skills = cursor.fetchall()
            cursor.close()
            conn.close()
            
            tech_skills = []
            soft_skills = []
            
            for skill in skills:
                skill_name = skill['name'].lower()
                category = skill['category']
                
                if category == 'TECHNICAL':
                    tech_skills.append(skill_name)
                elif category == 'SOFT':
                    soft_skills.append(skill_name)
            
            logger.info(f"✅ Loaded {len(tech_skills)} tech skills and {len(soft_skills)} soft skills from database")
            return tech_skills, soft_skills
            
        except Exception as e:
            logger.warning(f"⚠️ Failed to load skills from database: {e}, returning empty skill lists")
            return [], []
    
    def _init_phrase_matcher(self):
        """Initialize PhraseMatcher with known skills"""
        all_skills = self.tech_skills + self.soft_skills
        patterns = [self.nlp(skill) for skill in all_skills]
        self.matcher.add("SKILLS", patterns)
    
    def extract_skills(self, text: str) -> Dict[str, List[str]]:
        """3-layer skill extraction: Fast (PhraseMatcher) -> Smart (LLM) -> Fallback (spaCy)"""
        
        # Step 1: Fast Layer - PhraseMatcher for known skills
        fast_result = self._extract_with_phrase_matcher(text)
        
        # Step 2: Smart Layer - LLM for complex skills and structured data
        if self.llm_client:
            try:
                logger.info("🤖 Using LLM for smart skill extraction")
                smart_result = self._extract_with_llm(text, fast_result)
                if smart_result:
                    logger.info(f"✅ LLM extraction successful")
                    return smart_result
            except Exception as e:
                logger.warning(f"⚠️ LLM extraction failed: {e}, falling back to spaCy")
        
        # Step 3: Fallback - Use spaCy results
        logger.info("🔄 Using spaCy fallback extraction")
        return self._extract_with_spacy_fallback(text, fast_result)
    
    def _extract_with_phrase_matcher(self, text: str) -> Dict[str, List[str]]:
        """Fast extraction using PhraseMatcher"""
        extracted = {
            'technical': [],
            'soft': [],
            'all': []
        }
        
        if not self.nlp:
            return extracted
        
        doc = self.nlp(text)
        matches = self.matcher(doc)
        
        for match_id, start, end in matches:
            skill = doc[start:end].text.lower()
            if skill in self.tech_skills:
                extracted['technical'].append(skill)
            elif skill in self.soft_skills:
                extracted['soft'].append(skill)
            extracted['all'].append(skill)
        
        # Remove duplicates
        extracted['technical'] = list(set(extracted['technical']))
        extracted['soft'] = list(set(extracted['soft']))
        extracted['all'] = list(set(extracted['all']))
        
        logger.info(f"⚡ Fast layer extracted {len(extracted['all'])} skills")
        return extracted
    
    def _extract_with_llm(self, text: str, fast_result: Dict) -> Dict[str, List[str]]:
        """Smart extraction using LLM"""
        if not self.llm_client:
            return None
        
        prompt = f"""
        You are given the text of a resume.

        Extract only the information that is explicitly mentioned.

        Instructions:

        1. Return ONLY valid JSON.
        2. Do NOT return markdown.
        3. Do NOT include explanations.
        4. Do NOT invent or infer information.
        5. Preserve the original names of technologies, frameworks, tools and skills.
        6. Remove duplicate values.
        7. Classify every skill as either:
        - technical
        - soft
        8. If a section is missing, return an empty list.
        9. Keep education entries complete whenever possible.
        10. Keep work experience entries complete whenever possible.

        Return this exact JSON format:

        {{
            "technical": [],
            "soft": [],
            "education": [],
            "experience": []
        }}

        Known skills already detected by PhraseMatcher:

        {fast_result["all"]}

        Keep these skills if they actually appear in the resume.
        Only add additional skills that are explicitly mentioned.

        Resume:

        {text[:5000]}
        """

        try:
            if self.llm_provider == 'google':
                # Use Google genai client
                import google.genai as genai
                response = self.llm_client.models.generate_content(
                    model=self.llm_model,
                    contents=prompt
                )
                result_text = response.text if hasattr(response, 'text') else str(response)
            else:
                # Use OpenAI/OpenRouter client
                response = self.llm_client.chat.completions.create(
                    model=self.llm_model,
                    messages=[
                        {
                            "role": "system",
                            "content": """
                                You are an expert ATS (Applicant Tracking System) resume parser.

                                Your responsibilities:
                                - Extract information accurately from resumes.
                                - Return ONLY valid JSON.
                                - Never return markdown or explanations.
                                - Never hallucinate or infer information.
                                - Preserve original wording.
                                - Remove duplicates.
                                - Follow the provided JSON schema exactly.
                                """
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1,
                    max_tokens=2000  # Increased to handle longer responses
                )
                
                # Check if response and choices exist
                if not response or not response.choices or len(response.choices) == 0:
                    logger.error("❌ LLM response is empty or has no choices")
                    return None
                
                if not response.choices[0].message or not response.choices[0].message.content:
                    logger.error("❌ LLM message content is empty")
                    return None
                
                result_text = response.choices[0].message.content.strip()
            
            # Log the raw response for debugging
            logger.info(f"📝 LLM raw response length: {len(result_text)} characters")
            if len(result_text) < 500:
                logger.info(f"📝 LLM raw response preview: {result_text[:200]}")
            
            # Parse JSON from response
            # Handle potential markdown code blocks
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0].strip()
            
            llm_result = json.loads(result_text)
            
            # Ensure all required fields exist
            llm_result.setdefault('technical', [])
            llm_result.setdefault('soft', [])
            llm_result.setdefault('education', [])
            llm_result.setdefault('experience', [])
            
            # Combine with fast results to ensure no skills are missed
            all_skills = list(set(llm_result['technical'] + llm_result['soft'] + fast_result['all']))
            llm_result['all'] = all_skills
            
            logger.info(f"✅ LLM extraction successful: {len(llm_result['all'])} skills, {len(llm_result['education'])} education entries, {len(llm_result['experience'])} experience entries")
            return llm_result
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing error: {e}")
            logger.error(f"❌ Response text that failed to parse: {result_text[:500]}")
            return None
        except Exception as e:
            logger.error(f"❌ LLM extraction error: {e}")
            logger.error(f"❌ Error type: {type(e).__name__}")
            return None
    
    def _extract_with_spacy_fallback(self, text: str, fast_result: Dict) -> Dict[str, List[str]]:
        """Fallback extraction using spaCy"""
        extracted = fast_result.copy()
        
        if self.nlp:
            spacy_entities = self._extract_with_spacy(text)
            extracted['entities'] = spacy_entities.get('entities', [])
        
        # Add education and experience extraction
        extracted['education'] = self.extract_education(text)
        extracted['experience'] = [exp['text'] for exp in self.extract_experience(text)]
        
        logger.info(f"🔄 Fallback extracted {len(extracted['all'])} skills")
        return extracted
    
    def _extract_with_spacy(self, text: str) -> Dict:
        doc = self.nlp(text)
        entities = []
        
        # Keywords to filter out non-skill entities
        exclude_keywords = ['university', 'college', 'institute', 'school', 'company', 'co.', 'ltd', 'corp', 'faculty', 'department']
        
        for ent in doc.ents:
            if ent.label_ in ['ORG', 'PRODUCT', 'WORK_OF_ART']:
                entity_text = ent.text.strip()
                # Filter out universities, companies, etc.
                if not any(keyword in entity_text.lower() for keyword in exclude_keywords):
                    # Only include if it's a known tech term or short enough to be a skill
                    if len(entity_text) < 50 and not any(char.isdigit() for char in entity_text):
                        entities.append(entity_text)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_entities = []
        for entity in entities:
            if entity.lower() not in seen:
                seen.add(entity.lower())
                unique_entities.append(entity)
        
        return {'entities': unique_entities}
    
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
