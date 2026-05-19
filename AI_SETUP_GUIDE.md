# AI Dependencies Configuration Guide

This guide will help you configure the AI dependencies for the Farm Lease application.

## Overview

The AI module requires 4 main dependencies:
1. **Storage Integration (MinIO/S3)** - For file uploads (documents, images)
2. **Queue System (BullMQ + Redis)** - For document ingestion jobs
3. **LLM Integration (OpenAI/Gemini)** - For embeddings and chat
4. **Event Bus (Outbox Pattern)** - For event-driven architecture

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm installed
- OpenAI API key or Gemini API key (for LLM)

---

## Step 1: Start Docker Services

The project includes a docker-compose file with MinIO, Redis, PostgreSQL, and Mailhog.

```bash
cd docker
docker-compose up -d
```

This will start:
- **MinIO** (ports 9000, 9001) - S3-compatible object storage
- **Redis** (port 6379) - Queue system backend
- **PostgreSQL** (port 5432) - Database with pgvector
- **Mailhog** (ports 1025, 8025) - Email testing

Verify services are running:
```bash
docker-compose ps
```

---

## Step 2: Configure Storage Integration (MinIO)

MinIO is already configured in docker-compose. You need to:

1. **Access MinIO Console**
   - Open http://localhost:9001
   - Username: `minioadmin`
   - Password: `minioadmin`

2. **Create a Bucket**
   - Click "Create Bucket"
   - Name it: `farm-lease`
   - Click "Create Bucket"

3. **Set Bucket Policy (Optional)**
   - Select the bucket
   - Click "Access Policy"
   - Set to public or private as needed

4. **Configure Environment Variables**

Add these to your `.env` file:

```env
# Storage Configuration
STORAGE_DRIVER=minio
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=farm-lease
S3_FORCE_PATH_STYLE=true
```

---

## Step 3: Configure Queue System (BullMQ + Redis)

Redis is already running from docker-compose. You need to:

1. **Configure Environment Variables**

Add to your `.env` file:

```env
# Redis Configuration (for queues)
REDIS_URL=redis://localhost:6379
```

2. **Start the Worker Process**

The queue system requires a separate worker process to handle background jobs:

```bash
npm run dev:worker
```

This will start the worker that processes:
- Email jobs
- Notification jobs
- AI ingestion jobs (document processing)
- PDF rendering
- Receipt OCR
- Recommendations

---

## Step 4: Configure LLM Integration (OpenAI/Gemini/Voyage AI/Groq/Ollama)

The AI module supports OpenAI, Gemini, Voyage AI, Groq, or Ollama for embeddings and chat.

### Option A: OpenAI

1. **Get API Key**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key

2. **Configure Environment Variables**

```env
# OpenAI Configuration
AI_LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### Option B: Google Gemini

1. **Get API Key**
   - Go to https://aistudio.google.com/app/apikey
   - Create a new API key

2. **Configure Environment Variables**

```env
# Gemini Configuration
AI_LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

### Option C: Voyage AI (Recommended for Embeddings)

Voyage AI specializes in high-quality embeddings and offers a generous free tier.

1. **Get API Key**
   - Go to https://dash.voyageai.com/api-keys
   - Create a new API key
   - Free tier: 200M tokens/month for embeddings

2. **Configure Environment Variables**

```env
# Voyage AI Configuration
AI_LLM_PROVIDER=voyage
VOYAGE_API_KEY=your_voyage_api_key_here
VOYAGE_EMBEDDING_MODEL=voyage-3
```

**Note:** Voyage AI is an embedding-only provider. For chat functionality, you'll need to use OpenAI or Gemini. You can use Voyage AI for embeddings (document ingestion, search) and OpenAI/Gemini for chat by setting up a hybrid approach.

### Option D: Groq (Fast Inference on Open-Source Models)

Groq offers very fast inference on open-source models like Llama, Mixtral, etc. with a generous free tier.

1. **Get API Key**
   - Go to https://console.groq.com/keys
   - Create a new API key
   - Free tier: Available with no credit card required

2. **Configure Environment Variables**

```env
# Groq Configuration
AI_LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_CHAT_MODEL=llama-3.3-70b-versatile
GROQ_EMBEDDING_MODEL=nomic-embed-text-v1.5
```

**Note:** Groq is a chat-only provider and does not support embeddings. For embeddings, you must use OpenAI, Gemini, or Voyage AI. You can use Groq for chat and another provider for embeddings in a hybrid setup.

### Option E: Ollama (Local, Free)

Ollama runs locally on your machine and provides free embeddings and chat with no API costs. Perfect for RAG systems and development.

1. **Install Ollama**

   Download and install from: https://ollama.ai/

