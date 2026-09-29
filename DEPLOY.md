# Публикация на GitHub Pages

Основной сайт: **https://skiesofanu.ru/**. Репозиторий: **soularte/skiesofanu**, ветка **main**.

GitHub Actions устанавливает зависимости через `npm ci`, собирает Astro и публикует только `dist`. В pull request выполняется только сборка. Результаты сборки, уже отслеживаемые Git, не используются вместо новой сборки.

## Первое включение

1. Открыть https://github.com/soularte/skiesofanu/settings/pages.
2. В Build and deployment → Source выбрать **GitHub Actions**.
3. В Custom domain указать **skiesofanu.ru** и сохранить. Сделать это до переключения DNS. Если поле пока недоступно, сначала выполнить публикацию workflow, затем задать домен и только после этого переключать DNS.
4. Принять pull request с настройкой публикации в main. Во вкладке Actions дождаться зелёного workflow **Deploy to GitHub Pages**. После изменения настроек Pages неудачный запуск можно повторить через Re-run jobs или запустить workflow вручную.
5. У DNS-провайдера заменить записи прежнего веб-хостинга для корня домена на четыре записи ниже. Старые конфликтующие A/AAAA/ALIAS/ANAME для корня удалить, не затрагивая MX и TXT почты/подтверждения домена.

| Тип | Имя | Значение |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | soularte.github.io |

6. Дождаться успешной проверки DNS и сертификата в Pages, затем включить **Enforce HTTPS**. Распространение DNS может занимать до суток.
7. Проверить главную, `/books/aviatory/`, картинки, `/robots.txt`, `/sitemap-index.xml` и несуществующий адрес. Обычные страницы должны отвечать 200 без глобального noindex; несуществующий адрес — 404. Все четыре `/paths/*` должны сохранить meta noindex и отсутствовать в sitemap.
8. Только после проверки GitHub Pages отключить публикацию Layero и включить перенаправления .com, описанные ниже.

Желательно подтвердить владение доменом в настройках Pages аккаунта GitHub через TXT-запись, значение которой выдаёт GitHub.

## До переключения DNS

Layero и Netlify могут продолжать текущую автоматическую публикацию. В `netlify.toml` пока **нет активных перенаправлений .com → .ru**, чтобы переход не включился раньше готовности нового сайта. Снимать запрет индексации в Layero для переезда не требуется: после переключения DNS запросы .ru будет обслуживать GitHub Pages.

Сборка настроена на собственный домен и корневые пути `/books/`, `/_astro/`. Адрес `soularte.github.io/skiesofanu/` без подключённого собственного домена не является полноценным предпросмотром этой конфигурации. Не добавлять `base: '/skiesofanu'` для работы на skiesofanu.ru.

## Перенаправления .com после переезда

Оставить DNS домена .com на Netlify. После подтверждения работы .ru добавить перед `[[headers]]` в `netlify.toml` и опубликовать:

```toml
[[redirects]]
  from = "https://skiesofanu.com/*"
  to = "https://skiesofanu.ru/:splat"
  status = 301
  force = true

[[redirects]]
  from = "https://www.skiesofanu.com/*"
  to = "https://skiesofanu.ru/:splat"
  status = 301
  force = true

[[redirects]]
  from = "http://skiesofanu.com/*"
  to = "https://skiesofanu.ru/:splat"
  status = 301
  force = true

[[redirects]]
  from = "http://www.skiesofanu.com/*"
  to = "https://skiesofanu.ru/:splat"
  status = 301
  force = true
```

Проверить переход с `.com/books/aviatory/?utm_source=test` на такой же путь и query на .ru, отсутствие циклов и ошибок HTTPS. Если изменить только DNS .com на GitHub, нужное перенаправление само по себе не появится.

## Последующие обновления

После push в main публикация на GitHub Pages запускается автоматически. DNS повторно менять не нужно. GitHub Pages не читает netlify.toml: заданные в нём CSP, кэширование и другие HTTP-заголовки относятся только к Netlify. Код Метрики сохранён без изменений; проверка статистики отложена.

Подключённый GitHub-плагин позволяет работать с файлами и PR, но не предоставляет инструмента изменения настроек Pages или DNS. Эти настройки выполняет владелец.

## Источники

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://docs.netlify.com/manage/routing/redirects/redirect-options/
