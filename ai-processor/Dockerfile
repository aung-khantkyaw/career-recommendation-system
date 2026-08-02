FROM python:3.12-slim AS base

WORKDIR /app

ENV PYTHONUNBUFFERED=1

RUN rm -f /etc/apt/apt.conf.d/docker-clean; echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc

COPY requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --upgrade pip && \
    pip install -r requirements.txt

RUN --mount=type=cache,target=/root/.cache/pip \
    python -m spacy download en_core_web_sm || \
    pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl


FROM base AS development

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install watchdog

CMD ["watchmedo", "auto-restart", "--directory=.", "--pattern=*.py", "--recursive", "--interval=1", "--", "python", "main.py"]


FROM base AS production

COPY . .

CMD ["python", "main.py"]