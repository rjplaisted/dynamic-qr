FROM node:22-alpine

WORKDIR /api

COPY package*.json .

RUN npm install

COPY . .

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3002/ping || exit 1

CMD [ "npm", "run", "start" ]