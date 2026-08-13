import os
import logging
from typing import List, Optional
import numpy as np
from openai import OpenAI
import google.genai as genai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmbeddingGenerator:
    def __init__(self, provider: Optional[str] = None, model: Optional[str] = None, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.provider = (provider or os.getenv('EMBEDDING_PROVIDER', 'openai')).lower()
        self.model = model or os.getenv('EMBEDDING_MODEL', 'text-embedding-3-small')
        self.base_url = base_url
        self.dimension = 2048  # Default for OpenRouter/OpenAI

        if self.provider == 'google':
            if not api_key:
                api_key = os.getenv('GOOGLE_API_KEY')
            if api_key:
                self.client = genai.Client(api_key=api_key)
                # Set dimension based on Google model
                if 'embedding-2' in self.model:
                    self.dimension = 3072  # gemini-embedding-2 dimension
                elif 'embedding' in self.model:
                    self.dimension = 2048  # Other Google embedding models
                else:
                    self.dimension = 768  # Older Google embedding models
                logger.info(f"Initialized Google genai embedding model: {self.model} (dimension: {self.dimension})")
            else:
                logger.warning("GOOGLE_API_KEY not found, falling back to OpenAI")
                self.provider = 'openai'
                self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        else:
            if not api_key:
                api_key = os.getenv('OPENAI_API_KEY') or os.getenv('OPENROUTER_API_KEY')
            if not base_url:
                base_url = os.getenv('OPENROUTER_BASE_URL') or os.getenv('OPENAI_BASE_URL')
            
            if not api_key:
                raise ValueError("Missing API key. Please provide api_key parameter or set OPENAI_API_KEY/OPENROUTER_API_KEY environment variable.")
            
            # Configure OpenRouter-specific headers if using OpenRouter
            default_headers = {}
            if base_url and 'openrouter' in base_url.lower():
                default_headers = {
                    "HTTP-Referer": os.getenv('SITE_URL', 'http://localhost'),
                    "X-OpenRouter-Title": os.getenv('SITE_NAME', 'Career Recommendation System')
                }
            
            self.client = OpenAI(api_key=api_key, base_url=base_url, default_headers=default_headers)
            logger.info(f"Initialized {self.provider} embedding model: {self.model}")

    def generate_embedding(self, text: str) -> List[float]:
        try:
            if self.provider == 'google':
                response = self.client.models.embed_content(
                    model=self.model,
                    contents=text,
                    config=genai.EmbedContentConfig(task_type="retrieval_document") if hasattr(genai, 'EmbedContentConfig') else None
                )
                embedding = response.embeddings[0].values
            else:
                # Add encoding_format for OpenRouter compatibility
                extra_params = {}
                if self.base_url and 'openrouter' in self.base_url.lower():
                    extra_params['encoding_format'] = 'float'
                
                response = self.client.embeddings.create(
                    model=self.model,
                    input=text,
                    **extra_params
                )
                embedding = response.data[0].embedding

            logger.info("Embedding generated successfully")
            return embedding
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise

    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        try:
            if self.provider == 'google':
                response = self.client.models.embed_content(
                    model=self.model,
                    contents=texts,
                    config=genai.EmbedContentConfig(task_type="retrieval_document") if hasattr(genai, 'EmbedContentConfig') else None
                )
                embeddings = [emb.values for emb in response.embeddings]
            else:
                # Add encoding_format for OpenRouter compatibility
                extra_params = {}
                if self.base_url and 'openrouter' in self.base_url.lower():
                    extra_params['encoding_format'] = 'float'
                
                response = self.client.embeddings.create(
                    model=self.model,
                    input=texts,
                    **extra_params
                )
                embeddings = [item.embedding for item in response.data]

            logger.info(f"Generated {len(embeddings)} embeddings")
            return embeddings
        except Exception as e:
            logger.error(f"Batch embedding generation failed: {e}")
            raise

    def cosine_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        try:
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            return dot_product / (norm1 * norm2)
        except Exception as e:
            logger.error(f"Similarity calculation failed: {e}")
            return 0.0
