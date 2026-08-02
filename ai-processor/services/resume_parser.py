import os
import tempfile
import logging
from PyPDF2 import PdfReader
from docx import Document

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResumeParser:
    def __init__(self, minio_service):
        self.minio_service = minio_service
    
    def parse_resume(self, object_name):
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.tmp') as tmp_file:
                local_path = tmp_file.name
            
            self.minio_service.download_file(object_name, local_path)
            
            if object_name.lower().endswith('.pdf'):
                text = self._parse_pdf(local_path)
            elif object_name.lower().endswith('.docx'):
                text = self._parse_docx(local_path)
            else:
                text = self._parse_text(local_path)
            
            os.unlink(local_path)
            logger.info(f"Successfully parsed resume: {object_name}")
            return text
            
        except Exception as e:
            logger.error(f"Resume parsing failed: {e}")
            if os.path.exists(local_path):
                os.unlink(local_path)
            raise
    
    def _parse_pdf(self, file_path):
        try:
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"PDF parsing failed: {e}")
            raise
    
    def _parse_docx(self, file_path):
        try:
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"DOCX parsing failed: {e}")
            raise
    
    def _parse_text(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            with open(file_path, 'r', encoding='latin-1') as f:
                return f.read()
