from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db, Document
from services.vector_store import vector_store
import os
import uuid
from core.config import settings

router = APIRouter()

class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    content_preview: str
    metadata: dict
    tags: list
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    filter_metadata: dict = None

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    tags: str = Form("[]"),
    db: Session = Depends(get_db)
):
    """Upload and process a document"""
    if not os.path.exists(settings.upload_dir):
        os.makedirs(settings.upload_dir)
    
    # Validate file size
    file_size = 0
    content = await file.read()
    file_size = len(content)
    
    if file_size > settings.max_file_size:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Save file
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    file_path = os.path.join(settings.upload_dir, f"{file_id}{file_extension}")
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Extract text content based on file type
    text_content = ""
    if file.content_type == "text/plain":
        text_content = content.decode('utf-8', errors='ignore')
    elif file.content_type == "application/pdf":
        # PDF extraction would require PyPDF2
        text_content = f"[PDF content extracted - {file_size} bytes]"
    elif file.content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"]:
        # DOCX extraction would require python-docx
        text_content = f"[Word document content extracted - {file_size} bytes]"
    elif file.content_type == "text/markdown":
        text_content = content.decode('utf-8', errors='ignore')
    else:
        text_content = f"[Binary file - {file_size} bytes]"
    
    # Create preview (first 500 chars)
    content_preview = text_content[:500] + "..." if len(text_content) > 500 else text_content
    
    # Store in vector database
    metadata = {
        "filename": file.filename,
        "file_type": file.content_type,
        "tags": json.loads(tags),
        "file_path": file_path
    }
    
    embedding_id = await vector_store.add_document(
        content=text_content,
        metadata=metadata
    )
    
    # Store metadata in SQL database
    db_document = Document(
        filename=file.filename,
        filepath=file_path,
        file_type=file.content_type,
        content_preview=content_preview,
        embedding_id=embedding_id,
        metadata=metadata,
        tags=json.loads(tags)
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    return {
        "message": "Document uploaded successfully",
        "document_id": db_document.id,
        "embedding_id": embedding_id
    }

@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents(db: Session = Depends(get_db)):
    """List all documents"""
    documents = db.query(Document).all()
    return documents

@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: int, db: Session = Depends(get_db)):
    """Get a specific document"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.delete("/documents/{document_id}")
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Delete a document"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from vector store
    await vector_store.delete_document(document.embedding_id)
    
    # Delete file
    if os.path.exists(document.filepath):
        os.remove(document.filepath)
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}

@router.post("/search")
async def search_knowledge(search: SearchRequest):
    """Search the knowledge base"""
    results = await vector_store.search(
        query=search.query,
        top_k=search.top_k,
        filter_metadata=search.filter_metadata
    )
    return {"results": results}

@router.get("/stats")
async def get_knowledge_stats():
    """Get knowledge base statistics"""
    stats = await vector_store.get_collection_stats()
    return stats