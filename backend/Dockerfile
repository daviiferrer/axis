FROM node:20-alpine

WORKDIR /usr/src/app

# Install system dependencies (e.g. for ffmpeg or sharp if needed)
# RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
