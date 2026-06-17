# --- Stage 1: Build the Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Set up Backend & Runtime ---
FROM node:20-alpine
WORKDIR /app

# Copy and install production-only backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy built frontend assets to the location the backend expects
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy backend source code
COPY backend/src ./backend/src

# Create directory for persistent data (SQLite & Uploads)
RUN mkdir -p /app/backend/data

# Set environment variables
ENV PORT=3847
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Expose the default server port
EXPOSE 3847

# Define persistent storage volume for the SQLite DB and files
VOLUME ["/app/backend/data"]

WORKDIR /app/backend
CMD ["node", "src/server.js"]
