# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install typescript globally for building
RUN npm install -g typescript

# Copy package files and install minimal dependencies
COPY package.json ./
RUN npm install --only=production

# Copy TypeScript config
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Compile TypeScript manually using tsc
RUN tsc --outDir dist --module esnext --target esnext --moduleResolution node src/cli.ts src/index.ts

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Default port
EXPOSE 3200

# Environment variables for configuration
ENV MCP_SERVER_PORT=3200
ENV MAP_API_PROVIDER=riskscape

# Start the MCP server
CMD ["node", "dist/cli.js", "--port", "3200", "--provider", "riskscape"]