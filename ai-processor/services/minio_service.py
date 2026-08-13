import boto3
from botocore.client import Config
from config import MINIO_ENDPOINT, MINIO_ROOT_USER, MINIO_ROOT_PASSWORD
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MinIOService:
    def __init__(self):
        self.client = boto3.client(
            's3',
            endpoint_url=f"http://{MINIO_ENDPOINT}",
            aws_access_key_id=MINIO_ROOT_USER,
            aws_secret_access_key=MINIO_ROOT_PASSWORD,
            region_name='us-east-1',
            config=Config(signature_version='s3v4')
        )
        self.bucket_name = "career-resumes"
        # Don't try to create bucket - web portal handles that with proper policy
        logger.info(f"MinIO service initialized for bucket: {self.bucket_name}")
    
    def download_file(self, object_name, local_path):
        try:
            self.client.download_file(self.bucket_name, object_name, local_path)
            logger.info(f"Downloaded {object_name} to {local_path}")
            return local_path
        except Exception as e:
            logger.error(f"File download failed: {e}")
            raise
    
    def upload_file(self, file_path, object_name):
        try:
            self.client.upload_file(file_path, self.bucket_name, object_name)
            logger.info(f"Uploaded {file_path} as {object_name}")
        except Exception as e:
            logger.error(f"File upload failed: {e}")
            raise
    
    def delete_file(self, object_name):
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=object_name)
            logger.info(f"Deleted {object_name}")
        except Exception as e:
            logger.error(f"File deletion failed: {e}")
            raise
