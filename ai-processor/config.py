import os

DATABASE_URL = (
    f"postgresql://{os.getenv('POSTGRES_USER')}:"
    f"{os.getenv('POSTGRES_PASSWORD')}@"
    f"{os.getenv('POSTGRES_HOST')}:"
    f"{os.getenv('POSTGRES_PORT')}/"
    f"{os.getenv('POSTGRES_DB')}"

)

REDIS_URL = (
    f"redis://{os.getenv('REDIS_HOST')}:"
    f"{os.getenv('REDIS_PORT')}"
)

MINIO_ENDPOINT = (
    f"{os.getenv('MINIO_HOST')}:"
    f"{os.getenv('MINIO_PORT')}"
)
