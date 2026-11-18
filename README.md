# Iqtisodiyot Test — Telegram Mini App starter

## 1. Kerak bo‘ladi
- Python 3.10+
- Telegram bot tokeni (BotFather orqali olinadi)
- HTTPS domen yoki HTTPS tunnel (Telegram Mini App uchun)

## 2. O‘rnatish
```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
```

`.env.example` nusxasini `.env` deb saqlang. `BOT_TOKEN` va `ADMIN_KEY` qiymatlarini kiriting.
Muhim: `.env` faylini hech kimga yubormang va bot tokenini ommaga chiqarmang.

Linux/macOS:
```bash
export BOT_TOKEN="BOTFATHER_TOKEN"
export ADMIN_KEY="UZUN_MAXFIY_KALIT"
uvicorn app:app --host 0.0.0.0 --port 8000
```

Windows PowerShell:
```powershell
$env:BOT_TOKEN="BOTFATHER_TOKEN"
$env:ADMIN_KEY="UZUN_MAXFIY_KALIT"
uvicorn app:app --host 0.0.0.0 --port 8000
```

Saytni lokal tekshirish: http://127.0.0.1:8000
Telegram ichida ishlashi uchun HTTPS manzil kerak. BotFather'da /setmenubutton orqali Web App URL sifatida HTTPS manzilni belgilang.

## 3. Savol qo‘shish
Admin kaliti bilan POST `/api/admin/question` so‘rovini yuboring. Masalan:
```bash
curl -X POST https://YOUR-DOMAIN/api/admin/question \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: UZUN_MAXFIY_KALIT" \
  -d '{"subject":"Mikroiqtisodiyot","question":"Talab nima?","a":"Xarid qilish istagi va imkoniyati","b":"Faqat ishlab chiqarish","c":"Soliq turi","d":"Pul birligi","correct":"a"}'
```

## 4. Muhim eslatmalar
- Bu boshlang‘ich MVP: namuna savollar, test ishlash va natijani saqlash bor.
- Hozircha ommaviy reyting sahifasi va to‘liq admin interfeysi kiritilmagan; keyingi bosqichda qo‘shiladi.
- Ishlab chiqarish serverida HTTPS, maxfiy kalitlarni xavfsiz saqlash, zaxira nusxa va so‘rovlarni cheklashni sozlang.
- Telegram `initData` serverda HMAC orqali tekshiriladi. Mini App'ni oddiy brauzerda emas, Telegram ichida oching.
