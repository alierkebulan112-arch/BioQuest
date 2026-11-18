# BioQuest — іске қосу және интернетке шығару

Сайт енді **Figma/Payload серверіне байланған жоқ**: тіркелу, кіру және сессия сайттың өз ішінде
жұмыс істейді. Қолданушылар `DATA_DIR/users.json` файлында сақталады (құпиясөздер scrypt-пен хэштелген).

## 1. Компьютерде тексеру
```bash
npm install
npm run dev          # http://localhost:3000
```

## 2. Барлығына ашық сайт жасау (браузерден іздеп табады)

Сайт адрестен (домен) ашылуы үшін оны интернеттегі серверге орнату керек. Ең оңай жолдар:

### A) Render.com (ең оңай)
1. Жобаны GitHub-қа жүктеңіз.
2. Render → **New → Blueprint** → репозиторийді таңдаңыз (`render.yaml` автоматты оқылады).
3. `NEXT_PUBLIC_SITE_URL` деген жерге сайт адресін жазыңыз.
4. Deploy. Сізге `https://bioquest.onrender.com` сияқты ашық сілтеме беріледі.

> Қолданушылар базасы сақталуы үшін **диск** керек (`render.yaml`-да `starter` жоспар + 1 GB диск).
> Тегін жоспарда диск жоқ: сайт жұмыс істейді, бірақ қайта іске қосылғанда тіркелгендер өшеді.

### B) Кез келген VPS (Docker)
```bash
docker build -t bioquest .
docker run -d --restart=always -p 80:3000 -v bioquest-data:/data \
  -e SESSION_SECRET=$(openssl rand -hex 32) bioquest
```
Домен алып, A-жазбаны серверің IP-іне бағыттаңыз. HTTPS үшін Caddy/Cloudflare қосуға болады.

### C) Тез демо үшін (домен жоқ, уақытша сілтеме)
```bash
npm run build && npm start &
cloudflared tunnel --url http://localhost:3000
```

## 3. Google арқылы кіру (міндетті емес)
Google Cloud Console-да OAuth Client ID жасап, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ортасына қойыңыз
(Docker-де `--build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=...`). Қойылмаса, тек email арқылы кіру көрсетіледі.

## Ортаның айнымалылары
Қараңыз: `.env.example`.
