FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package.json ./
COPY services/auth-service/package.json ./services/auth-service/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

# Install dependencies
RUN npm install

# Copy source
COPY . .

EXPOSE 3000

CMD ["npm", "start", "--workspace=auth-service"]
