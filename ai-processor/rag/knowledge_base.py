import logging
from typing import List, Dict, Tuple
import numpy as np
from embeddings.generator import EmbeddingGenerator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CareerKnowledgeBase:
    def __init__(self):
        self.embedding_generator = EmbeddingGenerator()
        self.documents = self._load_career_documents()
        self.embeddings = None
        self._index_documents()
    
    def _load_career_documents(self) -> List[Dict]:
        return [
            {
                'id': 1,
                'title': 'Software Engineering Career Path',
                'content': 'Software engineers design, develop, and maintain software applications. Key skills include programming languages like Python, Java, JavaScript, frameworks like React and Django, database management with SQL, and version control with Git. Career progression typically goes from Junior Developer to Senior Developer to Tech Lead to Engineering Manager.',
                'category': 'engineering',
                'required_skills': ['python', 'java', 'javascript', 'react', 'sql', 'git']
            },
            {
                'id': 2,
                'title': 'Data Science Career Path',
                'content': 'Data scientists analyze complex data to help organizations make decisions. Required skills include Python, R, SQL, machine learning frameworks like TensorFlow and PyTorch, statistical analysis, and data visualization. Career paths include Data Analyst, Data Scientist, Senior Data Scientist, and Head of Data Science.',
                'category': 'data',
                'required_skills': ['python', 'machine learning', 'sql', 'tensorflow', 'pytorch', 'statistics']
            },
            {
                'id': 3,
                'title': 'DevOps Engineering Career Path',
                'content': 'DevOps engineers bridge development and operations, focusing on CI/CD pipelines, infrastructure automation, and system reliability. Key technologies include Docker, Kubernetes, AWS/Azure/GCP, Terraform, and monitoring tools. Career progression includes DevOps Engineer, Senior DevOps, and Platform Engineer.',
                'category': 'infrastructure',
                'required_skills': ['docker', 'kubernetes', 'aws', 'terraform', 'ci/cd', 'linux']
            },
            {
                'id': 4,
                'title': 'Machine Learning Engineering Career Path',
                'content': 'ML engineers deploy and scale machine learning models. Skills include Python, deep learning frameworks, MLOps tools, cloud platforms, and software engineering best practices. Career stages include ML Engineer, Senior ML Engineer, and ML Architect.',
                'category': 'ml',
                'required_skills': ['python', 'tensorflow', 'pytorch', 'mlops', 'aws', 'kubernetes']
            },
            {
                'id': 5,
                'title': 'Full Stack Development Career Path',
                'content': 'Full stack developers work on both frontend and backend. Frontend skills include React, Vue, Angular, CSS/HTML. Backend skills include Node.js, Python, Java, databases. Full stack engineers often become technical leads or solution architects.',
                'category': 'engineering',
                'required_skills': ['react', 'nodejs', 'python', 'sql', 'mongodb', 'javascript']
            },
            {
                'id': 6,
                'title': 'Cloud Architecture Career Path',
                'content': 'Cloud architects design cloud infrastructure and solutions. Expertise in AWS, Azure, or GCP is essential, along with networking, security, and cost optimization. Career progression includes Cloud Engineer, Cloud Architect, and Cloud Solutions Architect.',
                'category': 'infrastructure',
                'required_skills': ['aws', 'azure', 'gcp', 'networking', 'security', 'terraform']
            },
            {
                'id': 7,
                'title': 'Product Management Career Path',
                'content': 'Product managers define product vision and strategy. Skills include market research, user experience design, data analysis, communication, and project management. Career paths include Associate PM, Product Manager, Senior PM, and Director of Product.',
                'category': 'product',
                'required_skills': ['communication', 'analytics', 'project management', 'user experience', 'strategy']
            },
            {
                'id': 8,
                'title': 'Cybersecurity Career Path',
                'content': 'Cybersecurity professionals protect organizations from digital threats. Skills include network security, ethical hacking, security tools, compliance, and incident response. Careers include Security Analyst, Security Engineer, and Security Architect.',
                'category': 'security',
                'required_skills': ['networking', 'security', 'ethical hacking', 'compliance', 'incident response']
            }
        ]
    
    def _index_documents(self):
        logger.info("Indexing career knowledge base...")
        texts = [doc['content'] for doc in self.documents]
        self.embeddings = self.embedding_generator.generate_embeddings_batch(texts)
        logger.info(f"Indexed {len(self.documents)} documents")
    
    def retrieve_relevant_documents(self, query: str, top_k: int = 3) -> List[Dict]:
        query_embedding = self.embedding_generator.generate_embedding(query)
        
        similarities = []
        for idx, doc_embedding in enumerate(self.embeddings):
            similarity = self.embedding_generator.cosine_similarity(query_embedding, doc_embedding)
            similarities.append((similarity, idx))
        
        similarities.sort(reverse=True, key=lambda x: x[0])
        
        relevant_docs = []
        for similarity, idx in similarities[:top_k]:
            doc = self.documents[idx].copy()
            doc['relevance_score'] = similarity
            relevant_docs.append(doc)
        
        logger.info(f"Retrieved {len(relevant_docs)} relevant documents")
        return relevant_docs
    
    def get_career_insights(self, query: str) -> str:
        relevant_docs = self.retrieve_relevant_documents(query, top_k=2)
        
        insights = []
        for doc in relevant_docs:
            insights.append(f"Career Path: {doc['title']}\n{doc['content']}\n")
        
        return "\n".join(insights)
