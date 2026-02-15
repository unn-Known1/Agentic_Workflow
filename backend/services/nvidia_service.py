import aiohttp
import asyncio
import json
from typing import Dict, Any, Optional, AsyncGenerator
from core.config import settings
import time

class NvidiaService:
    def __init__(self):
        self.api_key = settings.nvidia_api_key
        self.base_url = settings.nvidia_base_url
        self.model = settings.nvidia_model
        self.session: Optional[aiohttp.ClientSession] = None
        self.token_usage = {"total": 0, "prompt": 0, "completion": 0}
    
    async def initialize(self):
        """Initialize the service with API key validation"""
        if not self.api_key:
            print("⚠️  NVIDIA_API_KEY not found. Set it in .env file or environment variables.")
            return
        
        self.session = aiohttp.ClientSession()
        
        # Test the API connection
        try:
            await self.test_connection()
            print("✅ NVIDIA API connection established")
        except Exception as e:
            print(f"❌ Failed to connect to NVIDIA API: {e}")
    
    async def test_connection(self):
        """Test API connectivity"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        async with self.session.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json={
                "model": self.model,
                "messages": [{"role": "user", "content": "Hello"}],
                "max_tokens": 10
            }
        ) as response:
            if response.status != 200:
                raise Exception(f"API test failed: {response.status}")
    
    async def chat_completion(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        top_p: float = 0.9,
        stream: bool = False,
        thinking: bool = True
    ) -> Dict[str, Any]:
        """Send a chat completion request to NVIDIA API"""
        if not self.api_key:
            raise Exception("NVIDIA_API_KEY not set")
        
        if not self.session:
            raise Exception("Service not initialized")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": top_p,
            "stream": stream,
            "thinking": thinking
        }
        
        start_time = time.time()
        
        try:
            async with self.session.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"API error {response.status}: {error_text}")
                
                result = await response.json()
                
                # Update token usage
                if "usage" in result:
                    usage = result["usage"]
                    self.token_usage["total"] += usage.get("total_tokens", 0)
                    self.token_usage["prompt"] += usage.get("prompt_tokens", 0)
                    self.token_usage["completion"] += usage.get("completion_tokens", 0)
                
                return {
                    "success": True,
                    "response": result,
                    "time_taken": time.time() - start_time,
                    "tokens_used": result.get("usage", {})
                }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "time_taken": time.time() - start_time
            }
    
    async def stream_chat_completion(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        top_p: float = 0.9,
        thinking: bool = True
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion from NVIDIA API"""
        if not self.api_key:
            raise Exception("NVIDIA_API_KEY not set")
        
        if not self.session:
            raise Exception("Service not initialized")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": top_p,
            "stream": True,
            "thinking": thinking
        }
        
        try:
            async with self.session.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"API error {response.status}: {error_text}")
                
                async for line in response.content:
                    if line:
                        line = line.decode('utf-8').strip()
                        if line.startswith("data: "):
                            data = line[6:]
                            if data != "[DONE]":
                                yield data
        
        except Exception as e:
            yield f"Error: {str(e)}"
    
    def get_token_usage(self) -> Dict[str, int]:
        """Get current token usage statistics"""
        return self.token_usage.copy()
    
    def reset_token_usage(self):
        """Reset token usage counter"""
        self.token_usage = {"total": 0, "prompt": 0, "completion": 0}
    
    async def close(self):
        """Close the service and cleanup"""
        if self.session:
            await self.session.close()
            self.session = None

# Global instance
nvidia_service = NvidiaService()