2. **Pull the Embedding Model**

   ```bash
   ollama pull nomic-embed-text
   ```

   Optionally pull a chat model:
   ```bash
   ollama pull llama3
   ```

3. **Start Ollama**

   ```bash
   ollama serve
   ```

   Ollama will start on `http://localhost:11434`

4. **Configure Environment Variables**

```env
# Ollama Configuration
AI_LLM_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_CHAT_MODEL=llama3
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

**Note:** Ollama runs entirely on your local machine with no API costs. It's ideal for development and RAG systems. Ensure Ollama is running before starting the worker.

---

## Step 5: Configure Event Bus (Outbox Pattern)

The event bus uses the outbox pattern with BullMQ. It's already configured in the codebase.

1. **Verify Configuration**

The event bus uses the same Redis connection as the queue system. No additional configuration needed if Redis is running.

2. **Start the Outbox Dispatcher**

The outbox dispatcher is part of the worker process started in Step 3. It will automatically:
- Drain the outbox table
- Dispatch events to the appropriate queues
- Handle retries on failure

---

## Step 6: Verify Configuration

1. **Start the Backend Server**

```bash
npm run dev
```

2. **Test AI Endpoints**

You can now test the AI endpoints:
- `POST /api/ai/knowledge-bases` - Create a knowledge base
- `POST /api/ai/knowledge-bases/:id/documents` - Upload documents
- `POST /api/ai/chat` - Chat with AI
- `POST /api/ai/search` - Search knowledge base

3. **Check Worker Logs**

The worker process should show logs like:
```
[worker] Processing AI ingestion job for document: xxx
[worker] Document indexed successfully
```

---

## Troubleshooting

### MinIO Connection Issues

**Problem**: Cannot connect to MinIO
**Solution**:
- Verify Docker is running: `docker ps`
- Check MinIO logs: `docker-compose logs minio`
- Ensure port 9000 is not in use

### Redis Connection Issues

**Problem**: Cannot connect to Redis
**Solution**:
- Verify Redis is running: `docker-compose ps`
- Test connection: `redis-cli ping`
- Check Redis logs: `docker-compose logs redis`

### Queue Jobs Not Processing

**Problem**: Jobs are queued but not processed
**Solution**:
- Ensure worker process is running: `npm run dev:worker`
- Check worker logs for errors
- Verify Redis connection

### LLM API Errors

**Problem**: OpenAI/Gemini API errors
**Solution**:
- Verify API key is correct
- Check API key has sufficient credits
- Test API key manually using curl or Postman

### 502 Bad Gateway Errors

**Problem**: Backend returns 502 on AI endpoints
**Solution**:
- Restart backend server after configuration changes
- Check all dependencies are running (MinIO, Redis, Worker)
- Verify environment variables are set correctly

---

## Environment Variables Reference

Here's a complete list of environment variables for AI dependencies:

```env
# Storage (MinIO/S3)
STORAGE_DRIVER=minio
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=farm-lease
S3_FORCE_PATH_STYLE=true

# Queue System (Redis)
REDIS_URL=redis://localhost:6379

# LLM (OpenAI)
AI_LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# LLM (Gemini) - alternative
AI_LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# LLM (Voyage AI) - recommended for embeddings
AI_LLM_PROVIDER=voyage
VOYAGE_API_KEY=your_voyage_api_key_here
VOYAGE_EMBEDDING_MODEL=voyage-3

# LLM (Groq) - fast inference on open-source models
AI_LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_CHAT_MODEL=llama-3.3-70b-versatile
GROQ_EMBEDDING_MODEL=nomic-embed-text-v1.5

# LLM (Ollama) - local, free inference
AI_LLM_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_CHAT_MODEL=llama3
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

---

## Production Deployment

For production deployment:

1. **Use Cloud Services**
   - Replace MinIO with AWS S3, R2, or Backblaze B2
   - Use managed Redis (ElastiCache, Upstash)
   - Use managed PostgreSQL (RDS, Neon)

2. **Secure Credentials**
   - Use environment-specific secrets manager
   - Never commit `.env` files
   - Rotate API keys regularly

3. **Scale Workers**
   - Run multiple worker instances
   - Use horizontal pod autoscaling
   - Monitor queue depth

---

## Summary

After completing these steps:

✅ Docker services running (MinIO, Redis, PostgreSQL)
✅ Storage configured (MinIO bucket created)
✅ Queue system configured (Redis + Worker running)
✅ LLM configured (OpenAI or Gemini API key)
✅ Event bus configured (Outbox pattern with worker)
✅ Backend server restarted
✅ AI endpoints tested and working

The AI module should now be fully functional!
