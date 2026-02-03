FROM node:20-alpine

WORKDIR /usr/src/app

# Install system dependencies (e.g. for ffmpeg or sharp if needed)
# Install system dependencies
RUN apk add --no-cache curl

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
