FROM node:19.6.0 as build

ENV REMARK_API="/api/v1/bookmark/" \
    LOGIN_URL="/auth/start/" \  
    AUTHORIZATION_COOKIE="Authorization" \
    DISABLE_DOTENV="true"

RUN mkdir /app

COPY package.json package-lock.json /app/

COPY src /app/src

RUN cd /app && npm run build

FROM nginx:1.23.3

COPY --from=build /app/dist /usr/share/nginx/html/
