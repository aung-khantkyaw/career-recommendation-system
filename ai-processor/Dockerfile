FROM python:3.12-slim AS base

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN rm -f /etc/apt/apt.conf.d/docker-clean; echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

RUN --mount=type=cache,target=/root/.cache/pip \
    python -m spacy download en_core_web_sm || \
    pip install --no-cache-dir https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser


FROM base AS development

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir watchdog

CMD ["watchmedo", "auto-restart", "--directory=.", "--pattern=*.py", "--recursive", "--interval=1", "--", "python", "main.py"]


FROM base AS production

COPY --chown=appuser:appuser . .

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import redis; import os; redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379')); redis_client.ping()" || exit 1

CMD ["python", "main.py"]