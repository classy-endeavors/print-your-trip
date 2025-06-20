# Print Your Trip - Client Application

A React TypeScript application for creating custom postcards from your travel photos. This project allows users to upload images, crop them to the correct aspect ratio, add custom messages, and convert them into printable PDF postcards.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your API URL:
     ```
     VITE_API_URL=your_backend_api_url
     ```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 📐 Image Aspect Ratio Management

### How We Ensure Uploaded Images Match Required Aspect Ratio

The application implements a comprehensive image aspect ratio management system to ensure all uploaded images conform to the required postcard dimensions:

#### 1. **Target Dimensions & Aspect Ratio**
- **Target Width**: 1800px
- **Target Height**: 1200px  
- **Target Aspect Ratio**: 1.5:1 (1800/1200)
- Defined in `src/lib/imageUtils.ts`

#### 2. **Automatic Crop Calculation**
When an image is uploaded, the system automatically calculates the optimal crop area:

```typescript
export const calculateInitialCrop = (
  displayWidth: number,
  displayHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): Crop => {
  const TARGET_ASPECT_RATIO = TARGET_WIDTH / TARGET_HEIGHT;
  const photoAspectRatio = naturalWidth / naturalHeight;
  
  if (photoAspectRatio > TARGET_ASPECT_RATIO) {
    // Image is wider than target - crop horizontally
    height = displayHeight;
    width = height * TARGET_ASPECT_RATIO;
    x = (displayWidth - width) / 2;  // Center horizontally
    y = 0;
  } else {
    // Image is taller than target - crop vertically
    width = displayWidth;
    height = width / TARGET_ASPECT_RATIO;
    x = 0;
    y = (displayHeight - height) / 2;  // Center vertically
  }
}
```

#### 3. **Interactive Crop Tool**
- Uses `react-image-crop` library for precise cropping
- **Locked aspect ratio**: The crop tool is locked to maintain the exact 1.5:1 aspect ratio
- **Visual feedback**: Users can see exactly what portion of their image will be used
- **Responsive design**: Works on both desktop and mobile devices

#### 4. **Final Image Processing**
After cropping, the system ensures the final output matches exact specifications:

```typescript
export const getCroppedImg = (image: HTMLImageElement, crop: Crop): Promise<string> => {
  const canvas = document.createElement("canvas");
  canvas.width = TARGET_WIDTH;   // Always 1800px
  canvas.height = TARGET_HEIGHT; // Always 1200px
  
  // Scale and draw the cropped portion to exact target dimensions
  ctx.drawImage(
    img,
    crop.x * scaleX, crop.y * scaleY,           // Source position
    crop.width * scaleX, crop.height * scaleY, // Source dimensions
    0, 0,                                       // Destination position
    TARGET_WIDTH, TARGET_HEIGHT                 // Destination dimensions (exact)
  );
}
```

#### 5. **Multi-Format Support**
- **HEIC conversion**: Automatically converts iPhone HEIC images to JPEG
- **Quality optimization**: Outputs at 95% JPEG quality for optimal file size
- **Error handling**: Graceful fallback for unsupported formats

#### 6. **Quality Assurance**
- Every uploaded image is processed to exactly 1800x1200 pixels
- Maintains aspect ratio throughout the entire pipeline
- Prevents distortion or stretching of images
- Ensures consistent postcard dimensions for printing

## 🏗️ Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── Create/
│   │   │   ├── ImageUploader.tsx    # Main image upload & crop component
│   │   │   ├── CustomMessage.tsx    # Message input step
│   │   │   ├── AddressForm.tsx      # Address input step
│   │   │   ├── Stepper.tsx          # Multi-step form navigation
│   │   │   └── ...
│   │   ├── Layout.tsx               # Main layout wrapper
│   │   ├── Navbar.tsx               # Navigation component
│   │   └── ...
│   ├── pages/
│   │   ├── Home.tsx                 # Landing page
│   │   ├── Create.tsx               # Main postcard creation flow
│   │   ├── FAQ.tsx                  # Frequently asked questions
│   │   └── ...
│   ├── lib/
│   │   ├── imageUtils.ts            # Image processing utilities
│   │   └── utils.ts                 # General utility functions
│   └── assets/                      # Static assets
├── public/                          # Public assets
└── ...
```

## 🛠️ Technologies Used

### Core Framework
- **React 19.1.0** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### UI & Styling
- **Tailwind CSS 4.1.10** - Utility-first CSS framework
- **Motion** - Animation library
- **Clsx** - Conditional class names

### Image Processing
- **react-image-crop 11.0.10** - Interactive image cropping
- **heic2any 0.0.4** - HEIC to JPEG conversion
- **Sharp 0.34.2** - Image optimization

### HTTP & API
- **Axios 1.10.0** - HTTP client
- **AWS SDK S3** - Cloud storage integration

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **TypeScript ESLint** - TypeScript-specific linting

## 📱 Features

### Multi-Step Creation Process
1. **Image Upload & Crop** - Upload and crop images to perfect aspect ratio
2. **Custom Message** - Add personalized messages to postcards
3. **Address Input** - Enter recipient address information
4. **Review & Export** - Preview and export as PDF

### Image Processing Capabilities
- **HEIC Support** - Automatic conversion of iPhone images
- **Aspect Ratio Enforcement** - Ensures proper postcard dimensions
- **Quality Optimization** - Balances file size and image quality
- **Mobile Responsive** - Works seamlessly on all devices

### User Experience
- **Progressive Web App** - Works offline and mobile-friendly
- **State Persistence** - Saves progress locally
- **Error Handling** - Graceful error messages and recovery
- **Accessibility** - WCAG compliant interface

## 🔧 Configuration

### Environment Variables
```bash
VITE_API_URL=your_backend_api_url
```

### Build Configuration
- **Vite Config** - Optimized for production builds
- **TypeScript Config** - Strict type checking enabled
- **ESLint Config** - React and TypeScript rules
- **Tailwind Config** - Custom design system

## 📚 API Integration

The client communicates with a serverless backend for:
- **Image Upload** - Uploads processed images to S3
- **PDF Generation** - Converts images to printable postcards
- **File Management** - Handles temporary file cleanup

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Manual Build
```bash
npm run build
# Serve the `dist` folder
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is private and proprietary.

---

*Built with ❤️ for travelers who want to share their memories in style.*
