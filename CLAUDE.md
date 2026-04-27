# CLAUDE.md — 4hands Franchise Landing

## Структура проекта

```
/Сайт b2b/
├── CLAUDE.md                          ← этот файл (документация для AI)
├── TZ.md                              ← полное техническое задание
├── index.html                         ← семантическая разметка, все 9 экранов
├── style.css                          ← CSS-токены, Friendly Premium, анимации
├── main.js                            ← JS: GSAP, sticky nav, form, cursor, FAQ
├── assets/
│   ├── fonts/                         ← DrukWideCyr-Medium.woff2 (добавить вручную!)
│   ├── images/                        ← реальные фото/видео (добавить вручную)
│   └── icons/                         ← SVG иконки
└── брендбук 1 часть (1).pdf           ← исходный брендбук (1.3GB, 20 стр.)
```

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
cd "/Users/viktor/Desktop/Antigravity/Сайт b2b"
python3 -m http.server 3333
# открыть http://localhost:3333
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

- [ ] Добавить `DrukWideCyr-Medium.woff2` в `assets/fonts/`
- [ ] Заменить CSS-плейсхолдеры реальными фото/видео в `assets/images/`
- [ ] Подключить реальный CRM-вебхук в `initForm()` в main.js
- [ ] Заменить плейсхолдеры кейсов (Экран 6) реальными данными
- [ ] Добавить реальное фото основателя (Экран 7)
- [ ] Подключить GTM (заготовка-комментарий уже есть в `<head>`)
- [ ] Брендбук часть 2 (когда появится)

---

## Правила работы с кодом

- **Не сносить GSAP-анимации** при визуальных правках — только CSS-токены.
- `[data-reveal]` → класс `.is-revealed` через IntersectionObserver — не менять паттерн.
- `prefers-reduced-motion` — обязателен во всех новых анимациях.
- Touch-цели ≥ 44×44px (мобайл-first).
- Новые цвета — только через CSS-переменные, не hardcode в utility-классах.
- Комментарии в JS только для неочевидных решений (инварианты, баги).
