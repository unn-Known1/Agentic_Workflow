from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db, Workflow, Agent
from pydantic import BaseModel
import json

router = APIRouter()

class WorkflowNode(BaseModel):
    id: str
    type: str
    data: dict
    position: dict

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: str = None
    targetHandle: str = None

class WorkflowConfig(BaseModel):
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]

class WorkflowCreate(BaseModel):
    name: str
    description: str
    agent_id: int
    workflow_config: dict

class WorkflowResponse(BaseModel):
    id: int
    name: str
    description: str
    agent_id: int
    workflow_config: dict
    is_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

@router.post("/", response_model=WorkflowResponse)
async def create_workflow(workflow: WorkflowCreate, db: Session = Depends(get_db)):
    # Check if agent exists
    agent = db.query(Agent).filter(Agent.id == workflow.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Check if workflow with same name exists
    existing_workflow = db.query(Workflow).filter(Workflow.name == workflow.name).first()
    if existing_workflow:
        raise HTTPException(status_code=400, detail="Workflow with this name already exists")
    
    db_workflow = Workflow(
        name=workflow.name,
        description=workflow.description,
        agent_id=workflow.agent_id,
        workflow_config=workflow.workflow_config
    )
    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)
    return db_workflow

@router.get("/", response_model=List[WorkflowResponse])
async def list_workflows(db: Session = Depends(get_db)):
    workflows = db.query(Workflow).filter(Workflow.is_active == True).all()
    return workflows

@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: int, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(workflow_id: int, workflow_update: WorkflowCreate, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Check if agent exists
    agent = db.query(Agent).filter(Agent.id == workflow_update.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Check if name is being changed to an existing one
    if workflow.name != workflow_update.name:
        existing_workflow = db.query(Workflow).filter(Workflow.name == workflow_update.name).first()
        if existing_workflow:
            raise HTTPException(status_code=400, detail="Workflow with this name already exists")
    
    workflow.name = workflow_update.name
    workflow.description = workflow_update.description
    workflow.agent_id = workflow_update.agent_id
    workflow.workflow_config = workflow_update.workflow_config
    
    db.commit()
    db.refresh(workflow)
    return workflow

@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: int, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow.is_active = False
    db.commit()
    return {"message": "Workflow deleted successfully"}

@router.get("/templates/list")
async def get_workflow_templates():
    """Get list of pre-built workflow templates"""
    return {
        "templates": [
            {
                "id": "research",
                "name": "Research Workflow",
                "description": "Automated research and analysis workflow",
                "nodes": [
                    {"id": "start", "type": "input", "data": {"label": "Start"}, "position": {"x": 0, "y": 0}},
                    {"id": "research", "type": "agent", "data": {"label": "Research Agent", "agent_type": "researcher"}, "position": {"x": 200, "y": 0}},
                    {"id": "analyze", "type": "agent", "data": {"label": "Analyze Agent", "agent_type": "analyzer"}, "position": {"x": 400, "y": 0}},
                    {"id": "report", "type": "output", "data": {"label": "Generate Report"}, "position": {"x": 600, "y": 0}}
                ],
                "edges": [
                    {"id": "e1", "source": "start", "target": "research"},
                    {"id": "e2", "source": "research", "target": "analyze"},
                    {"id": "e3", "source": "analyze", "target": "report"}
                ]
            },
            {
                "id": "content_creation",
                "name": "Content Creation Workflow",
                "description": "Content generation and optimization workflow",
                "nodes": [
                    {"id": "start", "type": "input", "data": {"label": "Topic Input"}, "position": {"x": 0, "y": 0}},
                    {"id": "outline", "type": "agent", "data": {"label": "Outline Agent", "agent_type": "planner"}, "position": {"x": 200, "y": 0}},
                    {"id": "write", "type": "agent", "data": {"label": "Writer Agent", "agent_type": "executor"}, "position": {"x": 400, "y": 0}},
                    {"id": "edit", "type": "agent", "data": {"label": "Editor Agent", "agent_type": "critic"}, "position": {"x": 400, "y": 100}},
                    {"id": "output", "type": "output", "data": {"label": "Final Content"}, "position": {"x": 600, "y": 0}}
                ],
                "edges": [
                    {"id": "e1", "source": "start", "target": "outline"},
                    {"id": "e2", "source": "outline", "target": "write"},
                    {"id": "e3", "source": "write", "target": "edit"},
                    {"id": "e4", "source": "edit", "target": "output"}
                ]
            }
        ]
    }