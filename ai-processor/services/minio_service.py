import os
import boto3
import requests
from urllib.parse import quote
from botocore.client import Config
from config import (
    INFRASTRUCTURE_MODE, MINIO_ENDPOINT, MINIO_ROOT_USER, MINIO_ROOT_PASSWORD,
    STORAGE_BUCKET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MinIOService:
    def __init__(self):
        self.bucket_name = STORAGE_BUCKET
        self.is_cloud = INFRASTRUCTURE_MODE == 'CLOUD'
        if self.is_cloud:
            if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
                raise ValueError('CLOUD storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
            self.base_url = f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/{quote(self.bucket_name, safe='')}"
            self.headers = {
                'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
            }
        else:
            self.client = boto3.client(
                's3', endpoint_url=f"http://{MINIO_ENDPOINT}",
                aws_access_key_id=MINIO_ROOT_USER, aws_secret_access_key=MINIO_ROOT_PASSWORD,
                region_name='us-east-1', config=Config(signature_version='s3v4'),
            )
        logger.info(f"Storage service initialized for bucket: {self.bucket_name}")

    def _cloud_url(self, object_name):
        return f"{self.base_url}/{'/'.join(quote(part, safe='') for part in object_name.split('/'))}"

    def download_file(self, object_name, local_path):
        try:
            if self.is_cloud:
                response = requests.get(self._cloud_url(object_name), headers=self.headers, stream=True, timeout=60)
                response.raise_for_status()
                with open(local_path, 'wb') as output:
                    for chunk in response.iter_content(chunk_size=1024 * 1024):
                        if chunk:
                            output.write(chunk)
            else:
                self.client.download_file(self.bucket_name, object_name, local_path)
            logger.info(f"Downloaded {object_name} to {local_path}")
            return local_path
        except Exception as e:
            logger.error(f"File download failed: {e}")
            raise

    def upload_file(self, file_path, object_name):
        try:
            if self.is_cloud:
                with open(file_path, 'rb') as input_file:
                    response = requests.post(self._cloud_url(object_name), headers=self.headers, data=input_file, timeout=60)
                    response.raise_for_status()
            else:
                self.client.upload_file(file_path, self.bucket_name, object_name)
            logger.info(f"Uploaded {file_path} as {object_name}")
        except Exception as e:
            logger.error(f"File upload failed: {e}")
            raise

    def delete_file(self, object_name):
        try:
            if self.is_cloud:
                response = requests.delete(self._cloud_url(object_name), headers=self.headers, timeout=60)
                response.raise_for_status()
            else:
                self.client.delete_object(Bucket=self.bucket_name, Key=object_name)
            logger.info(f"Deleted {object_name}")
        except Exception as e:
            logger.error(f"File deletion failed: {e}")
            raise
