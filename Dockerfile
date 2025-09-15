# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install minimal dependencies
COPY package.json ./
RUN npm install

RUN npm install -y -g typescript
# Copy TypeScript config
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Copy .env file for default configuration (if exists)
# Using .env.example as fallback if .env doesn't exist
COPY ./.env .env

# Compile TypeScript manually using tsc with proper flags for ES modules
RUN tsc --outDir dist --module esnext --target esnext --moduleResolution node --allowSyntheticDefaultImports --esModuleInterop src/cli.ts src/index.ts


# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Default port
EXPOSE 3200

# Default environment variables (can be overridden at runtime)
# These will be used if not specified in .env file or docker run command
ENV MCP_SERVER_PORT=3200
ENV MAP_API_PROVIDER=riskscape

# Start the MCP server
# The server will read configuration from .env file first, then ENV variables, then command line args
CMD ["node", "dist/cli.js"]