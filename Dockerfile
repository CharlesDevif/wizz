FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY web/package.json web/package-lock.json ./web/
RUN npm ci && cd web && npm ci
COPY server.js ./
COPY web ./web
RUN npm run build && cd web && rm -rf node_modules
ENV PORT=8080
EXPOSE 8080
ENV DATA_DIR=/data
VOLUME ["/data"]
CMD ["node", "server.js"]
