# Build web server
FROM node:12.16.1-alpine3.11 as build
WORKDIR /kaldi-web
COPY src ./src
COPY package.json .
COPY package-lock.json .
COPY .babelrc .
COPY webpack.config.js .
RUN npm install \
    && npm run build

FROM nginx:1.17.9-alpine as deployment
COPY --from=build /kaldi-web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
