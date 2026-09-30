# SPEC — Техническая спецификация сайта «Бортжурнал»

## Содержание

- [SEO, авторство и облегчённые изображения](#seo-авторство-и-облегчённые-изображения)

- [Стек](#стек)
- [Кастомные Tailwind-токены](#кастомные-tailwind-токены)
- [Архитектура контента](#архитектура-контента)
- [Схема книги (`src/content/config.ts`)](#схема-книги-srccontentconfigts)
- [Схема `src/data/site.md`](#схема-srcdatasitemd)
- [Схема `src/data/ui.md`](#схема-srcdatauimd)
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
| `src/data/site.md` | Название сайта, подзаголовок, описание по умолчанию, ID Яндекс.Метрики, SEO-описания страниц, текст плашки конфиденциальности |
| `src/data/ui.md` | Все UI-строки: навигация, aria-labels, заголовки секций, тексты страниц и кнопок |
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
| `cover` | string | Имя файла обложки в `src/assets/images/` (или подпапке `sp/`) |
| `genres` | string[] (макс. 3) | Жанры |
| `shortDescription` | string | Короткая аннотация (карточка галереи) |

### Опциональные поля — общие

| Поле | Тип | Описание |
|---|---|---|
| `displayOrder` | number | Порядок в галерее (чем меньше — тем левее). Без поля = в конец |
| `marketplace` | boolean | Показывать бейдж «Маркетплейсы» |
| `seoDescription` | string, опц. | Описание для метаданных; без него shortDescription. См. раздел SEO ниже. |
| `authors` | ("ksenia" / "vasily")[], опц. | Непустой список авторов JSON-LD; без поля оба автора, вложенные тома наследуют список. |
| `logline` | string | Курсивная строка-крючок под заголовком |
| `mediumDescription` | string | Средняя аннотация (страница `/books` — список); если не задана, используется тело `.md` |
| `links` | `{label, url}[]` | Ссылки на платформы |
| `world` | string | Описание мира (секция «Мир») |
| `characters` | объекты (см. ниже) | Персонажи (секция «Персонажи») |
| `charactersFolder` | string | Папка в `public/images/` для фото персонажей |
| `extraLinks` | `{label, url}[]` | Дополнительные ссылки (карты, словари и т.д.) |
| `reviews` | `{text, author}[]` | Отзывы читателей (секция «Отзывы», 3 колонки) |

### Опциональные поля — только для циклов

| Поле | Тип | Описание |
|---|---|---|
| `series` | string | Название цикла |
| `seriesSubtitle` | string | Подзаголовок цикла (курсив под названием) |
| `seriesDescription` | string | Описание цикла (секция «О цикле») |
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
blogSubtitle: string       # опц., подзаголовок на странице блога
aboutSubtitle: string      # опц., подзаголовок на странице «Об авторах»
booksSubtitle: string      # опц., подзаголовок на странице «Книги»
seoAbout: string           # опц., meta description страницы «Об авторах»
seoBlog: string            # опц., meta description страницы «Блог»
seoBooks: string           # опц., meta description страницы «Книги»
```

Данные из `site.md` читаются в `BaseLayout.astro` и передаются в `Header` (`siteName`, `siteTagline`).

---

## Схема `src/data/ui.md`

Центральный файл всех UI-строк сайта. Все компоненты и страницы читают текстовые строки отсюда через `loadDataFile()`.

```yaml
nav:                       # массив навигационных ссылок (Header, Footer, 404)
  - href: string
    label: string

aria:                      # aria-labels для доступности
  mainNav: string
  mobileNav: string
  footerNav: string
  openMenu: string
  scrollTop: string
  close: string
  prev: string
  next: string
  viewImage: string
  previousImage: string
  nextImage: string
  promoCard: string

bookSections:              # заголовки секций на страницах книг
  seriesAbout: string
  readingOrder: string
  booksInSeries: string
  characters: string
  world: string
  reviews: string
  booktrailer: string
  lore: string
  extraLinks: string
  marketplace: string
  readOn: string

pageNav:                   # навигация по страницам
  newer: string
  older: string
  allTags: string
  readMore: string
  moreDetails: string

home:                      # главная страница
  heroQuote: string
  duoLabel: string
  heroDescription: string
  booksButton: string
  aboutButton: string
  booksHeading: string
  newsHeading: string
  litportalsHeading: string
  inProgress: string
  everyStory: string

litportals:                # контактный текст (плейсхолдеры {telegram}, {vk})
  contactText: string
  telegramLabel: string
  vkLabel: string

about:                     # страница «Об авторах»
  heading: string
  inspirationHeading: string
  backToAuthors: string
  role: string

blog:                      # блог
  heading: string

notFound:                  # страница 404
  heading: string
  subheading: string
  description: string
```

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
| `/` | `src/pages/index.astro` | Главная: герой, баннер новостей, галерея обложек, литпорталы, блог, Telegram |
| `/books` | `src/pages/books/index.astro` | Список всех книг с чередующимся макетом |
| `/books/[slug]` | `src/pages/books/[slug].astro` | Детальная страница книги или цикла |
| `/books/[slug]/lore/[loreSlug]` | `src/pages/books/[slug]/lore/[loreSlug].astro` | Статья лора, привязанная к книге |
| `/blog` | `src/pages/blog/index.astro` | Список постов блога с фильтром по тегам |
| `/blog/[slug]` | `src/pages/blog/[slug].astro` | Страница поста блога |
| `/about` | `src/pages/about/index.astro` | Об авторах + литпорталы |
| `/about/[slug]` | `src/pages/about/[slug].astro` | Индивидуальная страница автора |
| `/404` | `src/pages/404.astro` | Страница «Не найдено» |

---

## Компоненты

### UI-примитивы (переиспользуемые стили в одном месте)

| Файл | Что делает | Props |
|---|---|---|
| `src/components/GenreChip.astro` | Серый чип жанра/метки (uppercase) | `label: string` |
| `src/components/TagChip.astro` | Золотой хэштег-чип (опц. ссылка) | `tag: string`, `href?: string` |
| `src/components/TagFilter.astro` | Панель фильтрации по тегам (кнопки «Все» + #теги). Генерирует событие `filter-change` | `tags: string[]`, `group?: string`, `class?: string` |
| `src/components/GoldLine.astro` | Декоративная золотая линия-разделитель | `size?: 'sm'\|'md'\|'lg'`, `class?: string` |
| `src/components/GalleryArrow.astro` | Кнопка-стрелка навигации карусели | `direction: 'left'\|'right'`, `id: string` |

### Общие компоненты

| Файл | Что делает |
|---|---|
| `src/layouts/BaseLayout.astro` | HTML-обёртка: `<head>` (SEO, Open Graph, JSON-LD, Metrica), Header, Footer, плашка конфиденциальности. Читает `site.md` и `authors.md` |
| `src/components/Header.astro` | Навигация. Читает навигацию из `ui.md`. Принимает пропы `siteName: string`, `siteTagline?: string` из BaseLayout |
| `src/components/Footer.astro` | Копирайт + ссылки навигации из `ui.md`. Принимает проп `copyright: string` |
| `src/components/Icon.astro` | Централизованный SVG-компонент. Принимает `name: string` и `class?: string` |
| `src/components/SocialBar.astro` | Иконки соцсетей (вариант `topbar` или `footer`) |
| `src/components/CoversGallery.astro` | Горизонтальная галерея обложек (mobile swipe + desktop scroll) |
| `src/components/CardsGallery.astro` | Горизонтальная галерея карточек/иллюстраций |
| `src/components/CharactersGallery.astro` | Горизонтальная галерея персонажей |
| `src/components/Lightbox.astro` | Модальный просмотр изображений по клику |
| `src/components/LitPortals.astro` | Блок литпорталов (Ксения + Василий) |
| `src/components/MarketplaceLinks.astro` | Бейдж «Маркетплейсы» + список ссылок на магазины |
| `src/components/Divider.astro` | Декоративный разделитель (горизонтальная линия с золотым ромбом) |
| `src/components/DecoratedBox.astro` | Бордер-блок с 4 золотыми уголками + slot |

### Компоненты страницы книги (`src/components/book/`)

| Файл | Что делает |
|---|---|
| `BookHero.astro` | Hero-секция книги (обложка + мета + описание) |
| `BooksInSeries.astro` | Галерея книг внутри цикла |
| `Booktrailer.astro` | Секция буктрейлера (video) |
| `CharactersSection.astro` | Секция персонажей |
| `LoreSection.astro` | Секция лора (статьи) с фильтром по тегам |
| `Reviews.astro` | Секция отзывов |
| `SeriesAbout.astro` | Секция «О цикле» |
| `WorldSection.astro` | Секция «Мир» |
| `Section.astro` | Обёртка-секция с заголовком |

---

## Утилиты (`src/lib/`)

| Файл | Что делает |
|---|---|
| `src/lib/data.ts` | `loadDataFile()`, `loadDataFileWithContent()`, `miniMarkdown()` — парсинг YAML из `src/data/*.md` через gray-matter |
| `src/lib/images.ts` | `findImage()` — поиск `ImageMetadata` по имени файла/пути в `src/assets/images/` |
| `src/lib/slider.ts` | `initSlider()` — общая логика мобильного свайп-слайдера и десктопных стрелок для галерей |
| `src/lib/types.ts` | TypeScript-интерфейсы для data-файлов |

---

## Изображения

```
src/assets/images/
  *.jpg                     ← обложки книг (корень или подпапка sp/)
  authors/
    kk.jpg                  ← фото Ксении Котовой
    vz.jpg                  ← фото Василия Зеленкова
  characters/               ← фото персонажей цикла «Небеса Ану»
  sp/                       ← обложки серии «Стирающее поветрие» и др.
public/
  images/
    blog/                   ← обложки постов блога (SVG-заглушки)
    lore/                   ← обложки статей лора
    authors/
      favis.jpg             ← favicon (иконка вкладки)
      favi.jpg              ← OG-image (соцсети)
  cards/
    Aviators/               ← промо-карточки
  videos/
    *.mp4                   ← видео-буктрейлеры
```

Обложки книг загружаются через `findImage()` из `src/assets/images/` и обрабатываются Astro `<Image>` (оптимизация, WebP, srcset).

Обложки блога и лора — обычные `<img>` из `public/`, без оптимизации.

Путь к буктрейлеру: `/videos/{booktrailer.file}`.

---

## Стилевые соглашения

### Типографика мелкого текста

Все мелкие текстовые элементы используют единый кегль `text-xs tracking-widest uppercase`:

- Хлебные крошки (breadcrumb)
- Дата публикации на карточках блога
- Ссылки «Читать →», «← Назад»
- Навигация «Позднее / Ранее / Предыдущая / Следующая»
- Подзаголовок сайта (имена авторов) в шапке

### Централизованные стили

| Что | Где определяется | Используется в |
|---|---|---|
| Жанровый чип (серый) | `GenreChip.astro` | BookHero, BooksInSeries, SeriesAbout, books/index |
| Хэштег-чип (золотой) | `TagChip.astro` | blog/index, blog/[slug], LoreSection, lore/[loreSlug] |
| Фильтр-кнопки (Все + #теги) | `TagFilter.astro` | blog/index, LoreSection |
| Золотая линия-разделитель | `GoldLine.astro` | 16 мест по всему сайту |
| Стрелки галереи | `GalleryArrow.astro` | CardsGallery, CoversGallery, CharactersGallery |

### Плашка конфиденциальности

Фон `bg-dp-dark` (как строка соцсетей), текст `text-parchment/80`, крестик с обводкой `border-parchment/40`.

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
10. Дополнительные ссылки (если `extraLinks[]`)
11. Дополнительные материалы / Лор (если есть привязанные lore-посты)

## SEO, авторство и облегчённые изображения

| Поле / файл | Назначение и значение по умолчанию |
| --- | --- |
| Книга: `seoDescription` | Необязательный текст meta description и OG/Twitter. Без поля используется обязательный `shortDescription`. Не задавайте пустую строку. Не меняет видимую аннотацию или подпись на JPEG. |
| Книга: `authors` | Необязательный непустой массив ключей `ksenia`, `vasily` для JSON-LD. Без поля оба автора; список корня цикла наследуют вложенные книги. У вложенных томов отдельные authors/seoDescription не поддерживаются. |
| Lore: `previewCover` | Необязательный путь от корня сайта к облегчённой обложке в public. Только для верхнего изображения статьи при наличии cover. Без поля используется cover. Размеры HTML и карточка на странице книги не меняются. |
| Lore: `cover` | Исходная обложка для ссылки со страницы книги, JSON-LD, социальной карточки и резервного отображения внутри статьи. |
| Блог/lore: `draft` | true исключает маршрут и социальную карточку. По умолчанию false. |

```yaml
# В frontmatter книги или корня цикла:
seoDescription: "Отдельное описание книги для поисковиков."
authors: ["ksenia"]
```

```yaml
# В frontmatter lore; оба файла должны существовать в public/images/lore/:
cover: /images/lore/original.png
previewCover: /images/lore/preview.webp
```

`previewCover` не создаёт файл автоматически и не включает увеличение. Открытие оригинала верхней обложки сейчас отдельно настроено в шаблоне для `aviatory-map`. В теле lore для уменьшенного изображения можно использовать HTML:

```html
<img src="/images/lore/preview.webp" alt="Описание изображения"
     loading="lazy" data-lightbox-group="lore-article"
     data-lightbox-src="/images/lore/original.png" />
```

Оригинал сохраняется отдельным файлом. Новые width/height изображениям карты не добавлять без согласования.

### Где редактировать SEO и карточки

- `src/data/seo.json`: ключ — маршрут с завершающим `/`, значение — `title` и `description`. Имеет приоритет над переданными в BaseLayout значениями, включая seoAbout/seoBlog/seoBooks из site.md. К title добавляется « — Бортжурнал». Это метаданные, не видимые заголовки.
- `src/data/social.json`: подписи на изображениях; по маршруту можно задать `title`, `description`, `authors` (ключи из authors.md). Авторы на картинке пока НЕ читаются из frontmatter книги: при изменении authors в книге проверьте это поле отдельно. Без переопределения генератор использует обоих авторов (профили — без нижнего блока имён).
- Короткие аннотации на карточках книг берутся из `shortDescription`, а не seoDescription; явный description в social.json имеет приоритет.
- `src/generated/social.json` и `public/social/`: результат генерации, вручную не редактировать. Исходные обложки не заменять.

После изменения контента/подписей выполните `npm run social:generate`, просмотрите картинки и выполните `npm run build`. Коммитьте исходники, JPEG и src/generated/social.json вместе. Обычная сборка и деплой НЕ запускают генератор карточек автоматически. При смене маршрута обновляйте ключи seo.json и social.json.

Подробности: [генератор карточек](scripts/SOCIAL-CARDS.md), [шаблоны](EXAMPLES/README.md). На опубликованном сайте отдельно проверяйте метаданные и реальные превью Telegram/VK.

### Сущности JSON-LD

BaseLayout: Organization с постоянным @id без неподтверждённого logo, WebSite на главной. schemaAuthors из src/lib/schema.ts формирует Person с URL и @id профиля. Книга — Book; страница с непустым books — BookSeries с hasPart и существующими #book-N. Блог/lore — Article с датой из контента, без выдуманной dateModified. Добавление нового автора требует изменения enum в config.ts, типов, schemaAuthors и данных authors.md; произвольное имя в authors не поддерживается.

## Поля личной страницы автора

В src/content/authors/*.md поддерживаются необязательные portrait (путь в src/assets/images), intro (вводный абзац), featuredBooks (массив slug из коллекции books, по умолчанию []). Они добавляют портрет, представление и ссылки на книги в заданном порядке. Биография и публикации — Markdown в теле файла; длинные списки можно оформить через details/summary. При наполнении обновите описание соответствующего маршрута в src/data/seo.json. Пример — EXAMPLES/author-page.md.

### Таблицы библиографии автора

Необязательное поле `bibliography` в `src/content/authors/*.md` — массив разделов.
Каждый раздел содержит `title` (например, «Романы», «Повести», «Рассказы», «Микрорассказы», «Сборники») и `entries` — массив произведений.
Поля записи: `title` и `publication` обязательны; `year` — целое число, `href` — путь к существующей странице произведения на сайте (можно с якорем), `language` — резервное поле, сейчас не выводится, `coauthors` — имена соавторов; `sources` — массив ссылок с `label` и `url`.
Записи автоматически выводятся по убыванию года, без года — в конце. Отсутствующий год обозначается прочерком. Колонка языка скрыта. Пустой раздел выводит «Сведения будут добавлены».
Название кликабельно только при наличии `href`; внешние ссылки на публикации и справочники задаются через `sources`. Годы публикации, язык и жанровую форму не следует угадывать. Рассказ и одноимённый сборник — разные записи.

Повторные публикации произведения задаются отдельными записями с собственными годом и изданием. Год конкурса не заменяет год публикации. Имена соавтора «Василий Зеленков» и «Зеленков Василий» в таблицах автоматически ведут на `/about/vasily/`.

Таблицы библиографии и конкурсов поддерживают сортировку по каждой колонке: нажатие заголовка переключает ↑/↓. По умолчанию год убывает; неизвестный год всегда в конце. Конкурсы задаются в `contests` — массив записей `year`, `title`, `description` (Markdown, допустим HTML). Описание сохраняет ссылки на произведения. Колонка «Ссылки» автоматически получает площадки из `links` книг, на которые ссылается описание (`/books/slug/`, для тома — `#book-N`). В библиографии площадки берутся по `href`. Без ссылки на книгу выводится прочерк; сопоставления только по названию нет. Кнопки используют общий компонент MarketplaceLinks.

У записи `contests` есть необязательный массив `links: [{ label: "Автор.Тудей", url: "https://author.today/work/528330" }]` для площадок произведений без страницы на сайте. Эти кнопки дополняют автоматически найденные площадки; одинаковые URL не дублируются. Ссылки на итоги конкурса остаются отдельными плашками в `description`.

У записи `contests` необязательное поле `diploma: "/diplomas/имя-файла.jpg"` выводит под названием конкурса отдельную плашку «Диплом». Файл положите в `public/diplomas/`; он открывается в новой вкладке и не загружается изображением в таблице. Задавайте поле только для существующего файла. Сортировка названия конкурса не учитывает подпись плашки.

У записи `bibliography.entries` также доступен необязательный массив `links` (`label`, `url`) для прямых ссылок на площадки чтения. Он дополняет ссылки из книги по `href`; одинаковые URL выводятся один раз. Справочные ссылки на издания остаются в `sources`.

Библиография: `collections` — массив `{ title, href }` сборников, в которые входит рассказ; выводится под названием произведения, допускает несколько сборников. Площадки чтения этих сборников автоматически добавляются в колонку «Ссылки» из страницы книги или соответствующей записи раздела «Сборники»; одинаковые URL не повторяются. Если рассказ входит и в «Пусть эта музыка стихнет», и в «Крошки к чаю», площадки «Крошек к чаю» не добавляются; обе ссылки о вхождении в сборники под названием сохраняются. `readingSources` — массив `{ label, url }` ссылок на само произведение: карточку на Фантлабе, текстовую или аудиопубликацию («Прочитано», SoundStream); выводится под названием произведения. `sources` — внешние ссылки на конкретное издание (в том числе карточку издания на Фантлабе) под публикацией. Не подменяйте карточку рассказа одноимённым сборником. Разделы идут в порядке frontmatter: романы, сборники, повести, рассказы, микрорассказы. Все таблицы автора используют единые ширины колонок; заголовки без переноса, на узком экране — горизонтальная прокрутка.

У записи библиографии `cycle: { title: "Небеса Ану", href: "/books/aviatory/" }` выводит ссылку на цикл под соавтором тем же стилем. Внешние ссылки `sources` и `readingSources` группируются в отдельной строке, плашки внутри идут рядом.

В библиографии `publicationTypes: [online, print]` задаёт форматы для чекбоксов «Б» (бумажные) и «С» (сетевые) рядом с заголовком «Публикация / издание»; для одного формата укажите только `online` или `print`. Пустой массив означает неуточнённый формат: запись видна только при включённых обоих чекбоксах. Формат относится к публикации в строке, а не к доступности рассказа по ссылкам. Каждая таблица публикаций имеет независимый фильтр; выбор не меняет остальные таблицы. При отсутствии результатов отображается сообщение, фильтр остаётся доступен. Каждый цикл оформляется отдельной таблицей с собственным фильтром. Поле раздела `works` содержит точные названия произведений: произведения автоматически берутся из основных разделов библиографии и объединяются по названию в одну строку; бумажные публикации показываются компактными ссылками-якорями на полные записи ниже, поэтому ссылки и выходные данные не нужно дублировать. У такого раздела задайте `entries: []`. В `collections` поле `href` необязательно, если ссылка на сборник пока неизвестна. Портальные ссылки (Автор.Тудей, ЛитНет, ЛитГород, ЛитРес, Самиздат) указываются в `links` и выводятся в колонке «Ссылки». Фантлаб с карточкой произведения, «Прочитано» и SoundStream указываются в `readingSources` под названием; ссылки на издания — в `sources` под публикацией. Ссылки «Прочитано» повторяются в каждой записи соответствующего рассказа.

Оба чекбокса форматов по умолчанию включены. Если выключить оба, таблица показывает сообщение об отсутствии результатов. Чекбоксы работают независимо от сортировки заголовка.

Конкурсы, библиография и каждый её раздел сворачиваются по нажатию на заголовок (`details`/`summary`), по умолчанию раскрыты. Внутренние ссылки на публикации раскрывают целевой раздел и включают оба формата, чтобы запись была видна.

`containsWorks` в записи общего издания перечисляет точные названия входящих произведений. В таблице цикла каждое из них получает ссылку на эту бумажную публикацию; само издание не нужно добавлять как отдельное произведение в `works`.

Библиография: разделы с `works` вложены в общую раскрывающуюся секцию «Циклы». Принадлежность к циклу определяется по `works`, ссылка под названием ведёт на таблицу цикла этой страницы. В `collections` для «Крошек к чаю» используйте https://author.today/work/275288; обе площадки чтения хранятся в `links` записи сборника.
Конкурс может содержать `id` (уникальный якорь), `shortTitle` и `result` (короткую подпись результата). Поле `awards: [id]` записи библиографии явно связывает произведение с конкурсами, не смешивая одноимённые рассказы и сборники. Ссылки раскрывают секцию конкурса. `LitPortals` принимает `personalLinks` — массив площадок одного автора без имён и общего контактного текста. Без этого параметра сохраняется двухавторский блок.

На странице автора при ширине до 640px строки таблиц отображаются карточками, по пять с кнопкой «Дальше». Исходный HTML содержит все записи. Поиск отсутствует; фильтры и сортировка сбрасывают лимит до пяти. Переходы раскрывают и показывают целевую запись, выделяя её золотистой подсветкой. На широком экране сохраняются таблицы без ограничения по количеству. Оглавление и «Свернуть всё» расположены перед конкурсами. Подпись результатов в библиографии — «Конкурсы:» с названиями через запятую.

Диплом открывается в модальном окне без перелистывания. Закрытие — крестик или Escape, фокус возвращается на ссылку. «Свернуть всё» — отдельная текстовая кнопка под оглавлением.

Настройки личной страницы находятся в frontmatter автора:
- `headerLayout: centered` — широкое фото и имя по центру, без золотой линии под вступлением. По умолчанию `classic`: прежнее компактное фото, имя слева и линия.
- `portals: [{ label, url }]` — персональные литпорталы в рамке после биографии; пустой массив скрывает блок. Для Василия указать его собственные адреса. Общие площадки главной и `/about/` остаются в `src/data/links.md`.
- `profile: { description, sameAs }` — включает `ProfilePage` с `Person`, описанием, фотографией из `portrait` и прямыми URL профилей без рекламных параметров. Без `profile` остаётся базовая `Person`.
Title/description берутся из соответствующего пути автора в `src/data/seo.json`; при отсутствии — из имени и `profile.description`. `intro` — простой текст; ссылки и развернутую биографию оформляйте Markdown в теле файла. В шаблоне нет проверки имени или slug конкретного автора.
