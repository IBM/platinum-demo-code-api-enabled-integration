# syntax=docker/dockerfile:1

FROM node:19.3-alpine3.17

ENV NODE_ENV=production

WORKDIR /app

COPY ["code/package.json", "./"]

RUN npm install --production

COPY code/app.js .
COPY code/key.pem .
COPY code/cert.pem .
COPY code/login.html .
COPY code/accounts.html .
COPY code/addAccount.html .
COPY code/package.json .
COPY code/css css

CMD [ "node", "app.js" ]

# Allow traffic on port 8443
EXPOSE 8443
