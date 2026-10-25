import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File, HTTPException
from groq import Groq
from pydantic import BaseModel
from pypdf import PdfReader

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

model = "openai/gpt-oss-120b"
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#parse resume
class Experience(BaseModel):
    company: str | None = None
    role: str | None = None
    duration: str | None = None
    description: str | None = None
    skills_used: list[str] = []

class Resume(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    CGPA: float | None = None

    total_experience_years: float | None = None

    skills: list[str] = []
    experiences: list[Experience] = []
    education: list[str] = []
    projects: list[str] = []
    certifications: list[str] = []
resume_schema = Resume.model_json_schema()

#parse resume
class Experience(BaseModel):
    company: str | None = None
    role: str | None = None
    duration: str | None = None
    description: str | None = None
    skills_used: list[str] = []

class Resume(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    CGPA: float | None = None


    total_experience_years: float | None = None

    skills: list[str] = []
    experiences: list[Experience] = []
    education: list[str] = []
    projects: list[str] = []
    certifications: list[str] = []
resume_schema = Resume.model_json_schema()

class ChatRequest(BaseModel):
    question: str

def ask_candidate(question: str, resume: Resume):

    system_prompt = f"""
You are an AI assistant representing a job candidate.

Below is everything you know about the candidate.

{resume.model_dump_json(indent=2)}

Rules:

1. Answer only using this information.

2. Never hallucinate.

3. If information is unavailable,
say

"I don't have enough information to answer that."

4. Be professional.

5. Answer as if HR is interviewing this candidate.
"""
    response = client.chat.completions.create(

        model=model,

        messages=[

            {
                "role":"system",
                "content":system_prompt
            },

            {
                "role":"user",
                "content":question
            }

        ]

    )

    return response.choices[0].message.content
def parse_resume(resume_text):
    system_prompt = f"""
    You are an expert resume parser.

    Extract information from the resume based on its meaning,
    not only based on exact section headings.

    Different resumes may use different headings.

    For example:
    - Experience
    - Professional Experience
    - Work History
    - Employment
    - Internships

    These may all contain relevant experience.

    Skills may also appear in the skills section, work experience,
    internships or projects.

    Return ONLY valid JSON matching this schema:

    {resume_schema}

    
      Important rules:

    1. Do not invent information.
    2. If a value is not available, return null.
    3. If a list has no information, return an empty list.
    4. Include internships inside experiences.
    5. Extract skills mentioned across the entire resume.
    6. Carefully search the entire resume for CGPA, GPA, or Cumulative Grade Point Average.
    7. If CGPA is mentioned, extract its numerical value and store it in the CGPA field.
    8. CGPA may appear in the Education section or alongside degree details.
    9. Do not confuse CGPA with percentage, marks, or graduation year.
    10. If CGPA is not explicitly available, return null for CGPA.

    """
    user_prompt = f"""
    Parse the following resume:

    {resume_text}
    """
    message_system={
        "role" : "system",
        "content" : system_prompt
    }
    message_user={
        "role" : "user",
        "content" : user_prompt
    }
    messages=[message_system, message_user]
    response_format={
        "type": "json_object"
    }
    response=client.chat.completions.create(model=model, messages=messages, response_format=response_format)
    raw_output = response.choices[0].message.content
    data = json.loads(raw_output)
    resume = Resume(**data)
    return resume

#pdf extraction
def read_pdf(file_path: Path):
    reader = PdfReader(file_path)
    text = ""

    for page in reader .pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

        return text



@app.get("/")
def home():
    # resume_text=read_pdf(Path("my_resume.pdf"))
    # resume=parse_resume(resume_text)
    return {
        "message" :"This is a home page !"
    }
# chatgpt.cpom
#chatgot.com/aceeddferre5e

@app.post("/chat")
def chat(request: ChatRequest):
    global uploaded_resume_text

    if not uploaded_resume_text:
        raise HTTPException(
            status_code=400,
            detail="Please upload your resume before chatting."
        )

    resume = parse_resume(uploaded_resume_text)

    answer = ask_candidate(request.question, resume)

    return {
        "answer": answer
    }

uploaded_resume_text = ""
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file."
        )

    try:
        pdf_bytes = await file.read()

        if not pdf_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded PDF is empty."
            )

        from io import BytesIO
        resume_text = PdfReader(BytesIO(pdf_bytes))

        text = "\n".join(
            page.extract_text() or ""
            for page in resume_text.pages
        )

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="No readable text found in the PDF."
            )
        global uploaded_resume_text
        uploaded_resume_text = text 

        resume = parse_resume(text)

        return {
            "message": "Resume uploaded successfully!",
            "filename": file.filename,
            "resume_text": text,
            "analysis": resume
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume processing failed: {str(e)}"
        )


from pydantic import BaseModel
from typing import List


class JobMatchRequest(BaseModel):
    job_role: str


@app.post("/match-job")
def match_job(request: JobMatchRequest):
    global uploaded_resume_text

    if not uploaded_resume_text:
        raise HTTPException(
            status_code=400,
            detail="Please upload your resume before matching a job."
        )

    resume = parse_resume(uploaded_resume_text)

    skills = [skill.lower() for skill in resume.skills]

    job_requirements = {
        "AI Engineer": [
            "python",
            "machine learning",
            "deep learning",
            "sql",
            "data structures and algorithms"
        ],
        "Python Developer": [
            "python",
            "sql",
            "object-oriented programming",
            "data structures and algorithms",
            "rest api"
        ],
        "Data Analyst": [
            "python",
            "sql",
            "excel",
            "power bi",
            "data analysis"
        ]
    }

    if request.job_role not in job_requirements:
        raise HTTPException(
            status_code=400,
            detail="Unsupported job role. Choose AI Engineer, Python Developer, or Data Analyst."
        )

    required_skills = job_requirements[request.job_role]

    matched_skills = [
        skill for skill in required_skills
        if any(skill in candidate_skill for candidate_skill in skills)
    ]

    missing_skills = [
        skill for skill in required_skills
        if skill not in matched_skills
    ]

    match_score = round(
        len(matched_skills) / len(required_skills) * 100
    )

    return {
        "job_role": request.job_role,
        "match_score": match_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "suggestion": (
            f"Focus on learning: {', '.join(missing_skills)}"
            if missing_skills
            else "Your resume covers all the skills in this basic checklist."
        )
    }
# youtube.com
# youtube.com/padho_with_pratyush
# youtube.com/padho_with_pratyush/videos
# youtube.com/padho_with_pratyush/playlists
#youtube.com