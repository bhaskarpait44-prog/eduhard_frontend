# Use the official Node.js 20 image
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Ensure the non-root node user owns the working directory
RUN chown -R node:node /app

# Switch to the non-root user
USER node

# Expose the port Vite runs on (configured as 3000 in vite.config.js)
EXPOSE 3000

# Add a HEALTHCHECK instruction
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Command to run Vite with --host to allow external access
CMD ["npm", "run", "dev"]
