import os

DATABASE_URL = os.getenv('DATABASE_URL') or (
    f"postgresql://{os.getenv('POSTGRES_USER', 'admin')}:"
    f"{os.getenv('POSTGRES_PASSWORD', 'secretpassword')}@"
    f"{os.getenv('POSTGRES_HOST', 'localhost')}:"
    f"{os.getenv('POSTGRES_PORT', '5432')}/"
    f"{os.getenv('POSTGRES_DB', 'career_system_db')}"

)

REDIS_URL = os.getenv('REDIS_URL') or (
    f"redis://{os.getenv('REDIS_HOST', 'localhost')}:"
    f"{os.getenv('REDIS_PORT', '6379')}"

)

MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT') or (
    f"{os.getenv('MINIO_HOST', 'localhost')}:"
    f"{os.getenv('MINIO_PORT', '9000')}"

)

MINIO_ROOT_USER = os.getenv('MINIO_ROOT_USER', 'admin')
MINIO_ROOT_PASSWORD = os.getenv('MINIO_ROOT_PASSWORD', 'secretpassword')

OPENROUTER_BASE_URL = os.getenv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
