# Print Your Trip Backend API

A serverless backend API for the Print Your Trip application that handles image uploads, processing, and CMYK PDF conversion for postcard printing.

## 🚀 Overview

This backend provides two main functionalities:
1. **Image Upload** - Accepts cropped images from frontend and stores them in S3 with sequential numbering
2. **PDF Conversion** - Converts RGB images to CMYK PDFs optimized for professional printing (4×6 inches at 300 DPI)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [API Endpoints](#-api-endpoints)
- [Setup & Installation](#-setup--installation)
- [Environment Configuration](#-environment-configuration)
- [Usage Examples](#-usage-examples)
- [File Structure](#-file-structure)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Technical Details](#-technical-details)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

### Core Features
- **Sequential File Numbering** - Automatic numbering system (0001, 0002, etc.)
- **Dual Upload Methods** - Support for both multipart/form-data and JSON base64
- **Image Processing** - Automatic cropping and resizing to 1800×1200 pixels
- **Color Space Conversion** - RGB to CMYK conversion for professional printing
- **PDF Generation** - High-quality PDF creation with exact print dimensions
- **S3 Storage** - Secure cloud storage with public download URLs
- **CORS Support** - Full CORS configuration for frontend integration

### Technical Features
- **Serverless Architecture** - AWS Lambda with Serverless Framework
- **Error Handling** - Comprehensive error handling and logging
- **Environment Management** - Multi-stage deployment support
- **Auto-scaling** - Automatic scaling based on demand

## 🛠 Tech Stack

- **Runtime**: Node.js 18.x
- **Framework**: Serverless Framework
- **Cloud Provider**: AWS (Lambda, S3, API Gateway)
- **Image Processing**: Sharp
- **PDF Generation**: PDFKit
- **AWS SDK**: @aws-sdk/client-s3

## 🔗 API Endpoints

### 1. Upload Image

Upload and store images in S3 with sequential numbering.

#### Endpoint
```
POST /upload
```

#### Request Methods

**Method 1: Multipart Form Data**
```http
POST /upload
Content-Type: multipart/form-data

Body:
- image: [FILE] (JPG/PNG image file)
```

**Method 2: JSON with Base64**
```http
POST /upload
Content-Type: application/json

{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "fileName": "image.jpg"
}
```

#### Response
```json
{
  "message": "Image uploaded successfully",
  "s3Path": "0001/0001-rgb.jpg",
  "bucket": "your-bucket-name",
  "downloadUrl": "https://your-bucket.s3.eu-north-1.amazonaws.com/0001/0001-rgb.jpg",
  "folderNumber": 1
}
```

#### Response Codes
- `200` - Success
- `400` - Bad request (missing image, invalid format)
- `500` - Server error (S3 issues, processing errors)

---

### 2. Convert to CMYK PDF

Convert uploaded RGB images to CMYK PDFs optimized for printing.

#### Endpoint
```
POST /convert
```

#### Request
```http
POST /convert
Content-Type: application/json

{
  "s3Path": "0001/0001-rgb.jpg"
}
```

#### Response
```json
{
  "message": "PDF conversion completed successfully",
  "pdfPath": "0001/0001-cmyk.pdf",
  "pdfDownloadUrl": "https://your-bucket.s3.eu-north-1.amazonaws.com/0001/0001-cmyk.pdf",
  "originalPath": "0001/0001-rgb.jpg",
  "bucket": "your-bucket-name"
}
```

#### Response Codes
- `200` - Success
- `400` - Bad request (missing s3Path)
- `500` - Server error (S3 issues, conversion errors)

---

### Error Response Format
```json
{
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18.x or higher
- AWS CLI configured with appropriate credentials
- Serverless Framework CLI

### Installation Steps

1. **Clone and navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Install Serverless Framework globally (if not installed)**
```bash
npm install -g serverless
```

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Deploy or run locally**
```bash
# Local development
npm run offline

# Deploy to AWS
npm run deploy
```

## ⚙️ Environment Configuration

### Required Environment Variables

Create a `.env` file in the backend root:

```env
# AWS Configuration
AWS_REGION=eu-north-1
IMAGE_S3_BUCKET=your-print-your-trip-bucket-name

# Stage Configuration
STAGE=local
```

### AWS Credentials

Ensure your AWS credentials are configured:

**Option 1: AWS CLI**
```bash
aws configure
```

**Option 2: Environment Variables**
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

**Option 3: IAM Roles** (Recommended for production)

### Required AWS Permissions

Your AWS credentials need the following permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

## 💡 Usage Examples

### Frontend Integration

**React/JavaScript Example**
```javascript
// Upload image from canvas
const uploadImage = async (canvasElement) => {
  // Convert canvas to blob
  const blob = await new Promise(resolve => 
    canvasElement.toBlob(resolve, 'image/jpeg', 0.9)
  );
  
  // Create form data
  const formData = new FormData();
  formData.append('image', blob);
  
  // Upload
  const response = await fetch('/upload', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result.s3Path;
};

// Convert to PDF
const convertToPDF = async (s3Path) => {
  const response = await fetch('/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ s3Path })
  });
  
  const result = await response.json();
  return result.pdfDownloadUrl;
};

// Complete workflow
const processImage = async (canvasElement) => {
  const s3Path = await uploadImage(canvasElement);
  const pdfUrl = await convertToPDF(s3Path);
  
  // Download PDF
  window.open(pdfUrl);
};
```

### cURL Examples

**Upload Image**
```bash
curl -X POST http://localhost:5200/upload \
  -F "image=@/path/to/your/image.jpg"
```

**Convert to PDF**
```bash
curl -X POST http://localhost:5200/convert \
  -H "Content-Type: application/json" \
  -d '{"s3Path": "0001/0001-rgb.jpg"}'
```

## 📁 File Structure

```
backend/
├── src/
│   ├── handlers/
│   │   ├── auth.js              # Authentication handlers
│   │   └── image.js             # Image upload & conversion handlers
│   ├── services/
│   │   ├── s3.service.js        # S3 operations service
│   │   └── pdf-conversion.service.js  # PDF conversion service
│   ├── utils/
│   │   └── file.utils.js        # File utilities & helpers
│   └── config/
│       ├── permissions.yml      # IAM permissions
│       └── resources.yml        # AWS resources (S3 bucket)
├── serverless.yml               # Serverless configuration
├── package.json                 # Dependencies & scripts
└── README.md                    # This file
```

### S3 File Organization

Files are stored in S3 with the following structure:
```
bucket-name/
├── 0001/
│   ├── 0001-rgb.jpg    # Original uploaded image
│   └── 0001-cmyk.pdf   # Generated CMYK PDF
├── 0002/
│   ├── 0002-rgb.jpg
│   └── 0002-cmyk.pdf
└── ...
```

## 🚀 Deployment

### Local Development
```bash
# Start local server
npm run offline

# Server will run on http://localhost:5200
```

### AWS Deployment
```bash
# Deploy to AWS
npm run deploy

# Deploy to specific stage
serverless deploy --stage production
```

### Stage Management

The application supports multiple deployment stages:

- **local** - Local development
- **dev** - Development environment  
- **staging** - Staging environment
- **production** - Production environment

Configure different environments by updating the stage in your deployment command.

## 🧪 Testing

### Manual Testing

1. **Start local server**
```bash
npm run offline
```

2. **Test upload endpoint**
```bash
curl -X POST http://localhost:5200/upload \
  -F "image=@test-image.jpg"
```

3. **Test conversion endpoint**
```bash
curl -X POST http://localhost:5200/convert \
  -H "Content-Type: application/json" \
  -d '{"s3Path": "0001/0001-rgb.jpg"}'
```

### Using Postman

You can use any HTTP client like Postman to test the endpoints:

1. **Import endpoints**: Create requests for `/upload` and `/convert`
2. **Set base URL**: `http://localhost:5200` (local) or your deployed URL
3. **Test workflow**: Upload image → Get s3Path → Convert to PDF

## 🔧 Technical Details

### Image Processing Pipeline

1. **Input Validation**
   - Accepts JPG/PNG formats
   - Validates file size and content type

2. **Image Optimization**
   - Resizes to exactly 1800×1200 pixels (4×6 inches at 300 DPI)
   - Uses 'cover' fit mode with center positioning
   - Maintains aspect ratio while cropping excess

3. **Storage**
   - Sequential numbering system
   - Organized folder structure
   - Public read access for downloads

### PDF Conversion Process

1. **Color Space Conversion**
   - RGB to CMYK conversion using Sharp
   - Maintains image quality at 100% JPEG quality

2. **PDF Generation**
   - Exact dimensions for 4×6 inch postcards
   - 300 DPI resolution for professional printing
   - Zero margins for full-bleed printing

3. **Output Optimization**
   - Optimized file sizes
   - Print-ready CMYK color space
   - Compatible with professional printing services

### Performance Optimizations

- **Memory Management**: Efficient buffer handling for large images
- **Streaming**: Stream-based processing to minimize memory usage
- **Concurrent Processing**: Parallel S3 operations where possible
- **Error Recovery**: Graceful error handling with detailed logging

## 🛡️ Security

### Authentication
- Currently configured for open access
- Can be extended with JWT or API key authentication

### CORS Configuration
- Configured to allow cross-origin requests
- Customizable origins in serverless.yml

### S3 Security
- Public read access for download URLs
- Secure upload with proper IAM permissions
- Bucket policies configured for minimal required access

## 🐛 Troubleshooting

### Common Issues

**1. S3 Access Denied**
```
Error: Access Denied
Solution: Check AWS credentials and bucket permissions
```

**2. Image Processing Errors**
```
Error: Sharp processing failed
Solution: Ensure image format is supported (JPG/PNG)
```

**3. PDF Generation Fails**
```
Error: PDF conversion failed
Solution: Check image file exists in S3 and is accessible
```

**4. CORS Errors**
```
Error: CORS policy error
Solution: Verify CORS configuration in serverless.yml
```

### Debug Mode

Enable detailed logging by setting:
```env
DEBUG=true
```

### Monitoring

Monitor your application using:
- AWS CloudWatch Logs
- Serverless Dashboard
- API Gateway metrics

## 🏗️ Architecture & Modularity

### How We Structure Lambda and Frontend for Modularity

#### **Backend Modular Design**

**1. Layered Architecture**
```
├── Handlers Layer (API Gateway Integration)
│   ├── image.js - Route handlers with minimal business logic
│   └── auth.js - Authentication handlers
├── Services Layer (Business Logic)
│   ├── s3.service.js - S3 operations abstraction
│   └── pdf-conversion.service.js - Image processing logic
├── Utils Layer (Shared Utilities)
│   └── file.utils.js - Common file operations
└── Config Layer (Infrastructure as Code)
    ├── permissions.yml - IAM policies
    └── resources.yml - AWS resources
```

**2. Separation of Concerns**
- **Handlers**: Only handle HTTP requests/responses and validation
- **Services**: Contain all business logic and external service interactions
- **Utils**: Reusable functions across the application
- **Config**: Infrastructure and environment management

**3. Dependency Injection Pattern**
```javascript
// Services are injected into handlers, not imported directly
export const upload = async (event) => {
  const s3Service = new S3Service(config);
  const fileUtils = new FileUtils();
  // Handler focuses only on request/response
};
```

**4. Environment Abstraction**
- All environment-specific configurations centralized
- Easy switching between local/dev/staging/production
- Secrets management through environment variables

#### **Frontend Integration Points**

**1. API Contract Design**
- RESTful endpoints with consistent response formats
- Standardized error codes and messages
- Versioned API endpoints for backward compatibility

**2. Flexible Upload Methods**
```javascript
// Supports multiple integration patterns
const uploadMethods = {
  formData: (file) => uploadAsFormData(file),
  base64: (canvas) => uploadAsBase64(canvas),
  blob: (blob) => uploadAsBlob(blob)
};
```

**3. State Management Ready**
- Predictable response structures for state management
- Environment variables for API endpoints
- Error handling patterns for UI feedback

### Benefits of This Structure

- **Testability**: Each layer can be unit tested independently
- **Maintainability**: Changes in one layer don't affect others
- **Scalability**: Services can be extracted to microservices if needed
- **Reusability**: Utils and services can be shared across functions
- **Deployability**: Different components can be deployed independently

---

## 📈 Scaling to 10,000 Users/Day

### Current Capacity Analysis
- **10,000 users/day** ≈ **417 users/hour** ≈ **7 users/minute**
- Assuming 2-3 API calls per user: **~20 requests/minute**
- Current architecture can handle this with minimal changes

### Recommended Changes for Scale

#### **1. Lambda Optimizations**
```yaml
# serverless.yml optimizations
provider:
  timeout: 30
  memorySize: 1024  # Increase for image processing
  reservedConcurrency: 50  # Reserve capacity
  provisioned: 10  # Keep functions warm
```

#### **2. S3 Performance Optimization**
```javascript
// Implement S3 Transfer Acceleration
const s3Config = {
  useAccelerateEndpoint: true,
  region: 'us-east-1'  // Move to us-east-1 for better performance
};

// Add S3 request optimization
const putObjectParams = {
  StorageClass: 'STANDARD_IA',  // Cost optimization
  ServerSideEncryption: 'AES256'  // Security
};
```

#### **3. Add Caching Layer**
```javascript
// Redis cache for file metadata
const cacheService = {
  getFileNumber: async () => {
    const cached = await redis.get('next-file-number');
    return cached || await calculateFromS3();
  },
  incrementFileNumber: async () => {
    return await redis.incr('next-file-number');
  }
};
```

#### **4. Database for Metadata**
```javascript
// DynamoDB table for file tracking
const FileMetadata = {
  TableName: 'print-your-trip-files',
  Schema: {
    fileId: 'String',      // Partition key
    s3Path: 'String',
    pdfPath: 'String',
    status: 'String',      // processing|completed|failed
    createdAt: 'String',
    userId: 'String'       // For user tracking
  }
};
```

#### **5. Add Content Delivery Network (CDN)**
```yaml
# CloudFront distribution for S3
CloudFrontDistribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      Origins:
        - DomainName: ${self:custom.bucket}.s3.amazonaws.com
          Id: S3Origin
          S3OriginConfig: {}
      DefaultCacheBehavior:
        TargetOriginId: S3Origin
        ViewerProtocolPolicy: redirect-to-https
        TTL: 86400  # 24 hours
```

#### **6. Implement Rate Limiting**
```javascript
// API Gateway rate limiting
const rateLimiting = {
  BurstLimit: 100,
  RateLimit: 50,
  UsagePlan: {
    Throttle: {
      BurstLimit: 200,
      RateLimit: 100
    }
  }
};
```

#### **7. Cost Optimization**
- **S3 Intelligent Tiering**: Automatic cost optimization
- **Lambda Provisioned Concurrency**: Only for peak hours
- **CloudWatch Log Retention**: 30 days instead of indefinite
- **S3 Lifecycle Policies**: Archive old files after 1 year

#### **8. Performance Monitoring**
```javascript
// Add X-Ray tracing
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

// Performance metrics
const logPerformance = (functionName, duration) => {
  console.log(`METRIC: ${functionName} duration: ${duration}ms`);
};
```

---

## 🔍 Production Monitoring & Fallback Systems

### **Monitoring Stack**

#### **1. Application Performance Monitoring (APM)**
```javascript
// Sentry for error tracking
import * as Sentry from '@sentry/serverless';

Sentry.AWSLambda.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

export const upload = Sentry.AWSLambda.wrapHandler(async (event) => {
  // Handler code
});
```

#### **2. AWS CloudWatch Dashboard**
```yaml
# Custom CloudWatch dashboard
MonitoringDashboard:
  Type: AWS::CloudWatch::Dashboard
  Properties:
    DashboardBody: |
      {
        "widgets": [
          {
            "type": "metric",
            "properties": {
              "metrics": [
                ["AWS/Lambda", "Duration", "FunctionName", "uploadImage"],
                ["AWS/Lambda", "Errors", "FunctionName", "uploadImage"],
                ["AWS/Lambda", "Invocations", "FunctionName", "uploadImage"]
              ],
              "period": 300,
              "stat": "Average",
              "region": "eu-north-1",
              "title": "Lambda Performance"
            }
          }
        ]
      }
```

#### **3. Real-time Alerts**
```yaml
# CloudWatch Alarms
ErrorRateAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: PrintYourTrip-HighErrorRate
    MetricName: Errors
    Namespace: AWS/Lambda
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 2
    Threshold: 5
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - !Ref SNSAlert

ResponseTimeAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: PrintYourTrip-SlowResponse
    MetricName: Duration
    Namespace: AWS/Lambda
    Statistic: Average
    Period: 300
    Threshold: 10000  # 10 seconds
    ComparisonOperator: GreaterThanThreshold
```

#### **4. Health Check Endpoints**
```javascript
// Add health check endpoint
export const health = async (event) => {
  const checks = {
    s3: await checkS3Connection(),
    lambda: 'ok',
    timestamp: new Date().toISOString()
  };
  
  const allHealthy = Object.values(checks).every(check => 
    check === 'ok' || check === true
  );
  
  return {
    statusCode: allHealthy ? 200 : 503,
    body: JSON.stringify(checks)
  };
};
```

### **Fallback Systems**

#### **1. Dead Letter Queues (DLQ)**
```yaml
# SQS Dead Letter Queue for failed operations
DeadLetterQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: print-your-trip-dlq
    MessageRetentionPeriod: 1209600  # 14 days

# Lambda with DLQ configuration
functions:
  convertToPDF:
    handler: src/handlers/image.convert
    deadLetter:
      sqs: !GetAtt DeadLetterQueue.Arn
```

#### **2. Circuit Breaker Pattern**
```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

#### **3. Backup Storage Strategy**
```javascript
// Multi-region S3 replication
const s3BackupConfig = {
  ReplicationConfiguration: {
    Role: 'arn:aws:iam::account:role/replication-role',
    Rules: [{
      Status: 'Enabled',
      Prefix: '',
      Destination: {
        Bucket: 'arn:aws:s3:::backup-bucket-us-west-2',
        StorageClass: 'STANDARD_IA'
      }
    }]
  }
};

// Automatic failover to backup region
const uploadWithFailover = async (bucket, key, data) => {
  try {
    return await s3Primary.putObject({Bucket: bucket, Key: key, Body: data});
  } catch (error) {
    console.warn('Primary S3 failed, trying backup...');
    return await s3Backup.putObject({Bucket: backupBucket, Key: key, Body: data});
  }
};
```

#### **4. Graceful Degradation**
```javascript
// Fallback to lower quality if processing fails
const convertWithFallback = async (imageBuffer) => {
  try {
    return await convertToCMYK(imageBuffer);
  } catch (error) {
    console.warn('CMYK conversion failed, falling back to RGB PDF');
    return await convertToRGBPDF(imageBuffer);
  }
};
```

#### **5. Retry Logic with Exponential Backoff**
```javascript
const retryWithBackoff = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

### **Alerting & Incident Response**

#### **1. Multi-channel Alerts**
```yaml
# SNS topic for alerts
AlertTopic:
  Type: AWS::SNS::Topic
  Properties:
    Subscription:
      - Protocol: email
        Endpoint: alerts@printyourtrip.com
      - Protocol: sms
        Endpoint: +1234567890
      - Protocol: https
        Endpoint: https://hooks.slack.com/services/webhook
```

#### **2. Runbook Integration**
```javascript
// Automated incident response
const handleCriticalError = async (error) => {
  await Promise.all([
    sendSlackAlert(error),
    createJiraTicket(error),
    triggerPagerDuty(error),
    logToSentry(error)
  ]);
};
```

#### **3. Business Metrics Monitoring**
```javascript
// Track business KPIs
const logBusinessMetrics = {
  successfulUploads: () => cloudwatch.putMetric('SuccessfulUploads', 1),
  conversionRate: (rate) => cloudwatch.putMetric('ConversionRate', rate),
  userSatisfaction: (score) => cloudwatch.putMetric('UserSatisfaction', score)
};
```

## 📚 Additional Resources

- [Serverless Framework Documentation](https://www.serverless.com/framework/docs/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [PDFKit Documentation](https://pdfkit.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License - see the package.json file for details.

---

**Built with ❤️ for Print Your Trip** 