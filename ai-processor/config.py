import os
from pathlib import Path

from dotenv import load_dotenv

# Load the processor's own settings no matter which directory starts Python.
# Existing environment variables still take precedence (the default behavior of
# ``load_dotenv``), which keeps container and deployment configuration intact.
load_dotenv(Path(__file__).resolve().with_name('.env'))

INFRASTRUCTURE_MODE = os.getenv('INFRASTRUCTURE_MODE', 'DOCKER').upper()
if INFRASTRUCTURE_MODE not in {'DOCKER', 'CLOUD'}:
    raise ValueError('INFRASTRUCTURE_MODE must be DOCKER or CLOUD')

_docker_database_url = (
    f"postgresql://{os.getenv('POSTGRES_USER', 'admin')}:"
    f"{os.getenv('POSTGRES_PASSWORD', 'replace-me')}@"
    f"{os.getenv('POSTGRES_HOST', 'localhost')}:"
    f"{os.getenv('POSTGRES_PORT', '5432')}/"
    f"{os.getenv('POSTGRES_DB', 'career_system_db')}"
)
DATABASE_URL = os.getenv('DATABASE_URL') or _docker_database_url

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
UPSTASH_REDIS_REST_URL = os.getenv('UPSTASH_REDIS_REST_URL')
UPSTASH_REDIS_REST_TOKEN = os.getenv('UPSTASH_REDIS_REST_TOKEN')

MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT') or (
    f"{os.getenv('MINIO_HOST', 'localhost')}:{os.getenv('MINIO_PORT', '9000')}"
)
MINIO_ROOT_USER = os.getenv('MINIO_ROOT_USER', 'admin')
MINIO_ROOT_PASSWORD = os.getenv('MINIO_ROOT_PASSWORD', 'replace-me')
STORAGE_BUCKET = os.getenv('SUPABASE_STORAGE_BUCKET') if INFRASTRUCTURE_MODE == 'CLOUD' else os.getenv('MINIO_BUCKET', 'career-resumes')
SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

OPENROUTER_BASE_URL = os.getenv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
