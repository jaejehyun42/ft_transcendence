FROM node:22-alpine

WORKDIR /app

RUN apk update && apk add openssl && \
    mkdir -p /app/backend/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /app/backend/certs/server.key \
    -out /app/backend/certs/server.crt \
    -subj "/CN=localhost"

COPY package*.json .

RUN npm install 

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]