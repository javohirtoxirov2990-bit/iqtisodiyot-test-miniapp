# IQ+ Iqtisodiyot Test Arena

Telegram Mini App uchun FastAPI + SQLite asosidagi boshlang‘ich loyiha.

## Render sozlamalari

- Service type: **Web Service**
- Runtime: **Python 3**
- Root Directory: bo‘sh qoldiring
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`

### Environment Variables

Render → Environment bo‘limida quyidagilarni kiriting:

- `BOT_TOKEN` — BotFather bergan haqiqiy bot tokeni (KEY nomi aynan shunday).
- `ADMIN_KEY` — uzun va taxmin qilib bo‘lmaydigan maxfiy kalit.
- `DB_PATH` — doimiy disk ishlatilsa `/var/data/quiz.db`.

**Muhim:** token yoki maxfiy kalitni GitHub'ga, skrinshotga yoki boshqa odamlarga yubormang. `BOT_TOKEN` qiymati tokenning o‘zi bo‘ladi; KEY ustuniga ism yoki raqam kiritilmaydi.

### Ma’lumotlar bazasini saqlash

Render'da Persistent Disk yarating va mount path sifatida `/var/data` belgilang. Shunda `DB_PATH=/var/data/quiz.db` qiymati bilan SQLite ma’lumotlari deploylardan keyin saqlanadi. Persistent Disk ulanmagan bo‘lsa, bepul/ephemeral fayl tizimida baza yo‘qolishi mumkin.

## Telegram Mini App

1. Render deploy muvaffaqiyatli bo‘lgach, HTTPS domenni oling.
2. BotFather'da `/setmenubutton` orqali shu HTTPS manzilni Web App URL sifatida belgilang.
3. Ilovani Telegram ichidagi bot tugmasi orqali oching. Oddiy brauzerda Telegram `initData` bo‘lmagani sababli API ishlamaydi.

## Hozirgi imkoniyatlar

- Fanlar katalogi va fan bo‘yicha test boshlash.
- 10 tagacha tasodifiy savol, 5 daqiqalik taymer va progress indikatori.
- Server tomonida to‘g‘ri javoblarni tekshirish.
- Test natijalarini SQLite bazasiga yozish.
- Umumiy reyting va foydalanuvchining test tarixi.
- Shaxsiy kabinetdagi asosiy statistika.
- 70% va undan yuqori natijaga erishilganda chop etish mumkin bo‘lgan sertifikat maketi.

Sertifikat hozircha brauzerning print oynasi orqali chiqariladi; rasmiy raqamli sertifikat verifikatsiyasi yoki QR-kod tizimi hali kiritilmagan. To‘liq admin paneli, savollarni ommaviy yuklash, kurslar va sertifikatlarni serverda ro‘yxatdan o‘tkazish keyingi bosqich vazifalaridir.

## Xavfsizlik eslatmalari

- Telegram `initData` serverda HMAC orqali tekshiriladi va 24 soatdan eski ma’lumotlar rad etiladi.
- To‘g‘ri javoblar API orqali mijozga yuborilmaydi; natija server bazasidagi javob kaliti bilan hisoblanadi.
- Ishga tushirishdan oldin `BOT_TOKEN` va `ADMIN_KEY` ni Render Environment'da sozlang.
- Ishlab chiqarish muhitida muntazam zaxira nusxa oling.
