from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db, Agent
from pydantic import BaseModel
import json

router = APIRouter()

class AgentCreate(BaseModel):
    name: str
    role: str
    description: str
    personality: dict
    system_prompt: str

class AgentResponse(BaseModel):
    id: int
    name: str
    role: str
    description: str
    personality: dict
    system_prompt: str
    is_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

@router.post("/", response_model=AgentResponse)
async def create_agent(agent: AgentCreate, db: Session = Depends(get_db)):
    # Check if agent with same name exists
    existing_agent = db.query(Agent).filter(Agent.name == agent.name).first()
    if existing_agent:
        raise HTTPException(status_code=400, detail="Agent with this name already exists")
    
    db_agent = Agent(
        name=agent.name,
        role=agent.role,
        description=agent.description,
        personality=agent.personality,
        system_prompt=agent.system_prompt
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

@router.get("/", response_model=List[AgentResponse])
async def list_agents(db: Session = Depends(get_db)):
    agents = db.query(Agent).filter(Agent.is_active == True).all()
    return agents

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(agent_id: int, agent_update: AgentCreate, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Check if name is being changed to an existing one
    if agent.name != agent_update.name:
        existing_agent = db.query(Agent).filter(Agent.name == agent_update.name).first()
        if existing_agent:
            raise HTTPException(status_code=400, detail="Agent with this name already exists")
    
    agent.name = agent_update.name
    agent.role = agent_update.role
    agent.description = agent_update.description
    agent.personality = agent_update.personality
    agent.system_prompt = agent_update.system_prompt
    
    db.commit()
    db.refresh(agent)
    return agent

@router.delete("/{agent_id}")
async def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent.is_active = False
    db.commit()
    return {"message": "Agent deleted successfully"}

@router.post("/{agent_id}/clone")
async def clone_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Create clone with "Copy" suffix
    clone_name = f"{agent.name} (Copy)"
    existing_clone = db.query(Agent).filter(Agent.name == clone_name).first()
    count = 1
    while existing_clone:
        count += 1
        clone_name = f"{agent.name} (Copy {count})"
        existing_clone = db.query(Agent).filter(Agent.name == clone_name).first()
    
    cloned_agent = Agent(
        name=clone_name,
        role=agent.role,
        description=agent.description,
        personality=agent.personality.copy(),
        system_prompt=agent.system_prompt
    )
    db.add(cloned_agent)
    db.commit()
    db.refresh(cloned_agent)
    return cloned_agent