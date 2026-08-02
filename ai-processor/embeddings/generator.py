import os
import logging
from typing import List
import numpy as np
from openai import OpenAI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmbeddingGenerator:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model = "text-embedding-3-small"
        self.dimension = 1536
    
    def generate_embedding(self, text: str) -> List[float]:
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=text
            )
            embedding = response.data[0].embedding
            logger.info("Embedding generated successfully")
            return embedding
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=texts
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
