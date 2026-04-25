from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import uvicorn
import os

from api.routes import agents, workflows, knowledge, execution, monitoring, tools
from core.database import init_db
from core.websocket_manager import websocket_manager
from services.nvidia_service import nvidia_service
from services.vector_store import vector_store

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting up Agentic Workflow Environment...")
    await init_db()
    await vector_store.initialize()
    await nvidia_service.initialize()
    print("✅ Startup complete")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down...")
    await vector_store.close()
    await nvidia_service.close()

app = FastAPI(
    title="Agentic Workflow Environment API",
    description="Personal closed-loop agentic workflow automation system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
# Use environment variable for CORS origins in production
import os
_cors_origins = os.getenv("CORS_ORIGINS", "*").split(",") if os.getenv("CORS_ORIGINS") else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(workflows.router, prefix="/api/workflows", tags=["workflows"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])
app.include_router(execution.router, prefix="/api/execution", tags=["execution"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["monitoring"])
app.include_router(tools.router, prefix="/api/tools", tags=["tools"])

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket_manager.handle_message(websocket, data)
    except WebSocketDisconnect:
        await websocket_manager.disconnect(websocket)

@app.get("/")
async def root():
    return {"message": "Agentic Workflow Environment API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )