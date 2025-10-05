FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY . .

ENV CHOKIDAR_USEPOLLING=true
ENV BROWSER=none

EXPOSE 3000

CMD ["npm", "start"]
