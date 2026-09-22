# NitroZace

NitroZace is a complete, production-ready, self-hosted interview coaching platform tailored for legitimate mock practice and self-testing.

**Important Note:** This platform is strictly for mock interview preparation. It contains no features to assist during real live interviews (e.g., hidden windows, meeting detection, screen-share evasion). All AI assistance is visible and active only during declared practice sessions.

## Tech Stack
- **Frontend:** Next.js 14, Tailwind CSS, Framer Motion
- **Backend:** FastAPI (Python 3.11), WebSockets
- **Database:** PostgreSQL with pgvector (via SQLAlchemy)
- **Background Tasks:** Celery + Redis
- **AI Models:** Extensible Abstraction Layer (GPT-4o, Claude 3, Gemini)

## Features
- **Knowledge Base:** Upload Resumes, JDs, and study notes (chunked via pgvector).
- **Mock Interviews:** Real-time AI coaching using WebSocket streaming.
- **Progress Tracking:** Dashboard showing stats and upcoming mocks.
- **Glassmorphism UI:** Built with dark theme and neon blue accents.

## Local Setup with Docker Compose

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/NitroZace.git
   cd NitroZace
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI/Anthropic/Gemini keys and change default passwords
   ```

3. **Start the Platform:**
   ```bash
   docker-compose up --build
   ```

4. **Access the App:**
   - Frontend: `http://localhost:3000`
   - Backend API Docs: `http://localhost:8000/docs`

## Deployment

### Vercel (Frontend)
1. Import the `frontend` folder to Vercel.
2. Set `NEXT_PUBLIC_API_URL` to your hosted backend URL.

### Render / Railway (Backend)
1. Deploy a PostgreSQL instance (with pgvector support) and a Redis instance.
2. Create a Web Service for the FastAPI backend using `backend/Dockerfile`.
3. Create a Worker Service for Celery using `celery -A core.celery_app worker --loglevel=info`.
4. Provide the `.env` variables to both services.

## Architecture

```text
frontend/         Next.js app, UI components, pages
backend/          FastAPI endpoints, WebSocket, Celery worker
  ├── api/        Route definitions
  ├── core/       Config, Database, Security, Celery initialization
  ├── models/     SQLAlchemy models (User, Document, Interview)
  ├── services/   AI Provider layer, Document chunking
  └── worker/     Celery background tasks
docker-compose    Spins up Postgres, Redis, Backend, Worker, Frontend
```
