FROM node:18-alpine
COPY . /app
WORKDIR /app
RUN npm install sqlite3
RUN npm install
EXPOSE 3000
CMD [ "node", "index.js" ]