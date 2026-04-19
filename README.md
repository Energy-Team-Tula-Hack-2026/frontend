# Tula Hack 2026 Frontend

Frontend для хакатона Tula Hack 2026 от команды Energy-Team.

---

## 🌐 Задеплоенные компоненты

| Сервис                            | URL                         |
| --------------------------------- | --------------------------- |
| **Frontend (Next.js приложение)** | https://energy-team-hack.ru |

> 💡 **Совет:** Для полноценного тестирования используйте frontend вместе с развёрнутым API:
> - **Backend API:** https://api.energy-team-hack.ru/docs
> - **Flower (мониторинг Celery):** https://flower.energy-team-hack.ru (логин: `admin`, пароль: `madrid`)

---

## 🛠 Технологии

### Основные

- **Next.js 16.2+** — React-фреймворк
- **React 19+** — библиотека интерфейсов
- **TypeScript** — типизация
- **Tailwind CSS** — стилизация

### Утилиты

- **Prettier** — форматирование
- **npm** — менеджер пакетов
- **Docker + Docker Compose** — контейнеризация

---

## 🚀 Локальный запуск

### Общие требования

- **Node.js 22+** и **npm** — для локальной разработки (Способ 2)
- **Docker + Docker Compose** — для обоих способов

> 💡 **Примечание:** При использовании Docker Compose (Способ 1) устанавливать Node.js и npm локально не требуется.

---

### Способ 1: Через Docker Compose (рекомендуется)

Полный запуск проекта в контейнере:

1. **Клонирование репозитория**

```bash
git clone https://github.com/Energy-Team-Tula-Hack-2026/frontend.git tula-hack-frontend
cd tula-hack-frontend
```

2. **Настройка переменных окружения**

```bash
cp .env.example .env
```

3. **Запуск контейнера**

```bash
docker compose up -d --build
```

**Приложение будет доступно:**

- Frontend: http://localhost:3000

---

### Способ 2: Локальная разработка (Node.js + npm)

Для разработки с hot-reload и отладкой:

1. **Клонирование репозитория**

```bash
git clone https://github.com/Energy-Team-Tula-Hack-2026/frontend.git tula-hack-frontend
cd tula-hack-frontend
```

2. **Установка зависимостей**

```bash
npm install
```

3. **Настройка переменных окружения**

```bash
cp .env.example .env
```

4. **Запуск dev-сервера**

```bash
npm run dev
```

**Приложение будет доступно:**

- Frontend: http://localhost:3000

---

## ⚠️ Важные замечания

Frontend зависит от backend API. Без правильных переменных окружения некоторые функции не будут работать.

| Переменная                       | Назначение             | Без неё не работает     | Тестовое значение                                    |
| -------------------------------- | ---------------------- | ----------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`            | URL backend API        | Запросы к серверу       | `https://api.energy-team-hack.ru`                    |
| `NEXT_PUBLIC_OAUTH_REDIRECT_URL` | URL OAuth redirect     | Перенаправление OAuth   | `https://energy-team-hack.ru/callback`               |
| `NEXT_PUBLIC_DADATA_TOKEN`       | Токен DaData           | Подсказки адресов       | `7fa5c82ac8fa16d77e74ea5f85254b13bf063e7d` (тестовый) |

### Пример `.env`

```env
NEXT_PUBLIC_API_URL=https://api.energy-team-hack.ru
NEXT_PUBLIC_OAUTH_REDIRECT_URL=https://energy-team-hack.ru/callback
NEXT_PUBLIC_DADATA_TOKEN=7fa5c82ac8fa16d77e74ea5f85254b13bf063e7d
```

> ⚠️ **Важно:** 
> - Без `NEXT_PUBLIC_API_URL` не будут работать запросы к backend
> - Без `NEXT_PUBLIC_OAUTH_REDIRECT_URL` не сработает OAuth авторизация
> - Без `NEXT_PUBLIC_DADATA_TOKEN` не будут работать подсказки адресов

### ✅ Готовый frontend для тестирования

| Сервис       | URL                                                        |
| ------------ | ---------------------------------------------------------- |
| **Frontend** | [https://energy-team-hack.ru](https://energy-team-hack.ru) |

Backend для тестирования:

- [Swagger UI](https://api.energy-team-hack.ru/docs)
- [Flower](https://flower.energy-team-hack.ru) (логин: `admin`, пароль: `madrid`)

---

## 📝 Дополнительные команды

```bash
# Запуск dev-сервера
npm run dev

# Сборка production-версии
npm run build

# Запуск production-сборки
npm run start

# Форматирование кода
npm run format

# Линтинг кода
npm run lint
```

---

## 🐳 Docker Compose (подробнее)

Файл `docker-compose.yml`:

```yaml
version: '3.9'

services:
    frontend:
        build: .
        container_name: tula-hack-2026-frontend
        env_file:
            - .env
        ports:
            - '3000:3000'
```

### Команды Docker

```bash
# Запуск в фоновом режиме
docker compose up -d

# Просмотр логов
docker compose logs -f frontend

# Остановка контейнера
docker compose down

# Пересборка контейнера
docker compose up -d --build
```
