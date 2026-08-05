FROM node:20-alpine
WORKDIR /app
COPY new-design/package.json ./
RUN npm install --production
COPY new-design/ ./
EXPOSE 3000
CMD ["node", "server.js"]
