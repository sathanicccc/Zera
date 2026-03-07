FROM node:18-slim
RUN apt-get update && apt-get install -y ffmpeg git python3 make g++
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
CMD ["node", "index.js"]
