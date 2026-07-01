FROM node:22-alpine AS build

WORKDIR /api

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

# tsc only emits compiled .ts files; copy over the static assets served from ssr/
RUN mkdir -p dist/ssr/o && cp ssr/o/GeistVF.woff2 ssr/o/client.js dist/ssr/o/

FROM node:22-alpine AS prod

WORKDIR /api

COPY package*.json .

RUN npm install --omit=dev

COPY --from=build /api/dist ./dist

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3002/ping || exit 1

CMD [ "node", "dist/app.js" ]