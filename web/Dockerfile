FROM node:22-alpine AS build

ARG API_URL

WORKDIR /web

COPY . .

RUN npm ci

ENV VITE_API_URL=${API_URL}

RUN npm run build

#serve static dist
FROM nginx:alpine AS prod

WORKDIR /web

COPY --from=build /web/dist/ /web/dist

COPY ./default.conf /etc/nginx/conf.d/