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

# Expose the port Vite runs on (default is 5173)
EXPOSE 5173

# Command to run Vite with --host to allow external access
CMD ["npm", "run", "dev"]
