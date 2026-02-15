from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db, Execution, Task, Agent
from services.nvidia_service import nvidia_service
from typing import Dict, Any

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Get dashboard metrics"""
    # Execution metrics
    total_executions = db.query(Execution).count()
    completed_executions = db.query(Execution).filter(Execution.status == "completed").count()
    failed_executions = db.query(Execution).filter(Execution.status == "failed").count()
    running_executions = db.query(Execution).filter(Execution.status == "running").count()
    
    # Agent metrics
    total_agents = db.query(Agent).filter(Agent.is_active == True).count()
    
    # Task metrics
    total_tasks = db.query(Task).count()
    completed_tasks = db.query(Task).filter(Task.status == "completed").count()
    
    # Token usage from NVIDIA service
    token_usage = nvidia_service.get_token_usage()
    
    # Recent executions
    recent_executions = db.query(Execution).order_by(Execution.started_at.desc()).limit(5).all()
    
    return {
        "executions": {
            "total": total_executions,
            "completed": completed_executions,
            "failed": failed_executions,
            "running": running_executions,
            "success_rate": (completed_executions / total_executions * 100) if total_executions > 0 else 0
        },
        "agents": {
            "total": total_agents
        },
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "completion_rate": (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        },
        "tokens": token_usage,
        "recent_executions": [
            {
                "id": exec.id,
                "workflow_id": exec.workflow_id,
                "status": exec.status,
                "started_at": exec.started_at.isoformat() if exec.started_at else None,
                "completed_at": exec.completed_at.isoformat() if exec.completed_at else None
            }
            for exec in recent_executions
        ]
    }

@router.get("/executions/stats")
async def get_execution_stats(db: Session = Depends(get_db)):
    """Get execution statistics"""
    # Get execution status distribution
    status_distribution = db.query(
        Execution.status, func.count(Execution.id)
    ).group_by(Execution.status).all()
    
    # Get average execution time
    avg_execution_time = db.query(
        func.avg(
            func.julianday(Execution.completed_at) - func.julianday(Execution.started_at)
        )
    ).filter(Execution.status == "completed").scalar()
    
    return {
        "status_distribution": dict(status_distribution),
        "average_execution_time": avg_execution_time,
        "total_executions": db.query(Execution).count()
    }

@router.get("/agents/stats")
async def get_agent_stats(db: Session = Depends(get_db)):
    """Get agent performance statistics"""
    agent_stats = db.query(
        Agent.name,
        func.count(Task.id).label("task_count"),
        func.avg(Task.priority).label("avg_priority")
    ).join(Task, Agent.id == Task.agent_id).group_by(Agent.id).all()
    
    return {
        "agent_performance": [
            {
                "agent_name": stat.name,
                "task_count": stat.task_count,
                "average_priority": stat.avg_priority
            }
            for stat in agent_stats
        ]
    }

@router.get("/tokens/history")
async def get_token_usage_history():
    """Get token usage history"""
    # In a real implementation, this would query a time-series database
    # For now, return current usage
    current_usage = nvidia_service.get_token_usage()
    return {
        "current_usage": current_usage,
        "history": []  # Would contain historical data
    }

@router.post("/tokens/reset")
async def reset_token_usage():
    """Reset token usage counter"""
    nvidia_service.reset_token_usage()
    return {"message": "Token usage reset successfully"}