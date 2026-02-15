# Agentic Workflow Environment - Backend

## Setup Instructions

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure NVIDIA API:**
   - Get your API key from [NVIDIA AI Foundation Models](https://build.nvidia.com/)
   - Set `NVIDIA_API_KEY` in `.env` file

4. **Run Redis** (optional, for advanced features):
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

5. **Start the server:**
   ```bash
   python main.py
   ```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit `http://localhost:8000/docs` for interactive API documentation.

## Key Features

- **Agent Management**: Create, read, update, delete agents
- **Workflow Builder**: Node-based workflow creation and management
- **Knowledge Base**: Document upload and RAG (Retrieval-Augmented Generation)
- **Execution Engine**: Run workflows with real-time monitoring
- **NVIDIA API Integration**: Uses moonshotai/kimi-k2-thinking model
- **Vector Store**: ChromaDB for semantic search
- **WebSocket Support**: Real-time execution updates

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── core/
│   ├── config.py          # Configuration management
│   ├── database.py        # Database models and connection
│   └── websocket_manager.py # WebSocket handling
├── api/
│   └── routes/
│       ├── agents.py      # Agent management endpoints
│       ├── workflows.py   # Workflow management endpoints
│       ├── knowledge.py   # Knowledge base endpoints
│       ├── execution.py   # Workflow execution endpoints
│       ├── monitoring.py  # Monitoring and analytics
│       └── tools.py       # Tool management endpoints
└── services/
    ├── nvidia_service.py  # NVIDIA API integration
    └── vector_store.py    # Vector database operations