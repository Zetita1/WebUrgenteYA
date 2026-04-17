FROM node:22-alpine

WORKDIR /app

# Dependencias
COPY package*.json ./
RUN npm ci --omit=dev

# Código fuente
COPY src ./src

# Carpeta de uploads persistente
RUN mkdir -p uploads/technicians

EXPOSE 3001

CMD ["node", "src/server.js"]
