# CLAUDE.md — 4hands Landings монорепо

## Структура проекта

```
/Сайт b2b/  (репо корень = /var/www/landings на VPS)
├── CLAUDE.md                          ← этот файл
├── TZ.md                              ← техническое задание
├── package.json                       ← Node.js (AMO сервер)
├── nginx.conf                         ← шаблон nginx конфига для VPS
├── robots.txt                         ← SEO: доступ для ботов
├── sitemap.xml                        ← SEO: карта сайта (обновлять при добавлении страниц)
│
├── franch/                            ← страница франшизы → 4you.4hands.ru/franch
├── salon-krasoty/                     ← SEO-статья «франшиза салона красоты» → 4you.4hands.ru/salon-krasoty (Next.js static export)
│   ├── index.html
│   ├── style.css
│   ├── main.js
│   └── assets/
│       ├── fonts/                     ← DrukWideCyr-Medium.woff2 (добавить вручную!)
│       ├── images/                    ← фото/видео (добавить вручную)
│       └── icons/
│
├── server/
│   └── amo-lead.js                   ← Node.js: POST /api/lead → AMO CRM
│
├── .github/
│   └── workflows/
│       └── deploy.yml                ← auto-deploy при git push → main
│
└── брендбук 1 часть (1).pdf
```

## Добавление новой страницы (5 минут)

```bash
# 1. Скопировать шаблон
cp -r franch new-slug          # например: b2b, promo-2026, corp

# 2. Поменять контент
# Отредактировать new-slug/index.html

# 3. Добавить в nginx.conf (раздел "Custom coded pages")
#    location /new-slug {
#        root /var/www/landings;
#        try_files $uri $uri/ /new-slug/index.html;
#    }

# 4. Добавить в sitemap.xml

# 5. Пушим → деплой автоматически
git add . && git commit -m "add: /new-slug landing" && git push
```
Nginx перезагружается через GitHub Action автоматически после пуша.

---

## Брендбук — извлечённые данные

### Шрифты (из PDF метаданных)

| Роль | Шрифт | Источник |
|------|--------|----------|
| Заголовки (H1–H3) | **DrukWideCyr-Medium** | Commercial Type (лицензия!) |
| Тело, UI | **WixMadeforDisplay** (Regular/Medium/SemiBold/Bold) | Google Fonts ✓ |
| Акцент/переменный | Amstelvar Roman | Google Fonts ✓ |

> **Важно:** DrukWideCyr — платный шрифт (Commercial Type). Файл `DrukWideCyr-Medium.woff2`
> нужно добавить в `assets/fonts/`. В `style.css` уже прописан `@font-face` с правильным path.
> До добавления файла — стек падает на **Impact, Arial Black** (похожий вес/ширина).

### Цвета бренда (из PDF hex-значений)

| Переменная | HEX | Описание |
|-----------|-----|---------|
| `--c-teal` | `#75B4C5` | Основной бренд-цвет (teal/aqua) |
| `--c-gold` | `#E5AE6A` | Тёплый акцент (золотой) |
| `--c-fuchsia` | `#ED2CEE` | Горячий акцент (фуксия) |
| `--c-ink` | `#1A1A1A` | Основной текст |
| `--c-white` | `#FFFFFF` | Фон / поверхности |
| `--c-bg` | `#F5F8FA` | Светлый фон (производный от teal) |

### Типографика — размеры

| Элемент | Desktop | Mobile | Вес |
|---------|---------|--------|-----|
| H1 | 52–64px | 36–44px | DrukWideCyr 500 |
| H2 | 36–48px | 28–36px | DrukWideCyr 500 |
| H3 | 24–32px | 20–26px | WixMadeforDisplay 700 |
| Body | 16–18px | 15–16px | WixMadeforDisplay 400 |
| Lead | 18–20px | 16–17px | WixMadeforDisplay 400 |
| Eyebrow | 11–12px | 11px | WixMadeforDisplay 500, uppercase |

---

## Технический стек

- **Разметка:** HTML5, mobile-first, семантические landmarks
- **Стили:** Tailwind CSS CDN + кастомный `style.css` (токены, glossy, keyframes)
- **Анимации (desktop):** GSAP 3 + ScrollTrigger (CDN, defer)
- **Анимации (mobile):** IntersectionObserver + CSS transitions
- **JS:** Vanilla JS, IIFE, init-registry pattern
- **Сборка:** нет (открывается напрямую в браузере)
- **Сервер:** `python3 -m http.server 3333` из папки проекта

## Локальный запуск

