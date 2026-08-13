# Career Recommendation System

AI-powered career guidance system with skill extraction, job matching, and real-time processing status updates.

## Table of Contents

- [Architecture](#architecture)
- [API Keys Setup](#api-keys-setup)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Keys Management](#api-keys-management)

## Architecture

The system consists of three main components:

1. **Web Portal** - Next.js frontend with admin dashboard
2. **AI Processor** - Python backend for AI processing (embeddings, skill extraction)
3. **Database** - PostgreSQL with Prisma ORM
4. **Redis** - Queue management and real-time status updates

## API Keys Setup

### Database Schema

API keys are stored in the `SystemConfig` table with the following structure:

```prisma
model SystemConfig {
  id          String   @id @default(uuid())
  key         String   @unique
  value       String
  description String?
  category    String   // AI, RATE_LIMIT, GENERAL, NOTIFICATION
  updatedAt   DateTime @updatedAt
}
```

### Supported API Keys

The system supports the following AI provider API keys:

| Key Name | Category | Description | Required For |
|----------|----------|-------------|--------------|
| `OPENAI_API_KEY` | AI | OpenAI API key for embeddings and LLM | OpenAI embeddings, GPT models |
| `GOOGLE_API_KEY` | AI | Google API key for embeddings | Google embeddings |
| `OPENROUTER_API_KEY` | AI | OpenRouter API key for LLM access | Alternative LLM provider |
| `EMBEDDING_MODEL_NAME` | AI | Name of the embedding model to use | Embedding generation |

### Web Portal Setup

#### 1. Access Admin Panel

Navigate to the admin panel at `/admin` and log in with your credentials.

#### 2. Add API Keys via Admin Panel

1. Go to **Settings** or **System Config** section
2. Click **Add New Config**
3. Fill in the following fields:
   - **Key**: `OPENAI_API_KEY` (or other supported key)
   - **Value**: Your actual API key (e.g., `sk-...`)
   - **Description**: Optional description (e.g., "OpenAI API key for embeddings")
   - **Category**: `AI`
4. Click **Save**

#### 3. API Keys via API Endpoint

You can also add API keys programmatically:

```bash
# Add OpenAI API key
curl -X POST http://localhost:3000/api/admin/system-config \
  -H "Content-Type: application/json" \
  -d '{
    "key": "OPENAI_API_KEY",
    "value": "sk-your-openai-api-key",
    "description": "OpenAI API key for embeddings",
    "category": "AI"
  }'

# Add Google API key
curl -X POST http://localhost:3000/api/admin/system-config \
  -H "Content-Type: application/json" \
  -d '{
    "key": "GOOGLE_API_KEY",
    "value": "your-google-api-key",
    "description": "Google API key for embeddings",
    "category": "AI"
  }'

# Set embedding model
curl -X POST http://localhost:3000/api/admin/system-config \
  -H "Content-Type: application/json" \
  -d '{
    "key": "EMBEDDING_MODEL_NAME",
    "value": "text-embedding-3-small",
    "description": "OpenAI embedding model",
    "category": "AI"
  }'
```

### AI Processor Setup

#### 1. Environment Variables

The AI processor reads API keys from the database, but you can also override them with environment variables:

```bash
# ai-processor/.env
DATABASE_URL=postgresql://user:password@localhost:5432/career_system_db
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_API_KEY=your-google-api-key
OPENROUTER_API_KEY=sk-your-openrouter-api-key
```

#### 2. API Key Loading Priority

The AI processor loads API keys in the following order:

1. **Database** (SystemConfig table) - Highest priority
2. **Environment Variables** - Fallback if database key not found
3. **Default Values** - Last resort

#### 3. Database Service Integration

The `DatabaseService` class in `ai-processor/services/database.py` handles API key retrieval:

```python
class DatabaseService:
    def get_active_api_keys(self):
        """Retrieve active API keys from database"""
        query = """
            SELECT key, value 
            FROM "SystemConfig" 
            WHERE category = 'AI'
        """
        result = self.execute_query(query)
        return result
```

#### 4. Embedding Generator Usage

The `EmbeddingGenerator` class uses the loaded API keys:

```python
class EmbeddingGenerator:
    def __init__(self, db_service):
        self.db_service = db_service
        self.api_keys = db_service.get_active_api_keys()
        
    def generate_embedding(self, text):
        # Uses API keys from database
        openai_key = self.get_api_key('OPENAI_API_KEY')
        # Generate embedding...
```

### Real-Time Status Updates

The system uses Redis for real-time status updates:

1. **AI Processor** pushes status updates to Redis queue:
   ```python
   self.redis_client.lpush('status_updates_queue', json.dumps(message))
   ```

2. **Web Portal** SSE endpoint polls the queue:
   ```typescript
   const result = await redisClient.brPop('status_updates_queue', 5)
   ```

3. **Frontend Hook** receives updates:
   ```typescript
   const { getStatusForEntity } = useStatusUpdates()
   const status = getStatusForEntity('CAREER_PATH', careerId)
   ```

## Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- Redis 7+
- npm or yarn

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CareerRecommendationSystem
```

### 2. Database Setup

```bash
cd web-portal
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### 3. Install Python Dependencies

```bash
cd ai-processor
pip install -r requirements.txt
```

## Environment Variables

### Web Portal (.env.local)

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/career_system_db
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### AI Processor (.env)

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/career_system_db
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_API_KEY=your-google-api-key
OPENROUTER_API_KEY=sk-your-openrouter-api-key
```

## Running the Application

### 1. Start PostgreSQL and Redis

```bash
# Using Docker
docker-compose up -d postgres redis

# Or start services manually
# PostgreSQL
pg_ctl start

# Redis
redis-server
```

### 2. Start Web Portal

```bash
cd web-portal
npm run dev
```

Visit http://localhost:3000

### 3. Start AI Processor

```bash
cd ai-processor
python main.py
```

## API Keys Management

### Adding API Keys

#### Via Admin Panel:
1. Navigate to `/admin`
2. Go to **System Config**
3. Click **Add New Config**
4. Enter key details and save

#### Via API:
```bash
curl -X POST http://localhost:3000/api/admin/system-config \
  -H "Content-Type: application/json" \
  -d '{
    "key": "OPENAI_API_KEY",
    "value": "sk-...",
    "category": "AI"
  }'
```

### Updating API Keys

```bash
curl -X PUT http://localhost:3000/api/admin/system-config/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "value": "new-api-key-value"
  }'
```

### Deleting API Keys

```bash
curl -X DELETE http://localhost:3000/api/admin/system-config/{id}
```

### Listing API Keys

```bash
curl http://localhost:3000/api/admin/system-config?category=AI
```

## Supported Embedding Models

### OpenAI
- `text-embedding-3-small` (Recommended)
- `text-embedding-3-large`
- `text-embedding-ada-002`

### Google
- `embedding-001`
- `embedding-gecko-001`

## Troubleshooting

### API Keys Not Working

1. **Check Database Connection**
   ```bash
   # Verify PostgreSQL is running
   pg_isready
   ```

2. **Check API Keys in Database**
   ```bash
   psql -d career_system_db -c "SELECT * FROM \"SystemConfig\" WHERE category = 'AI';"
   ```

3. **Verify AI Processor Logs**
   ```bash
   cd ai-processor
   python main.py
   # Check for API key loading errors
   ```

### Real-Time Updates Not Working

1. **Check Redis Connection**
   ```bash
   redis-cli ping
   ```

2. **Check Queue Status**
   ```bash
   redis-cli LLEN status_updates_queue
   ```

3. **Verify SSE Connection**
   - Open browser console
   - Check for "SSE connection opened" message
   - Look for "SSE message received" logs

## License

MIT
