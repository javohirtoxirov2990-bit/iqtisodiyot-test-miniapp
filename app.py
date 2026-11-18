import os, json, sqlite3, hashlib, hmac
from urllib.parse import parse_qsl
from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
ADMIN_KEY = os.getenv("ADMIN_KEY", "change-this-admin-key")
DB_PATH = os.getenv("DB_PATH", "quiz.db")

app = FastAPI(title="Iqtisodiyot Test Mini App")
app.mount("/static", StaticFiles(directory="static"), name="static")

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with db() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          subject TEXT NOT NULL,
          question TEXT NOT NULL,
          a TEXT NOT NULL, b TEXT NOT NULL, c TEXT NOT NULL, d TEXT NOT NULL,
          correct TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          telegram_id TEXT NOT NULL,
          full_name TEXT,
          subject TEXT NOT NULL,
          total INTEGER NOT NULL,
          correct INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """)
        count = c.execute("SELECT COUNT(*) FROM questions").fetchone()[0]
        if count == 0:
            sample = [
                ("Iqtisodiyot", "Talab qonuni nimani ifodalaydi?",
                 "Narx oshsa talab miqdori odatda kamayadi",
                 "Narx oshsa talab doim oshadi",
                 "Narx talabga ta’sir qilmaydi",
                 "Taklif doim kamayadi", "a"),
                ("Iqtisodiyot", "Cheklangan resurslar sharoitida tanlov nimani yuzaga keltiradi?",
                 "Muqobil xarajatni", "Inflyatsiyani", "Monopoliyani", "Eksportni", "a"),
                ("Iqtisodiyot", "Bozor muvozanati qachon yuzaga keladi?",
                 "Talab va taklif tenglashganda", "Faqat narx oshganda",
                 "Taklif nol bo‘lganda", "Faqat import oshganda", "a")
            ]
            c.executemany("""INSERT INTO questions
                (subject,question,a,b,c,d,correct) VALUES (?,?,?,?,?,?,?)""", sample)

def validate_init_data(init_data: str):
    if not BOT_TOKEN:
        raise HTTPException(503, "Serverda BOT_TOKEN sozlanmagan.")
    try:
        pairs = dict(parse_qsl(init_data, keep_blank_values=True))
        received_hash = pairs.pop("hash")
        data_check = "\n".join(f"{k}={v}" for k, v in sorted(pairs.items()))
        secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated = hmac.new(secret, data_check.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(calculated, received_hash):
            raise ValueError("bad hash")
        user = json.loads(pairs["user"])
        return user
    except Exception:
        raise HTTPException(401, "Telegram foydalanuvchi ma’lumotlari tasdiqlanmadi.")

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def index():
    return FileResponse("static/index.html")

@app.get("/api/me")
def me(x_telegram_init_data: str = Header(default="")):
    user = validate_init_data(x_telegram_init_data)
    return {"id": user.get("id"), "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""), "username": user.get("username", "")}

@app.get("/api/subjects")
def subjects(x_telegram_init_data: str = Header(default="")):
    validate_init_data(x_telegram_init_data)
    with db() as c:
        rows = c.execute("SELECT DISTINCT subject FROM questions ORDER BY subject").fetchall()
    return [r["subject"] for r in rows]

@app.get("/api/questions/{subject}")
def questions(subject: str, x_telegram_init_data: str = Header(default="")):
    validate_init_data(x_telegram_init_data)
    with db() as c:
        rows = c.execute("""SELECT id,question,a,b,c,d FROM questions
                            WHERE subject=? ORDER BY RANDOM() LIMIT 10""", (subject,)).fetchall()
    return [dict(r) for r in rows]

class SubmitBody(BaseModel):
    subject: str
    answers: dict
    questions: list
    full_name: str = ""

@app.post("/api/submit")
def submit(body: SubmitBody, x_telegram_init_data: str = Header(default="")):
    user = validate_init_data(x_telegram_init_data)
    correct = 0
    for q in body.questions:
        if body.answers.get(str(q["id"])) == q["correct"]:
            correct += 1
    total = len(body.questions)
    with db() as c:
        c.execute("""INSERT INTO results
          (telegram_id,full_name,subject,total,correct) VALUES (?,?,?,?,?)""",
          (str(user["id"]), body.full_name or user.get("first_name",""),
           body.subject, total, correct))
    return {"total": total, "correct": correct,
            "percent": round(correct * 100 / total) if total else 0}

class QuestionBody(BaseModel):
    subject: str
    question: str
    a: str
    b: str
    c: str
    d: str
    correct: str

@app.post("/api/admin/question")
def add_question(body: QuestionBody, x_admin_key: str = Header(default="")):
    if not hmac.compare_digest(x_admin_key, ADMIN_KEY):
        raise HTTPException(403, "Admin kaliti noto‘g‘ri.")
    if body.correct not in ("a", "b", "c", "d"):
        raise HTTPException(400, "To‘g‘ri javob a, b, c yoki d bo‘lishi kerak.")
    with db() as c:
        c.execute("""INSERT INTO questions
          (subject,question,a,b,c,d,correct) VALUES (?,?,?,?,?,?,?)""",
          (body.subject, body.question, body.a, body.b, body.c, body.d, body.correct))
    return {"ok": True}
