import asyncio
from typing import List, Dict
from fastapi import WebSocket
import json

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_info: Dict[WebSocket, dict] = {}
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_info[websocket] = {"connected_at": time.time()}
        print(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    async def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.connection_info:
            del self.connection_info[websocket]
        print(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending personal message: {e}")
            await self.disconnect(websocket)
    
    async def broadcast(self, message: dict):
        disconnected_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting message: {e}")
                disconnected_connections.append(connection)
        
        # Clean up disconnected connections
        for connection in disconnected_connections:
            await self.disconnect(connection)
    
    async def handle_message(self, websocket: WebSocket, data: str):
        """Handle incoming WebSocket messages"""
        try:
            message = json.loads(data)
            message_type = message.get("type")
            
            if message_type == "ping":
                await self.send_personal_message({"type": "pong"}, websocket)
            
            elif message_type == "subscribe_execution":
                execution_id = message.get("execution_id")
                # In a real implementation, subscribe to execution updates
                await self.send_personal_message({
                    "type": "subscription_confirmed",
                    "execution_id": execution_id
                }, websocket)
            
            elif message_type == "unsubscribe_execution":
                execution_id = message.get("execution_id")
                # In a real implementation, unsubscribe from execution updates
                await self.send_personal_message({
                    "type": "unsubscription_confirmed",
                    "execution_id": execution_id
                }, websocket)
            
            else:
                await self.send_personal_message({
                    "type": "error",
                    "message": f"Unknown message type: {message_type}"
                }, websocket)
        
        except json.JSONDecodeError:
            await self.send_personal_message({
                "type": "error",
                "message": "Invalid JSON format"
            }, websocket)
        except Exception as e:
            await self.send_personal_message({
                "type": "error",
                "message": f"Error handling message: {str(e)}"
            }, websocket)

# Global instance
websocket_manager = WebSocketManager()