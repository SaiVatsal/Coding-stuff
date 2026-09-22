from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from core.database import SessionLocal
from services.ai_provider import CoachingAgent
from models.document import DocumentChunk
import json

router = APIRouter()

@router.websocket("/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: int):
    await websocket.accept()
    
    # Normally we'd authenticate the WS connection here
    db = SessionLocal()
    agent = CoachingAgent(provider_name="gemini") # Hardcoded to Gemini for now, could be dynamic
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "user_answer":
                user_text = message.get("text")
                question = message.get("question")
                
                # Fetch user context (mocking vector search for simplicity in this file)
                # In a real app, query pgvector using LangChain's PGVector or raw SQL
                context = "User has experience with Next.js and FastAPI."
                
                # Generate feedback
                feedback = agent.generate_feedback(context, user_text, question)
                
                await websocket.send_text(json.dumps({
                    "type": "coaching_feedback",
                    "feedback": feedback
                }))
                
    except WebSocketDisconnect:
        print(f"Client disconnected from session {session_id}")
    finally:
        db.close()
