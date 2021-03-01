FROM node:12.16.1-alpine3.11
WORKDIR /model_server
COPY . .
RUN npm init -y && \
    npm install express
EXPOSE 3000
CMD ["node", "server.js"]
