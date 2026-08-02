import os
from minio import Minio
from minio.error import S3Error
from config import MINIO_ENDPOINT
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MinIOService:
    def __init__(self):
        self.client = Minio(
            MINIO_ENDPOINT,
            access_key=os.getenv('MINIO_ROOT_USER'),
            secret_key=os.getenv('MINIO_ROOT_PASSWORD'),
            secure=False
        )
        self.bucket_name = "resumes"
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Bucket '{self.bucket_name}' created")
        except S3Error as e:
            logger.error(f"MinIO bucket error: {e}")
            raise
    
    def download_file(self, object_name, local_path):
        try:
            self.client.fget_object(self.bucket_name, object_name, local_path)
            logger.info(f"Downloaded {object_name} to {local_path}")
            return local_path
        except S3Error as e:
            logger.error(f"File download failed: {e}")
            raise
    
    def upload_file(self, file_path, object_name):
        try:
            self.client.fput_object(self.bucket_name, object_name, file_path)
            logger.info(f"Uploaded {file_path} as {object_name}")
        except S3Error as e:
            logger.error(f"File upload failed: {e}")
            raise
    
    def delete_file(self, object_name):
        try:
            self.client.remove_object(self.bucket_name, object_name)
            logger.info(f"Deleted {object_name}")
        except S3Error as e:
            logger.error(f"File deletion failed: {e}")
            raise
