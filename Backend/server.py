from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import io
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'fallback_secret_key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# LLM API Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ========== MODELS ==========

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str

class NoteCreate(BaseModel):
    title: str
    content: str
    subject: str
    is_public: bool = False

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    subject: Optional[str] = None
    is_public: Optional[bool] = None

class NoteResponse(BaseModel):
    id: str
    title: str
    content: str
    subject: str
    is_public: bool
    user_id: str
    user_name: str
    created_at: str
    updated_at: str

class FlashcardResponse(BaseModel):
    id: str
    note_id: str
    front: str
    back: str

class QuizQuestion(BaseModel):
    id: str
    question: str
    question_type: Literal["multiple_choice", "true_false", "short_answer", "paragraph", "essay"]
    options: Optional[List[str]] = None
    correct_answer: str

class QuizResponse(BaseModel):
    id: str
    note_id: str
    title: str
    questions: List[QuizQuestion]
    is_public: bool
    user_id: str
    user_name: str
    created_at: str

class GenerateRequest(BaseModel):
    note_id: str
    question_types: Optional[List[str]] = None
    num_questions: Optional[int] = 5

class ImproveNotesRequest(BaseModel):
    note_id: str

class QuizSubmission(BaseModel):
    quiz_id: str
    answers: dict  # question_id -> user_answer

# ========== AUTH HELPERS ==========

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ========== AUTH ROUTES ==========

@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "created_at": now
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    return {
        "token": token,
        "user": {"id": user_id, "email": data.email, "name": data.name, "created_at": now}
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"], "created_at": user["created_at"]}
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "name": user["name"], "created_at": user["created_at"]}

# ========== NOTES ROUTES ==========

@api_router.post("/notes", response_model=NoteResponse)
async def create_note(data: NoteCreate, user: dict = Depends(get_current_user)):
    note_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    note_doc = {
        "id": note_id,
        "title": data.title,
        "content": data.content,
        "subject": data.subject,
        "is_public": data.is_public,
        "user_id": user["id"],
        "user_name": user["name"],
        "created_at": now,
        "updated_at": now
    }
    await db.notes.insert_one(note_doc)
    return NoteResponse(**note_doc)

@api_router.get("/notes", response_model=List[NoteResponse])
async def get_my_notes(user: dict = Depends(get_current_user)):
    notes = await db.notes.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return notes

