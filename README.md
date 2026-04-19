# Tula Hack 2026 Frontend

Frontend для хакатона Tula Hack 2026 от команды Energy-Team.

---

## 🌐 Задеплоенные компоненты

| Сервис                            | URL                         |
| --------------------------------- | --------------------------- |
| **Frontend (Next.js приложение)** | https://energy-team-hack.ru |

> 💡 **Совет:** Для полноценного тестирования используйте frontend вместе с развёрнутым API.

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

---

## 🚀 Локальный запуск

### Требования

- **Node.js 22+**
- **npm**

---

### Быстрый старт

1. **Клонирование репозитория**

```bash
git clone https://github.com/Energy-Team-Tula-Hack-2026/frontend.git tula-hack-frontend
cd tula-hack-frontend
```

2. **Установка зависимостей**

```bash
npm install
```

3. **Запуск dev-сервера**

```bash
npm run dev
```

4. **Открытие приложения**

- [http://localhost:3000](http://localhost:3000)

---

## ⚠️ Важные замечания

Frontend зависит от backend API.

| Переменная            | Назначение      | Без неё не работает |
| --------------------- | --------------- | ------------------- |
| `NEXT_PUBLIC_API_URL` | URL backend API | Запросы к серверу   |

### Пример `.env`

```env
NEXT_PUBLIC_API_URL=https://api.energy-team-hack.ru
```

## ✅ Готовый frontend

| Сервис       | URL                                                        |
| ------------ | ---------------------------------------------------------- |
| **Frontend** | [https://energy-team-hack.ru](https://energy-team-hack.ru) |

Backend для тестирования:

- [https://api.energy-team-hack.ru/docs](https://api.energy-team-hack.ru/docs)

---

## 📝 Дополнительные команды

```bash
# запуск dev-сервера
npm run dev

# сборка production
npm run build

# запуск production-сборки
npm run start
```
