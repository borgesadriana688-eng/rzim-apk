FROM node:22-alpine
WORKDIR /app
COPY server.js fetch.js ./
EXPOSE 8080
CMD ["sh", "-c", "node fetch.js && exec node server.js"]