@api_router.get("/notes/{note_id}", response_model=NoteResponse)
async def get_note(note_id: str, user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note["user_id"] != user["id"] and not note["is_public"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return note

@api_router.put("/notes/{note_id}", response_model=NoteResponse)
async def update_note(note_id: str, data: NoteUpdate, user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.notes.update_one({"id": note_id}, {"$set": update_data})
    updated = await db.notes.find_one({"id": note_id}, {"_id": 0})
    return updated

@api_router.delete("/notes/{note_id}")
async def delete_note(note_id: str, user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.notes.delete_one({"id": note_id})
    await db.flashcards.delete_many({"note_id": note_id})
    await db.quizzes.delete_many({"note_id": note_id})
    return {"message": "Note deleted"}

# ========== FILE UPLOAD ==========

@api_router.post("/notes/upload")
async def upload_note_file(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    content = await file.read()
    text = ""
    filename = file.filename.lower()
    
    try:
        if filename.endswith('.txt') or filename.endswith('.md'):
            text = content.decode('utf-8')
        elif filename.endswith('.pdf'):
            try:
                import PyPDF2
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
                text = "\n".join(page.extract_text() or "" for page in pdf_reader.pages)
            except ImportError:
                raise HTTPException(status_code=400, detail="PDF support not available")
        elif filename.endswith('.docx'):
            try:
                import docx
                doc = docx.Document(io.BytesIO(content))
                text = "\n".join(para.text for para in doc.paragraphs)
            except ImportError:
                raise HTTPException(status_code=400, detail="DOCX support not available")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use TXT, PDF, or DOCX")
    except Exception as e:
        logger.error(f"File parsing error: {e}")
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
    
    return {"content": text, "filename": file.filename}

# ========== AI FEATURES ==========

async def call_llm(prompt: str, session_id: str = None) -> str:
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id or str(uuid.uuid4()),
        system_message="You are an expert educational assistant that helps students learn by creating flashcards, quizzes, and improving study notes. Always respond with valid JSON when requested."
    ).with_model("openai", "gpt-5.2")
    
    user_message = UserMessage(text=prompt)
    response = await chat.send_message(user_message)
    return response

@api_router.post("/flashcards/generate")
async def generate_flashcards(data: GenerateRequest, user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": data.note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note["user_id"] != user["id"] and not note["is_public"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    prompt = f"""Based on the following study notes, create 10 flashcards to help memorize the key concepts.
Each flashcard should have a front (question/term) and back (answer/definition).

Study Notes:
Title: {note['title']}
Subject: {note['subject']}
Content:
{note['content']}

Respond with a JSON array of flashcards in this exact format:
[
  {{"front": "Question or term here", "back": "Answer or definition here"}},
  ...
]

Only respond with the JSON array, no other text."""

    try:
        response = await call_llm(prompt, f"flashcards-{data.note_id}")
        import json
        
        # Clean response and parse JSON
        response_clean = response.strip()
        if response_clean.startswith("```json"):
            response_clean = response_clean[7:]
        if response_clean.startswith("```"):
            response_clean = response_clean[3:]
        if response_clean.endswith("```"):
            response_clean = response_clean[:-3]
        
        flashcards_data = json.loads(response_clean.strip())
        
        # Delete existing flashcards for this note
        await db.flashcards.delete_many({"note_id": data.note_id})
        
        flashcards = []
        for fc in flashcards_data:
            fc_doc = {
                "id": str(uuid.uuid4()),
                "note_id": data.note_id,
                "front": fc["front"],
                "back": fc["back"],
                "user_id": user["id"]
            }
            await db.flashcards.insert_one(fc_doc)
            flashcards.append(FlashcardResponse(**fc_doc))
        
        return {"flashcards": flashcards}
    except Exception as e:
        logger.error(f"Flashcard generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating flashcards: {str(e)}")

@api_router.get("/flashcards/{note_id}")
async def get_flashcards(note_id: str, user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note["user_id"] != user["id"] and not note["is_public"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    flashcards = await db.flashcards.find({"note_id": note_id}, {"_id": 0}).to_list(100)
    return {"flashcards": flashcards, "note": note}

@api_router.post("/quizzes/generate")
async def generate_quiz(data: GenerateRequest, user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": data.note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note["user_id"] != user["id"] and not note["is_public"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    question_types = data.question_types or ["multiple_choice", "true_false", "short_answer"]
    num_questions = data.num_questions or 5
    
    prompt = f"""Based on the following study notes, create a quiz with {num_questions} questions.
Include these question types: {', '.join(question_types)}

Study Notes:
Title: {note['title']}
Subject: {note['subject']}
Content:
{note['content']}

Respond with a JSON array of questions in this exact format:
[
  {{
    "question": "The question text",
    "question_type": "multiple_choice|true_false|short_answer|paragraph|essay",
    "options": ["Option A", "Option B", "Option C", "Option D"] or null for non-multiple-choice,
    "correct_answer": "The correct answer"
  }},
  ...
]

For multiple_choice: provide 4 options and the correct answer.
For true_false: options should be ["True", "False"] and correct_answer should be "True" or "False".
For short_answer: a brief 1-2 sentence answer.
For paragraph: a 3-5 sentence answer.
For essay: a comprehensive answer that could be 2-3 paragraphs.

Only respond with the JSON array, no other text."""

    try:
        response = await call_llm(prompt, f"quiz-{data.note_id}")
        import json
        
        response_clean = response.strip()
        if response_clean.startswith("```json"):
            response_clean = response_clean[7:]
        if response_clean.startswith("```"):
            response_clean = response_clean[3:]
        if response_clean.endswith("```"):
            response_clean = response_clean[:-3]
        
        questions_data = json.loads(response_clean.strip())
        
        quiz_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        questions = []
        for q in questions_data:
            questions.append({
                "id": str(uuid.uuid4()),
                "question": q["question"],
                "question_type": q["question_type"],
                "options": q.get("options"),
                "correct_answer": q["correct_answer"]
            })
        
        quiz_doc = {
            "id": quiz_id,
            "note_id": data.note_id,
            "title": f"Quiz: {note['title']}",
            "questions": questions,
            "is_public": note["is_public"],
            "user_id": user["id"],
            "user_name": user["name"],
            "created_at": now
        }
        # Make a copy before insertion to avoid _id mutation
        quiz_to_insert = quiz_doc.copy()
        await db.quizzes.insert_one(quiz_to_insert)
        
        return quiz_doc
    except Exception as e:
        logger.error(f"Quiz generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")

@api_router.get("/quizzes/{quiz_id}")
async def get_quiz(quiz_id: str, user: dict = Depends(get_current_user)):
    quiz = await db.quizzes.find_one({"id": quiz_id}, {"_id": 0})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz["user_id"] != user["id"] and not quiz["is_public"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return quiz

@api_router.get("/quizzes/note/{note_id}")
async def get_quizzes_for_note(note_id: str, user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note["user_id"] != user["id"] and not note["is_public"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    quizzes = await db.quizzes.find({"note_id": note_id}, {"_id": 0}).to_list(100)
    return {"quizzes": quizzes}

@api_router.post("/quizzes/submit")
async def submit_quiz(data: QuizSubmission, user: dict = Depends(get_current_user)):
    quiz = await db.quizzes.find_one({"id": data.quiz_id}, {"_id": 0})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    results = []
    correct_count = 0
    
    for question in quiz["questions"]:
        user_answer = data.answers.get(question["id"], "")
        is_correct = user_answer.lower().strip() == question["correct_answer"].lower().strip()
        if is_correct:
            correct_count += 1
        results.append({
            "question_id": question["id"],
            "question": question["question"],
            "user_answer": user_answer,
            "correct_answer": question["correct_answer"],
            "is_correct": is_correct
        })
    
    score = (correct_count / len(quiz["questions"])) * 100 if quiz["questions"] else 0
    
    return {
        "quiz_id": data.quiz_id,
        "score": round(score, 1),
        "correct": correct_count,
        "total": len(quiz["questions"]),
        "results": results
    }

@api_router.post("/notes/{note_id}/improve")
async def improve_notes(note_id: str, user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    prompt = f"""Improve the following study notes to make them more effective for learning.
Enhance clarity, add helpful structure, include key definitions, and organize information better.
Keep the same subject matter but make it more comprehensive and easier to study from.

Original Notes:
Title: {note['title']}
Subject: {note['subject']}
Content:
{note['content']}

Provide the improved notes in a clear, well-structured format. Use markdown formatting for better readability."""

    try:
        improved_content = await call_llm(prompt, f"improve-{note_id}")
        
        # Update the note with improved content
        await db.notes.update_one(
            {"id": note_id},
            {"$set": {
                "content": improved_content,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        updated_note = await db.notes.find_one({"id": note_id}, {"_id": 0})
        return updated_note
    except Exception as e:
        logger.error(f"Note improvement error: {e}")
        raise HTTPException(status_code=500, detail=f"Error improving notes: {str(e)}")

# ========== PUBLIC CONTENT ==========

@api_router.get("/public/notes")
async def get_public_notes(subject: Optional[str] = None, search: Optional[str] = None):
    query = {"is_public": True}
    if subject:
        query["subject"] = {"$regex": subject, "$options": "i"}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}}
        ]
    
    notes = await db.notes.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"notes": notes}

@api_router.get("/public/quizzes")
async def get_public_quizzes(subject: Optional[str] = None):
    pipeline = [
        {"$match": {"is_public": True}},
        {"$lookup": {
            "from": "notes",
            "localField": "note_id",
            "foreignField": "id",
            "as": "note"
        }},
        {"$unwind": {"path": "$note", "preserveNullAndEmptyArrays": True}},
        {"$project": {"_id": 0}}
    ]
    
    quizzes = await db.quizzes.aggregate(pipeline).to_list(100)
    
    if subject:
        quizzes = [q for q in quizzes if q.get("note", {}).get("subject", "").lower() == subject.lower()]
    
    return {"quizzes": quizzes}

@api_router.get("/subjects")
async def get_subjects():
    subjects = await db.notes.distinct("subject")
    return {"subjects": subjects}

# ========== STATUS CHECK ==========

@api_router.get("/")
async def root():
    return {"message": "StudyCanvas API is running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include router and setup middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
