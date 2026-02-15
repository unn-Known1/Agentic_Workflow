import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional
import uuid
from core.config import settings

class VectorStore:
    def __init__(self):
        self.client = None
        self.collection = None
        self.embedding_model = None
        self.collection_name = "agentic_workflow_knowledge"
    
    async def initialize(self):
        """Initialize ChromaDB and embedding model"""
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=settings.vector_store_path,
            settings=Settings(
                anonymized_telemetry=False
            )
        )
        
        # Get or create collection
        try:
            self.collection = self.client.get_collection(self.collection_name)
        except:
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"description": "Agentic Workflow Knowledge Base"}
            )
        
        # Initialize embedding model
        self.embedding_model = SentenceTransformer(settings.embedding_model)
        
        print("✅ Vector store initialized")
    
    async def add_document(
        self,
        content: str,
        metadata: Dict[str, Any],
        document_id: Optional[str] = None
    ) -> str:
        """Add a document to the vector store"""
        if not document_id:
            document_id = str(uuid.uuid4())
        
        # Generate embedding
        embedding = self.embedding_model.encode(content).tolist()
        
        # Add to collection
        self.collection.add(
            embeddings=[embedding],
            documents=[content],
            metadatas=[metadata],
            ids=[document_id]
        )
        
        return document_id
    
    async def search(
        self,
        query: str,
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        # Generate query embedding
        query_embedding = self.embedding_model.encode(query).tolist()
        
        # Search
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=filter_metadata,
            include=["documents", "metadatas", "distances"]
        )
        
        # Format results
        formatted_results = []
        if results["ids"]:
            for i in range(len(results["ids"][0])):
                formatted_results.append({
                    "id": results["ids"][0][i],
                    "document": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "distance": results["distances"][0][i]
                })
        
        return formatted_results
    
    async def delete_document(self, document_id: str):
        """Delete a document from the vector store"""
        self.collection.delete(ids=[document_id])
    
    async def update_document(
        self,
        document_id: str,
        content: str,
        metadata: Dict[str, Any]
    ):
        """Update a document in the vector store"""
        # Delete and re-add
        await self.delete_document(document_id)
        await self.add_document(content, metadata, document_id)
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the collection"""
        count = self.collection.count()
        return {
            "document_count": count,
            "collection_name": self.collection_name
        }
    
    async def close(self):
        """Cleanup resources"""
        if self.client:
            # ChromaDB handles persistence automatically
            pass

# Global instance
vector_store = VectorStore()