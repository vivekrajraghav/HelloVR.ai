from groq import Groq
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel,EmailStr
from pypdf import PdfReader
from dotenv import load_dotenv
import json
from pathlib import Path
import os
import hashlib
import yaml



class Experience(BaseModel):
    company:str | None=None
    role:str | None = None
    duration:str | None=None
    desc:str | None=None
    skill:str | None =None
class Resume(BaseModel):
    name:str | None=None
    email:EmailStr | None=None
    phone:str | None=None
    skills:list[str]=[]
    exp:list[Experience] = []
    edu:list[str] = []
    projects:list[str]=[]
    certi:list[str]=[]

resume_schema=Resume.model_json_schema()

class ChatMessage(BaseModel):
    role:str
    content:str

class ChatRequest(BaseModel):
    questions:str
    history:list[ChatMessage]=[]

load_dotenv()
client=Groq(api_key=os.getenv("GROQ_API_KEY"))
model="openai/gpt-oss-120b"

def ask_vivek(question:str,history:list[ChatMessage],resume:Resume,soft_info:str):
    resume_dict=resume.model_dump(exclude_none=True)
    resume_yaml=yaml.dump(resume_dict,sort_keys=False,default_flow_style=False)
    system_prompt = f"""
    Role: Vivek's personal AI recruiting assistant.
    Objective: Interface professionally with HR/recruiters.
    
    [Resume Data]: {resume_yaml}
    [Soft Info]: {soft_info}

    Strict Rules:
    1. Constraints: Base ALL answers STRICTLY on the data above. NEVER invent, assume, or hallucinate.
    2. Tone: Professional, articulate, and highly concise. Use short bullet points for readability.
    3. Missing Info: If asked about a skill/timeline not in the data, DO NOT GUESS. State: "I lack explicit info on [Topic]. I'll flag this for Vivek to follow up directly."
    4. Compensation: NEVER negotiate. State: "Vivek is open to discussing compensation directly for a competitive package."
    5. Brevity: Limit responses to 3-4 sentences max unless formatting a UI Card. Do not dump the whole resume.
    6. Next Steps: Always conclude by offering to schedule a brief call between the recruiter and Vivek.

    UI Rules (CRITICAL):
    For queries about Projects, GitHub, LeetCode, or Soft Skills, you MUST output a Markdown blockquote UI Card.
    Format explicitly like this:
    > **[CATEGORY]: [Title]**
    > * **Tools:** [Tools used]
    > * **Details:** [One concise sentence]
    """
    messages=[{"role":"system","content":system_prompt}]
    for msg in history[-4:]:
        messages.append({"role":msg.role,"content":msg.content})
    messages.append({"role":"user","content":question})
    response_stream=client.chat.completions.create(model=model,messages=messages,stream=True)
    for chunk in response_stream:
        if chunk.choices[0].delta.content is not None:
            yield chunk.choices[0].delta.content

def resume_parser(resume_text):
    system_prompt = f"""
    Role: Expert resume data extractor.
    Task: Extract facts by meaning, not strict headings (e.g., map 'Internships' or 'Work History' to 'experience'). Extract skills globally from all sections.

    Output ONLY valid JSON strictly matching this schema:
    {resume_schema}

    Strict Rules:
    1. ZERO hallucination: Extract explicit facts only.
    2. Missing values = null.
    3. Empty lists = [].
    4. Internships MUST be placed inside the 'experience' array.
    """  
    user_prompt=f"""
    Parse the following resume:
    {resume_text}
    """
    messages=[
        {
            "role":"system",
            "content":system_prompt
        },
        {
            "role":"user",
            "content":user_prompt
        }
    ]
    response_format={"type":"json_object"}
    respone=client.chat.completions.create(model=model,messages=messages,response_format=response_format)
    raw_data=respone.choices[0].message.content
    raw_data_pydantic=json.loads(raw_data)
    data=Resume(**raw_data_pydantic)
    return data
def read_pdf(file_path:Path):
    reader=PdfReader(file_path)
    text=""
    for page in reader.pages:
        page_text=page.extract_text()
        if page_text:
            text+=page_text + "\n"
    return text

def read_text_file(file_name:Path):
    try:
        with open(file_name,'r',encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        return "No additional information available"

def get_hash_file(file_path:Path):
    hasher=hashlib.md5()
    with open(file_path,'rb') as f:
        buf=f.read()
        hasher.update(buf)
    return hasher.hexdigest()

print("Loading and parsing resume! Please wait.......")
try:
    pdf_path=Path("Vivek_Resume_Updated.pdf")
    cache_path=Path("resume_cache.json")

    current_pdf_hash=get_hash_file(pdf_path)
    cache_data=None
    if cache_path.exists():
        with open(cache_path,'r',encoding="utf-8") as f:
            cache_data=json.load(f)
    if cache_data and cache_data.get("pdf_hash")==current_pdf_hash:
        print("Resume unchanged. No need to parse again.")
        parsed_resume_text=Resume(**cache_data.get("parsed_data"))
    else:
        print("PDF changed, parsing new resume!")
        resume_text_from_pdf=read_pdf(pdf_path)
        parsed_resume_text=resume_parser(resume_text_from_pdf)
        with open(cache_path,'w',encoding="utf-8") as f:
            json.dump({
                "pdf_hash":current_pdf_hash,
                "parsed_data":parsed_resume_text.model_dump()
            },f,indent=4)
    soft_info=read_text_file(Path("personal_info.md"))
    print("Successfully parsed new resume!")
except Exception as e:
    print(f"Failed to parse the resume {e}")
    parsed_resume_text=None
    soft_info=""
app=FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://10.81.90.205:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def home():
    return {"message":"Welcome! I'm representative of Mr. Vivek"}

@app.post("/chat")
def chat(request:ChatRequest):
    if not parsed_resume_text:
        return {"error":"Resume data is not  availabe!"}
    return StreamingResponse(ask_vivek(request.questions,request.history,parsed_resume_text,soft_info),media_type="text/event-stream")

