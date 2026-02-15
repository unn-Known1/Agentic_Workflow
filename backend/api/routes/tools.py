from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
import json
import os

router = APIRouter()

# In-memory tool registry (in production, use database)
registered_tools = {}

class ToolDefinition(BaseModel):
    name: str
    description: str
    parameters: dict
    function_code: str

@router.post("/register")
async def register_tool(tool: ToolDefinition):
    """Register a new custom tool"""
    if tool.name in registered_tools:
        raise HTTPException(status_code=400, detail="Tool with this name already exists")
    
    # Basic validation
    try:
        # Try to compile the function code
        compile(tool.function_code, f"<{tool.name}>", "exec")
    except SyntaxError as e:
        raise HTTPException(status_code=400, detail=f"Invalid function code: {str(e)}")
    
    registered_tools[tool.name] = {
        "name": tool.name,
        "description": tool.description,
        "parameters": tool.parameters,
        "function_code": tool.function_code,
        "created_at": time.time()
    }
    
    return {"message": f"Tool '{tool.name}' registered successfully"}

@router.get("/list")
async def list_tools():
    """List all registered tools"""
    return {
        "tools": [
            {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": tool["parameters"],
                "created_at": tool["created_at"]
            }
            for tool in registered_tools.values()
        ]
    }

@router.get("/{tool_name}")
async def get_tool(tool_name: str):
    """Get tool details"""
    if tool_name not in registered_tools:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    tool = registered_tools[tool_name]
    return {
        "name": tool["name"],
        "description": tool["description"],
        "parameters": tool["parameters"]
    }

@router.delete("/{tool_name}")
async def delete_tool(tool_name: str):
    """Delete a tool"""
    if tool_name not in registered_tools:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    del registered_tools[tool_name]
    return {"message": f"Tool '{tool_name}' deleted successfully"}

@router.post("/{tool_name}/execute")
async def execute_tool(tool_name: str, parameters: dict):
    """Execute a tool with given parameters"""
    if tool_name not in registered_tools:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    tool = registered_tools[tool_name]
    
    # Validate parameters
    required_params = tool["parameters"].get("required", [])
    for param in required_params:
        if param not in parameters:
            raise HTTPException(status_code=400, detail=f"Missing required parameter: {param}")
    
    # Execute the tool (in a sandboxed environment in production)
    try:
        # Create a safe execution environment
        exec_globals = {
            "__builtins__": {
                "len": len, "str": str, "int": int, "float": float, "list": list,
                "dict": dict, "set": set, "tuple": tuple, "range": range,
                "sum": sum, "min": min, "max": max, "sorted": sorted
            }
        }
        exec_locals = {}
        
        # Execute the function code
        exec(tool["function_code"], exec_globals, exec_locals)
        
        # Get the function
        func_name = tool["parameters"].get("function_name", "main")
        if func_name not in exec_locals:
            raise HTTPException(status_code=500, detail=f"Function '{func_name}' not found in tool code")
        
        # Execute the function
        result = exec_locals[func_name](**parameters)
        
        return {
            "success": True,
            "result": result,
            "tool": tool_name
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "tool": tool_name
        }

@router.get("/built-in/list")
async def list_built_in_tools():
    """List built-in tools"""
    return {
        "tools": [
            {
                "name": "file_reader",
                "description": "Read content from a file",
                "parameters": {
                    "file_path": {"type": "string", "description": "Path to the file"}
                }
            },
            {
                "name": "file_writer",
                "description": "Write content to a file",
                "parameters": {
                    "file_path": {"type": "string", "description": "Path to the file"},
                    "content": {"type": "string", "description": "Content to write"}
                }
            },
            {
                "name": "web_scraper",
                "description": "Scrape content from a webpage",
                "parameters": {
                    "url": {"type": "string", "description": "URL to scrape"}
                }
            },
            {
                "name": "data_processor",
                "description": "Process and transform data",
                "parameters": {
                    "data": {"type": "any", "description": "Data to process"},
                    "operation": {"type": "string", "description": "Operation to perform"}
                }
            }
        ]
    }