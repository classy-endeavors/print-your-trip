# Print Your Trip

A web application that allows users to upload, crop, and convert images to CMYK PDF format for printing. The application consists of a React frontend and AWS Lambda backend.

## Features

- **Image Upload**: Support for various image formats including HEIC
- **Image Cropping**: Interactive cropping with fixed aspect ratio (1.5:1)
- **S3 Storage**: Images are stored in AWS S3 (or local MinIO for development)
- **CMYK Conversion**: Convert RGB images to CMYK color space
- **PDF Export**: Generate print-ready PDF files
- **Responsive UI**: Modern, responsive interface built with React and Tailwind CSS

## Project Structure

```
print-your-trip/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── ImageUploader.tsx  # Main image processing component
│   │   └── App.tsx
│   ├── server.js           # Development server
│   └── package.json
├── lambda/                 # AWS Lambda backend
│   ├── src/
│   │   ├── app.ts          # Main Lambda handler
│   │   ├── services/
│   │   │   ├── s3.service.ts       # S3 operations
│   │   │   └── pdf-conversion.service.ts  # PDF conversion
│   │   └── utils/
│   │       └── file.utils.ts       # File utilities
│   ├── template.yaml       # SAM template
│   └── package.json
├── docker-compose.yml      # Local MinIO setup
├── start-local.sh          # Local development script
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose (for local S3 storage)
- AWS CLI (for deployment)
- AWS SAM CLI (for local Lambda testing)

## Quick Start (Local Development)

The easiest way to get started is using the provided script that handles everything automatically:

```bash
chmod +x start-local.sh
./start-local.sh
```

**This single command will:**
1. ✅ Check if Docker and Node.js are installed
2. 🧹 Clean up any existing containers
3. 📦 Start MinIO (S3-compatible storage) in Docker
4. 🔧 Configure MinIO client with proper credentials
5. 🪣 Create the required S3 bucket with permissions
6. 📦 Install npm dependencies if needed
7. 🖥️ Start the development API server
8. ⚛️ Start the React development server

**Then open your browser to [http://localhost:5173](http://localhost:5173)**

**Available services:**
- 📱 **React App**: http://localhost:5173
- 🔧 **API Server**: http://localhost:3001  
- 📦 **MinIO S3**: http://localhost:9000
- 📊 **MinIO Console**: http://localhost:9001 (login: minioadmin/minioadmin)

**Test the upload:**
```bash
curl -X POST -F "image=@your-file.jpg" http://localhost:3001/upload
```

Press `Ctrl+C` to stop all services.

## Manual Setup

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev:all
   ```

   This will start both the React development server and the API proxy server.

### Local S3 Storage (MinIO)

For local development, we use MinIO as an S3-compatible storage:

1. Start MinIO:
   ```bash
   docker-compose up -d
   ```

2. Access MinIO Console:
   - URL: http://localhost:9001
   - Username: `minioadmin`
   - Password: `minioadmin`

3. The bucket `print-your-trip-source-us-east-1` will be created automatically

### Backend Setup

1. Navigate to the lambda directory:
   ```bash
   cd lambda
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the Lambda function:
   ```bash
   npm run compile
   ```

## Development

### Local Development

The application runs in development mode with local S3 storage:

1. Start the local environment:
   ```bash
   ./start-local.sh
   ```

2. Open your browser to `http://localhost:5173`

3. The development server at `http://localhost:3001` handles API requests
4. MinIO provides S3-compatible storage at `http://localhost:9000`

### API Endpoints

- `POST /api/upload` - Upload cropped image to S3
- `POST /api/convert` - Convert S3 image to CMYK PDF

## Deployment

### Deploy Lambda Function

1. Navigate to the lambda directory:
   ```bash
   cd lambda
   ```

2. Deploy using SAM:
   ```bash
   sam build
   sam deploy --guided
   ```

3. Note the API Gateway URL from the deployment output

### Update Frontend for Production

1. Update the API base URL in the frontend to point to your deployed Lambda function
2. Build the frontend:
   ```bash
   cd client
   npm run build
   ```

3. Deploy the built files to your preferred hosting service (S3, CloudFront, etc.)

## Workflow

1. **Upload Image**: User selects an image file (supports HEIC, JPEG, PNG)
2. **Crop Image**: User crops the image to the required aspect ratio (1.5:1)
3. **Save Photo**: Cropped image is uploaded to S3
4. **Export PDF**: Image is converted from RGB to CMYK and exported as PDF
5. **Download**: User can download the print-ready PDF

## Technical Details

### Frontend Technologies
- React 19 with TypeScript
- Tailwind CSS for styling
- React Image Crop for image cropping
- Axios for API communication
- HEIC2Any for HEIC image support

### Backend Technologies
- AWS Lambda with Node.js
- AWS S3 for file storage (MinIO for local development)
- Sharp for image processing
- PDFKit for PDF generation
- AWS SAM for deployment

### Image Processing
- Target dimensions: 1800x1200 pixels
- Aspect ratio: 1.5:1 (landscape)
- Color space conversion: RGB to CMYK
- Output format: PDF

## Environment Variables

### Lambda Function
- `SOURCE_BUCKET`: S3 bucket name for storing images and PDFs
- `S3_ENDPOINT`: S3 endpoint URL (for local MinIO: `http://localhost:9000`)
- `AWS_ACCESS_KEY_ID`: AWS access key (for local MinIO: `minioadmin`)
- `AWS_SECRET_ACCESS_KEY`: AWS secret key (for local MinIO: `minioadmin`)

## Troubleshooting

### Quick Start Script Issues

**"Docker is not running"**
- Start Docker Desktop or Docker daemon
- Run `docker info` to verify Docker is working

**"docker-compose is not installed"**
- Install Docker Compose: https://docs.docker.com/compose/install/

**"Node.js is not installed"**
- Install Node.js (v18+): https://nodejs.org/

**"MinIO failed to start"**
- Check if ports 9000/9001 are already in use
- Run `docker-compose down` and try again
- Check Docker logs: `docker-compose logs minio`

**"Bucket creation failed"**
- Wait longer for MinIO to be ready (it can take 30-60 seconds)
- Check MinIO console at http://localhost:9001
- Manually create bucket if needed

### HEIC Upload Issues
- Make sure the file input accepts `.heic` files
- Check browser console for any conversion errors
- Try converting HEIC to JPEG manually if issues persist

### S3/MinIO Issues
- Ensure MinIO is running: `docker-compose ps`
- Check MinIO console at http://localhost:9001
- Verify bucket exists: `print-your-trip-source-us-east-1`
- Test S3 connection: `cd client && node test-s3.js`

### Upload Errors
- **"NoSuchBucket"**: MinIO credentials not configured properly
- **"Connection refused"**: API server not running on port 3001
- **"CORS errors"**: Check that both React (5173) and API (3001) servers are running

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 