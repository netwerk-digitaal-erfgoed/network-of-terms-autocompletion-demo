FROM node:14.15.1-stretch AS builder

WORKDIR /app
COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY webpack webpack/
COPY webpack.config.js ./
COPY public public/
COPY src src/
RUN npm run webpack

FROM nginx:1.19.3-alpine
COPY --from=builder /app/public /usr/share/nginx/html