```bash
# Статика (только HTML/CSS/JS, без AMO):
cd "/Users/viktor/Desktop/Antigravity/Сайт b2b"
python3 -m http.server 3333
# открыть http://localhost:3333/franch/

# Node.js сервер (для AMO, нужны env-переменные):
AMO_SUBDOMAIN=4hands AMO_TOKEN=xxx AMO_PIPELINE_ID=1 AMO_RESPONSIBLE_USER_ID=1 node server/amo-lead.js
```

---

## Архитектура JS (main.js)

```
init() on DOMContentLoaded
  ├── initScrollProgress()     # top bar, scroll %
  ├── initStickyNav()          # появляется после hero
  ├── initSmoothAnchors()      # все #anchor ссылки
  ├── initRevealOnScroll()     # [data-reveal] → .is-revealed
  ├── initCounters()           # count-up на метриках
  ├── initParallax()           # orbs на mousemove/scroll
  ├── initPathAnimation()      # GSAP scrub / IO mobile / static reduced-motion
  ├── initCasesSlider()        # scroll-snap + arrow buttons
  ├── initFAQ()                # <details> open-one-at-a-time
  ├── initFormatCTA()          # CTA карты форматов → форма + prefill
  ├── initCustomCursor()       # dot+ring, fine pointer only
  ├── initTilt()               # 3D tilt на [data-tilt]
  ├── initPhoneMask()          # RU mask +7
  └── initForm()               # validate, honeypot, success toast
```

---

## Стили — ключевые CSS-переменные

Все в `:root` в начале `style.css`. Менять только там.

```css
--c-teal, --c-gold, --c-fuchsia   /* бренд-цвета */
--c-ink, --c-white, --c-bg        /* нейтральные */
--shadow-glossy, --shadow-card     /* тени */
--grad-cta, --grad-bg              /* градиенты */
--ease-out-expo, --ease-out-back   /* кривые анимации */
```

---

## Экраны и ID-якоря

| # | Экран | ID |
|---|-------|----|
| 1 | Hero | `#top` |
| 2 | Путь запуска (GSAP) | `#path` |
| 3 | Почему 4hands | `#why` |
| 4 | Форматы / Экономика | `#formats` |
| 5 | Поддержка | `#support` |
| 6 | Кейсы | `#cases` |
| 7 | Основатель | `#founder` |
| 8 | FAQ | `#faq` |
| 9 | Форма-захват | `#capture` |

---

## Что осталось (TODO)

### Контент (вручную)
- [ ] Добавить `DrukWideCyr-Medium.woff2` в `franch/assets/fonts/`
- [ ] Заменить плейсхолдеры фото/видео в `franch/assets/images/`
- [ ] Заменить плейсхолдеры кейсов (Экран 6) реальными данными
- [ ] Добавить реальное фото основателя (Экран 7)
- [ ] Обновить `og:image` в `franch/index.html` (сейчас без URL)
- [ ] Подключить GTM (заготовка-комментарий уже есть в `<head>`)
- [ ] Брендбук часть 2 (когда появится)

### Инфраструктура (VPS, один раз)
- [ ] Купить VPS 2 GB RAM (Beget / TimeWeb ~400 ₽/мес)
- [ ] Установить на VPS: nginx, Node.js 20+, PM2, git
- [ ] Клонировать репо в `/var/www/landings`
- [ ] Скопировать `nginx.conf` в `/etc/nginx/sites-available/4you.4hands.ru`, включить, certbot HTTPS
- [ ] Запустить AMO сервер: `pm2 start npm --name amo-lead -- start`
- [ ] Добавить секреты GitHub: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
- [ ] Добавить env-переменные на VPS: `AMO_SUBDOMAIN`, `AMO_TOKEN`, `AMO_PIPELINE_ID`, `AMO_RESPONSIBLE_USER_ID`
- [ ] В `nginx.conf` заменить `YOUR_TILDA_ORIGIN` на реальный origin из Tilda
- [ ] Зарегистрировать сайт в Google Search Console + Yandex Webmaster, отправить sitemap

---

## Правила работы с кодом

- **Не сносить GSAP-анимации** при визуальных правках — только CSS-токены.
- `[data-reveal]` → класс `.is-revealed` через IntersectionObserver — не менять паттерн.
- `prefers-reduced-motion` — обязателен во всех новых анимациях.
- Touch-цели ≥ 44×44px (мобайл-first).
- Новые цвета — только через CSS-переменные, не hardcode в utility-классах.
- Комментарии в JS только для неочевидных решений (инварианты, баги).
