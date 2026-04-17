# Этап сборки
FROM node:22 AS builder

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --legacy-peer-deps

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Этап запуска
FROM node:22-alpine

WORKDIR /app

# Копируем только необходимые файлы
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Открываем порт 3000
EXPOSE 3000

# Запускаем приложение в production-режиме
CMD ["npm", "start"]
