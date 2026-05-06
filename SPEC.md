# SPEC — Техническая спецификация сайта «Бортжурнал»

## Содержание

- [Стек](#стек)
- [Кастомные Tailwind-токены](#кастомные-tailwind-токены)
- [Архитектура контента](#архитектура-контента)
- [Схема книги (`src/content/config.ts`)](#схема-книги-srccontentconfigts)
- [Схема `src/data/site.md`](#схема-srcdatasitemd)
- [Схема `src/data/authors.md`](#схема-srcdataauthorsmd)
- [Схема `src/data/news.md`](#схема-srcdatanewsmd)
- [Схема `src/data/links.md`](#схема-srcdatalinksmd)
- [Страницы](#страницы)
- [Компоненты](#компоненты)
- [Изображения](#изображения)
- [Порядок секций на странице `/books/[slug]`](#порядок-секций-на-странице-booksslug)

---

## Стек

| Что | Версия / детали |
|---|---|
| Фреймворк | Astro 4.16.19 (статическая генерация) |
| Стили | Tailwind CSS 3.4.x |
| Шрифты | Playfair Display (`font-heading`), Inter (`font-body`), Libre Baskerville (`font-accent`) |
| Парсинг MD-данных | gray-matter (для `src/data/*.md` вне Content Collections) |
| Sitemap | @astrojs/sitemap@3.1.6 (3.7.2 несовместим с Astro v4) |
| Node.js | `C:\Program Files\nodejs\` |

---

## Кастомные Tailwind-токены

```js
colors: {
  parchment:  '#FAF6F0',  // фон страницы
  'dp-dark':  '#1A1A2E',  // тёмные акценты
  'dp-text':  '#2C2C2C',  // основной текст
  'dp-gold':  '#C9A84C',  // золото — акцентный цвет
  'dp-copper':'#B87333',  // медь — hover-цвет кнопок
  'dp-muted': '#8B8680',  // приглушённый текст
  'dp-border':'#D4C5A9',  // цвет рамок
}
```

---

## Архитектура контента

### Content Collections

`src/content/books/` — коллекция `books`. Один `.md` файл = одна книга или один цикл.

**Правило видимости в галереях:**
- Показывается, если: `!series` (отдельная книга) **или** `books.length > 0` (корневой файл цикла)
- Скрывается, если: есть `series`, но нет `books[]` (такие файлы сейчас не используются)

**Сортировка:** по полю `displayOrder` (число, опционально). Записи без этого поля уходят в конец (значение 999).

**Маршруты:** `/books/[slug]` — slug = имя файла без `.md`

### Data files (gray-matter через readFileSync)

Все data-файлы читаются через `fs.readFileSync` + `gray-matter`. Импорт `?raw` не используется.

| Файл | Что хранит |
|---|---|
| `src/data/site.md` | Название сайта, подзаголовок, описание по умолчанию, ID Яндекс.Метрики, текст плашки конфиденциальности |
| `src/data/authors.md` | Имена, фото, биография авторов, блок влияний. Имена авторов автоматически попадают в footer copyright, meta author и JSON-LD |
| `src/data/links.md` | Соцсети, литпорталы Ксении и Василия, контакты |
| `src/data/news.md` | Новостной баннер на главной |
| `src/data/telegram.md` | Блок Telegram-канала на главной |

---

## Схема книги (`src/content/config.ts`)

### Обязательные поля

| Поле | Тип | Описание |
|---|---|---|
| `title` | string | Название книги или цикла |
| `cover` | string | Имя файла обложки в `public/images/` |
| `genres` | string[] (макс. 3) | Жанры |
| `shortDescription` | string | Короткая аннотация (карточка галереи) |

### Опциональные поля — общие

| Поле | Тип | Описание |
|---|---|---|
| `displayOrder` | number | Порядок в галерее (чем меньше — тем левее). Без поля = в конец |
| `marketplace` | boolean | Показывать бейдж «Маркетплейсы» |
| `logline` | string | Курсивная строка-крючок под заголовком |
| `mediumDescription` | string | Средняя аннотация (страница `/books` — список); если не задана, используется тело `.md` |
| `links` | `{label, url}[]` | Ссылки на платформы |
| `world` | string | Описание мира (секция «Мир») |
| `worldMaps` | `{label, url}[]` | Кнопки карт мира |
| `characters` | объекты (см. ниже) | Персонажи (секция «Персонажи») |
| `charactersFolder` | string | Папка в `public/images/` для фото персонажей |
| `characterMaps` | `{label, url}[]` | Кнопки дерева связей |
| `reviews` | `{text, author}[]` | Отзывы читателей (секция «Отзывы», 3 колонки) |

### Опциональные поля — только для циклов

| Поле | Тип | Описание |
|---|---|---|
| `series` | string | Название цикла |
| `seriesSubtitle` | string | Подзаголовок цикла (курсив под названием) |
| `seriesDescription` | string | Описание цикла (секция «О цикле») |
| `seriesLinks` | `{label, url}[]` | Ссылки на цикл на платформах |
| `readingOrder` | `{title, labels?}[]` | Порядок чтения |
| `readingMap` | `{label, url}` | Кнопка карты чтения |
| `books` | объекты (см. ниже) | Книги цикла |
| `booktrailer` | объект (см. ниже) | Секция с видео-буктрейлером |

### Структура `booktrailer`

```yaml
booktrailer:
  visible: boolean        # опц., default: true — скрыть без удаления
  file: string            # имя файла в public/videos/
  orientation: horizontal | vertical   # опц., default: horizontal
```

### Структура `characters[]`

```yaml
characters:
  - name: string          # имя персонажа
    role: string          # роль (Главный герой, Антагонист и т.д.)
    description: string   # 2-3 предложения
    photo: string         # имя файла в папке charactersFolder (опц.)
```

### Структура `reviews[]`

```yaml
reviews:
  - text: string          # текст отзыва
    author: string        # источник / имя читателя
```

### Структура `books[]` (книги внутри цикла)

```yaml
books:
  - title: string
    cover: string                  # имя файла в public/images/
    marketplace: boolean           # опц., default: false
    genres: string[]               # опц., макс. 3
    logline: string                # опц.
    shortDescription: string       # опц.
    description: string            # опц., полная аннотация (показывается на странице цикла)
    links:                         # опц.
      - label: string
        url: string
```

---

## Схема `src/data/site.md`

```yaml
siteName: string           # название сайта (шапка + title страницы)
siteTagline: string        # опц., подзаголовок в шапке
defaultDescription: string # описание для страниц без собственного description
metricsId: string          # ID Яндекс.Метрики; пустая строка = отключено
privacyText: string        # текст плашки конфиденциальности
```

Данные из `site.md` читаются в `BaseLayout.astro` и передаются в `Header` (`siteName`, `siteTagline`).

---

## Схема `src/data/authors.md`

```yaml
bio: string[]              # биографические абзацы

ksenia:
  name: string             # имя — автоматически в footer, meta, JSON-LD
  photo: string            # имя файла в public/images/authors/
  bioUrl: string           # опц., ссылка под портретом
  bioLabel: string         # опц., текст ссылки

vasily:
  name: string
  photo: string
  bioUrl: string           # опц.
  bioLabel: string         # опц.

influences: string[]       # опц., блок «Влияния»; удали весь ключ, чтобы скрыть
```

---

## Схема `src/data/news.md`

```yaml
visible: boolean           # показывать/скрывать баннер
text: string               # текст новости
links:                     # опц.
  - label: string
    url: string
```

---

## Схема `src/data/links.md`

```yaml
socials:
  - label: string    # отображаемое название
    url: string
    icon: string     # ключ иконки: vk | telegram | threads | pikabu | dzen

litportals:
  ksenia:
    - label: string  # ключ иконки: ЛитРес | Автор.Тудей | ЛитНет | ЛитГород
      url: string
  vasily:
    - label: string
      url: string

contact:
  vk: string       # ссылка ВКонтакте
  telegram: string # ссылка Telegram
```

---

## Страницы

| URL | Файл | Описание |
|---|---|---|
| `/` | `src/pages/index.astro` | Главная: герой, баннер новостей, галерея обложек, литпорталы, соцсети, Telegram |
| `/books` | `src/pages/books/index.astro` | Список всех книг с чередующимся макетом |
| `/books/[slug]` | `src/pages/books/[slug].astro` | Детальная страница книги или цикла |
| `/about` | `src/pages/about.astro` | Об авторах |

---

## Компоненты

| Файл | Что делает |
|---|---|
| `src/layouts/BaseLayout.astro` | HTML-обёртка: `<head>` (SEO, Open Graph, JSON-LD, Metrica), Header, Footer. Читает `site.md` и `authors.md` |
| `src/components/Header.astro` | Навигация. Принимает пропы `siteName: string`, `siteTagline?: string` из BaseLayout |
| `src/components/Footer.astro` | Копирайт + ссылки навигации. Принимает проп `copyright: string` (формируется из имён авторов в `authors.md`) |
| `src/components/Icon.astro` | Централизованный SVG-компонент. Принимает `name: string` (ключ иконки) и `class?: string`. Заменяет дублированные словари иконок в страницах |
| `src/components/CoversGallery.astro` | Горизонтальная галерея обложек со скроллом (кнопки ← →) |
| `src/components/CharactersGallery.astro` | Горизонтальная галерея персонажей со скроллом |

---

## Изображения

```
public/images/
  *.jpg                     ← обложки книг (прямо в корне)
  authors/
    kk.jpg                  ← фото Ксении Котовой
    vz.jpg                  ← фото Василия Зеленкова
    favis.jpg               ← favicon (иконка вкладки браузера)
    favi.jpg                ← OG-image (изображение для соцсетей по умолчанию)
  characters/               ← фото персонажей цикла «Небеса Ану»
  characters-*/             ← фото персонажей других циклов (папка на каждый цикл)
public/videos/
  *.mp4                     ← видео-буктрейлеры
```

Путь к обложке: `/images/{cover}` — значение поля `cover` в .md файле.
Путь к фото персонажа: `/images/{charactersFolder}/{photo}`.
Путь к буктрейлеру: `/videos/{booktrailer.file}`.

Главная обложка книги (первая в макете): `loading="eager"`. Все остальные изображения: `loading="lazy"`.

---

## Порядок секций на странице `/books/[slug]`

1. Breadcrumb
2. **Заголовок цикла** — центрированный, золотой (только если есть `series`)
3. Главный блок: обложка + ссылки | название + жанры + логлайн + `<Content />`
4. Отзывы (если `reviews[]`)
5. О цикле (если `series` + `seriesDescription` / `readingOrder`)
6. **Буктрейлер** (если `booktrailer` + `visible !== false`)
7. Книги цикла (если `books[]`)
8. Персонажи (если `characters[]`)
9. Мир (если `world`)
