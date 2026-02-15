from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db, Workflow, Execution, Task
from services.nvidia_service import nvidia_service
from pydantic import BaseModel
import json
import asyncio
from datetime import datetime

router = APIRouter()

class ExecuteWorkflowRequest(BaseModel):
    workflow_id: int
    input_data: dict = {}

class ExecutionResponse(BaseModel):
    id: int
    workflow_id: int
    status: str
    started_at: str
    completed_at: str = None
    execution_log: str = None
    metrics: dict = {}

    class Config:
        from_attributes = True

# In-memory execution status (in production, use Redis)
execution_status = {}

async def execute_workflow_task(execution_id: int, workflow_id: int, input_data: dict, db: Session):
    """Background task to execute a workflow"""
    try:
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
        
        if not execution or not workflow:
            return
        
        # Update status to running
        execution.status = "running"
        db.commit()
        
        execution_log = []
        metrics = {
            "total_tokens": 0,
            "total_time": 0,
            "steps_completed": 0,
            "steps_failed": 0
        }
        
        try:
            # Parse workflow config
            workflow_config = workflow.workflow_config
            nodes = {node["id"]: node for node in workflow_config.get("nodes", [])}
            edges = workflow_config.get("edges", [])
            
            execution_log.append(f"Starting workflow: {workflow.name}")
            
            # Simple execution: process nodes in order (in real implementation, use topological sort)
            for node_id, node in nodes.items():
                if node["type"] == "input":
                    continue
                
                execution_log.append(f"Executing node: {node['data'].get('label', node_id)}")
                
                # Simulate agent execution
                agent_type = node["data"].get("agent_type", "executor")
                
                # Call NVIDIA API
                messages = [
                    {"role": "system", "content": f"You are a {agent_type} agent. Process this task."},
                    {"role": "user", "content": json.dumps(input_data)}
                ]
                
                response = await nvidia_service.chat_completion(
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1000
                )
                
                if response["success"]:
                    execution_log.append(f"✅ Node {node_id} completed successfully")
                    metrics["steps_completed"] += 1
                    metrics["total_tokens"] += response["tokens_used"].get("total_tokens", 0)
                    metrics["total_time"] += response["time_taken"]
                else:
                    execution_log.append(f"❌ Node {node_id} failed: {response['error']}")
                    metrics["steps_failed"] += 1
            
            execution_log.append("Workflow execution completed")
            execution.status = "completed"
            execution.completed_at = datetime.utcnow()
            
        except Exception as e:
            execution_log.append(f"Workflow execution failed: {str(e)}")
            execution.status = "failed"
            execution.completed_at = datetime.utcnow()
        
        execution.execution_log = "\n".join(execution_log)
        execution.metrics = metrics
        db.commit()
        
        # Store in execution status for real-time updates
        execution_status[execution_id] = {
            "status": execution.status,
            "log": execution_log,
            "metrics": metrics
        }
        
    except Exception as e:
        print(f"Error in execute_workflow_task: {e}")

@router.post("/execute", response_model=ExecutionResponse)
async def execute_workflow(
    request: ExecuteWorkflowRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Execute a workflow"""
    workflow = db.query(Workflow).filter(Workflow.id == request.workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Create execution record
    execution = Execution(
        workflow_id=request.workflow_id,
        status="pending",
        metrics={}
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    # Start execution in background
    background_tasks.add_task(
        execute_workflow_task,
        execution.id,
        request.workflow_id,
        request.input_data,
        db
    )
    
    return execution

@router.get("/executions", response_model=List[ExecutionResponse])
async def list_executions(db: Session = Depends(get_db)):
    """List all executions"""
    executions = db.query(Execution).all()
    return executions

@router.get("/executions/{execution_id}", response_model=ExecutionResponse)
async def get_execution(execution_id: int, db: Session = Depends(get_db)):
    """Get execution details"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution

@router.get("/executions/{execution_id}/status")
async def get_execution_status(execution_id: int):
    """Get real-time execution status"""
    if execution_id in execution_status:
        return execution_status[execution_id]
    return {"status": "unknown", "log": [], "metrics": {}}

@router.post("/executions/{execution_id}/stop")
async def stop_execution(execution_id: int, db: Session = Depends(get_db)):
    """Stop a running execution"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    if execution.status == "running":
        execution.status = "failed"
        execution.completed_at = datetime.utcnow()
        db.commit()
        
        if execution_id in execution_status:
            execution_status[execution_id]["status"] = "failed"
        
        return {"message": "Execution stopped"}
    
    return {"message": "Execution is not running"}