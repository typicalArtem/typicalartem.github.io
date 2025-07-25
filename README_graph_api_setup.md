# Настройка Workflow для мониторинга конкурентов в n8n с Graph API

## Описание
Этот workflow использует официальный Facebook Graph API для надежного мониторинга публикаций конкурентов в Instagram и Facebook. Более стабильный и функциональный чем веб-скрапинг.

## ⚡ Преимущества Graph API версии:
- **Надежность**: Официальный API вместо парсинга HTML
- **Детальная информация**: Метаданные постов, типы медиа, точные даты
- **Стабильность**: Не зависит от изменений интерфейса соцсетей
- **Обработка ошибок**: Встроенная обработка rate limiting и ошибок токенов
- **Больше данных**: ID постов, типы медиа, детальная информация

## 📋 Структура Google Таблицы

| A (username) | B (platform) | C (company_name) | D (page_id) | E (last_check) |
|--------------|--------------|------------------|-------------|----------------|
| competitor1  | instagram    | Конкурент 1      | 17841400001234567 | 2024-01-01T00:00:00.000Z |
| competitor2  | facebook     | Конкурент 2      | 123456789012345 | 2024-01-01T00:00:00.000Z |

### Описание колонок:
- **username**: Username аккаунта
- **platform**: instagram или facebook
- **company_name**: Название компании
- **page_id**: Instagram Business Account ID или Facebook Page ID
- **last_check**: Время последней проверки (обновляется автоматически)

## 🚀 Настройка Facebook App

### 1. Создание Facebook App
1. Перейдите на [Facebook Developers](https://developers.facebook.com/)
2. Создайте новое приложение типа "Business"
3. Добавьте продукты:
   - **Instagram Basic Display API** (для Instagram)
   - **Facebook Login** (для получения токенов)

### 2. Получение разрешений
Для мониторинга публикаций нужны разрешения:
- `instagram_basic` - базовый доступ к Instagram
- `pages_read_engagement` - чтение постов Facebook страниц
- `instagram_manage_insights` - доступ к Instagram Business аккаунтам

### 3. Получение Access Token
```bash
# Шаг 1: Получите код авторизации (в браузере)
https://www.facebook.com/v18.0/dialog/oauth?
  client_id={app-id}&
  redirect_uri={redirect-uri}&
  scope=instagram_basic,pages_read_engagement,instagram_manage_insights

# Шаг 2: Обменяйте код на токен
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?
  client_id={app-id}&
  client_secret={app-secret}&
  redirect_uri={redirect-uri}&
  code={code}"

# Шаг 3: Получите долгосрочный токен
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?
  grant_type=fb_exchange_token&
  client_id={app-id}&
  client_secret={app-secret}&
  fb_exchange_token={short-lived-token}"
```

## 🔍 Получение Page ID

### Для Instagram Business аккаунта:
```bash
# Получите список страниц
curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token={access-token}"

# Найдите Instagram аккаунт, привязанный к странице
curl -X GET "https://graph.facebook.com/v18.0/{page-id}?fields=instagram_business_account&access_token={access-token}"
```

### Для Facebook страницы:
```bash
# Получите Page ID напрямую из URL страницы или через API
curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token={access-token}"
```

## ⚙️ Настройка в n8n

### 1. Импорт workflow
1. Откройте n8n
2. Нажмите "Import from File"
3. Загрузите `competitor_monitor_workflow_graph_api.json`

### 2. Настройка токенов
В узле "Get Access Token" замените:
```javascript
const appId = 'YOUR_FACEBOOK_APP_ID';           // ID вашего Facebook App
const appSecret = 'YOUR_FACEBOOK_APP_SECRET';   // App Secret
const existingToken = 'YOUR_EXISTING_ACCESS_TOKEN'; // Долгосрочный токен
```

### 3. Настройка Google Sheets
- Замените `YOUR_GOOGLE_SHEET_ID` на ID вашей таблицы
- Убедитесь, что колонка `page_id` заполнена корректными ID

### 4. Настройка Email
В узле "Send Email Notification":
- `fromEmail`: Email отправителя
- `toEmail`: Email получателя

## 📊 API Endpoints

### Instagram Business Account:
```
GET /v18.0/{instagram-business-account-id}/media
```
**Поля**: `id,caption,media_type,media_url,permalink,timestamp`

### Facebook Page:
```
GET /v18.0/{page-id}/posts
```
**Поля**: `id,message,story,created_time,permalink_url,full_picture,attachments`

## 🔧 Обработка ошибок

Workflow включает обработку:
- **Rate Limiting (429)**: Автоматическая пауза
- **Недействительный токен (190/401)**: Пропуск с логированием
- **Общие HTTP ошибки**: Логирование и пропуск

## 📧 Формат уведомлений

Email содержит:
- 📸 **Instagram** или 📘 **Facebook** иконки
- **Post ID** для отслеживания
- **Тип медиа** (фото, видео, карусель)
- **Полный контент** поста (до 800 символов)
- **Превью изображений**
- **Сводка по платформам**

## 🔄 Расписание

- **Запуск**: Ежедневно в 10:00 UTC
- **Cron**: `0 10 * * *`
- **Проверка**: Посты за последние 24 часа

## 🛡️ Безопасность

- Используйте **долгосрочные токены** (60 дней)
- Храните **App Secret** в безопасном месте
- Реализуйте **обновление токенов** для production
- Мониторьте **лимиты API**

## 📈 Лимиты API

- **Instagram Basic Display**: 200 запросов/час
- **Facebook Pages**: Зависит от уровня приложения
- **Graph API**: До 600 запросов/600 секунд (стандартные лимиты)

## 🚨 Устранение неполадок

### Ошибка токена
```
Error: (#190) Invalid OAuth access token
```
**Решение**: Обновите access token

### Нет доступа к Instagram
```
Error: (#10) To use 'Instagram Basic Display'
```
**Решение**: Проверьте разрешения приложения

### Rate Limit
```
Error: (#4) Application request limit reached
```
**Решение**: Уменьшите частоту запросов

### Недоступная страница
```
Error: (#803) Cannot query users by their username
```
**Решение**: Используйте Page ID вместо username

## 🔧 Расширенные настройки

### Добавление новых полей:
Измените параметр `fields` в HTTP запросах:
```
// Для Instagram
fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count

// Для Facebook  
fields=id,message,story,created_time,permalink_url,full_picture,reactions.summary(total_count),comments.summary(total_count)
```

### Добавление других платформ:
1. Создайте новое условие в "Check Platform Type"
2. Добавьте соответствующие HTTP узлы
3. Создайте парсер для новой платформы
4. Подключите к "Merge Posts"

## 💡 Советы по оптимизации

1. **Batch запросы**: Группируйте запросы для экономии лимитов
2. **Кэширование**: Сохраняйте метаданные для избежания дублирующих запросов
3. **Мониторинг**: Отслеживайте использование API лимитов
4. **Fallback**: Подготовьте резервные токены

Workflow готов к продуктивному использованию с Graph API!