#!/bin/bash

echo "🚀 Starting Print Your Trip local development environment..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $DEV_SERVER_PID 2>/dev/null || true
    kill $REACT_PID 2>/dev/null || true
    docker-compose down
    echo "✅ All services stopped"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Stop any existing containers and clean up
echo "🧹 Cleaning up existing containers..."
docker-compose down > /dev/null 2>&1 || true

# Start MinIO (S3-compatible storage)
echo "📦 Starting MinIO..."
docker-compose up -d

# Wait for MinIO to be ready with better health check
echo "⏳ Waiting for MinIO to be ready..."
MINIO_READY=false
for i in {1..30}; do
    if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
        MINIO_READY=true
        break
    fi
    echo "   Attempt $i/30: MinIO not ready yet, waiting..."
    sleep 2
done

if [ "$MINIO_READY" = false ]; then
    echo "❌ MinIO failed to start after 60 seconds"
    docker-compose logs minio
    exit 1
fi

echo "✅ MinIO is running at http://localhost:9000"
echo "📊 MinIO Console: http://localhost:9001 (login: minioadmin/minioadmin)"

# Configure MinIO client with proper credentials
echo "🔧 Configuring MinIO client..."
docker exec print-your-trip-minio mc config host add minio http://localhost:9000 minioadmin minioadmin

# Wait a bit more for MinIO to be fully ready
sleep 5

# Create S3 bucket with error handling
echo "🪣 Creating S3 bucket..."
if docker exec print-your-trip-minio mc mb minio/print-your-trip-source-us-east-1 --ignore-existing; then
    echo "✅ S3 bucket created successfully"
else
    echo "❌ Failed to create S3 bucket"
    docker-compose logs minio
    exit 1
fi

# Set bucket permissions
echo "🔐 Setting bucket permissions..."
if docker exec print-your-trip-minio mc anonymous set public minio/print-your-trip-source-us-east-1; then
    echo "✅ S3 bucket permissions configured"
else
    echo "❌ Failed to set bucket permissions"
    exit 1
fi

# Verify bucket exists
echo "🔍 Verifying bucket setup..."
if docker exec print-your-trip-minio mc ls minio/print-your-trip-source-us-east-1 > /dev/null 2>&1; then
    echo "✅ S3 bucket verified and accessible"
else
    echo "❌ S3 bucket verification failed"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

# Start the development server
echo "🖥️  Starting development server..."
cd client
npm run dev:server &
DEV_SERVER_PID=$!
cd ..

# Wait for dev server to start
echo "⏳ Waiting for development server to start..."
for i in {1..15}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Development server is ready"
        break
    fi
    sleep 2
done

# Start the React app
echo "⚛️  Starting React app..."
cd client
npm run dev &
REACT_PID=$!
cd ..

# Wait for React app to start
echo "⏳ Waiting for React app to start..."
sleep 5

echo ""
echo "🎉 Local development environment is ready!"
echo ""
echo "📱 React App: http://localhost:5173"
echo "🔧 API Server: http://localhost:3001"
echo "📦 MinIO S3: http://localhost:9000"
echo "📊 MinIO Console: http://localhost:9001 (login: minioadmin/minioadmin)"
echo ""
echo "🧪 Test upload:"
echo "   curl -X POST -F \"image=@your-file.jpg\" http://localhost:3001/upload"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait 