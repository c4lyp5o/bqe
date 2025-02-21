# Use the official Node.js Alpine image as the base image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm run install-server && npm run install-client

# Build the application
RUN npm run build-client

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port the app runs on
EXPOSE 5000
EXPOSE 5005

# Start the application
CMD ["npm", "start"]