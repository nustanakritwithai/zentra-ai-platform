FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy built files
COPY dist/ ./dist/

# Expose port
EXPOSE 5000

# Start the server
ENV NODE_ENV=production
CMD ["node", "dist/index.cjs"]
