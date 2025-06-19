import express from "express";
import cors from "cors";
import multer from "multer";
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import PDFDocument from "pdfkit";

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log("Headers:", req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// Configure S3 client for MinIO
const s3Client = new S3Client({
  endpoint: "http://localhost:9000",
  region: "us-east-1",
  credentials: {
    accessKeyId: "minioadmin",
    secretAccessKey: "minioadmin",
  },
  forcePathStyle: true, // Required for MinIO
  // Disable SSL verification for local development
  tls: false,
});

// Function to check if MinIO is ready
async function checkMinIOReady() {
  const maxRetries = 10;
  const retryDelay = 2000; // 2 seconds

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(
        `Checking MinIO connection (attempt ${i + 1}/${maxRetries})...`,
      );
      const headCommand = new HeadBucketCommand({
        Bucket: "print-your-trip-source-us-east-1",
      });
      await s3Client.send(headCommand);
      console.log("✅ MinIO is ready and bucket is accessible");
      return true;
    } catch (error) {
      console.log(
        `❌ MinIO not ready yet (attempt ${i + 1}/${maxRetries}): ${error.message}`,
      );
      if (i < maxRetries - 1) {
        console.log(`Waiting ${retryDelay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }
  console.error("❌ MinIO failed to become ready after all retries");
  return false;
}

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Proxy endpoint for image upload
app.post("/upload", upload.single("image"), async (req, res) => {
  console.log("=== UPLOAD ENDPOINT START ===");
  try {
    if (!req.file) {
      console.log("No file provided in request");
      return res.status(400).json({ error: "No image file provided" });
    }

    console.log("File received:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer
        ? `Buffer(${req.file.buffer.length})`
        : "No buffer",
    });

    // Generate sequential filename
    const timestamp = Date.now();
    const fileNumber = (Math.floor(timestamp / 1000) % 9999) + 1;
    const folderName = fileNumber.toString().padStart(4, "0");
    const filename = `${folderName}/${folderName}-rgb.jpg`;

    console.log("Generated filename:", filename);

    // Actually upload to MinIO
    const bucket = "print-your-trip-source-us-east-1";
    console.log("Uploading to MinIO:", bucket, filename);
    console.log("S3 Client config:", {
      endpoint: s3Client.config.endpoint,
      region: s3Client.config.region,
      forcePathStyle: s3Client.config.forcePathStyle,
    });

    // First, let's test if the bucket exists
    try {
      console.log("Testing bucket existence...");
      const headCommand = new HeadBucketCommand({
        Bucket: bucket,
      });
      await s3Client.send(headCommand);
      console.log("✅ Bucket exists and is accessible");
    } catch (bucketError) {
      console.error("❌ Bucket check failed:", bucketError.message);
      console.error("Bucket error details:", {
        name: bucketError.name,
        code: bucketError.code,
        statusCode: bucketError.$metadata?.httpStatusCode,
      });
    }

    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: req.file.buffer,
      ContentType: req.file.mimetype || "image/jpeg",
    });

    console.log("Sending PutObjectCommand...");
    await s3Client.send(putCommand);
    console.log("Successfully uploaded to MinIO");

    // Use local MinIO URL for development
    const downloadUrl = `http://localhost:9000/${bucket}/${filename}`;

    const response = {
      message: "Image uploaded successfully",
      s3Path: filename,
      bucket: bucket,
      downloadUrl: downloadUrl,
    };

    console.log("Upload response:", JSON.stringify(response, null, 2));
    console.log("=== UPLOAD ENDPOINT SUCCESS ===");
    res.json(response);
  } catch (error) {
    console.error("=== UPLOAD ENDPOINT ERROR ===");
    console.error("Error details:", error);
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Error uploading image",
      details: error.message,
      code: error.code,
    });
  }
});

// Proxy endpoint for PDF conversion
app.post("/convert", async (req, res) => {
  console.log("=== CONVERT ENDPOINT START ===");
  try {
    const { s3Path } = req.body;

    console.log("Convert request body:", req.body);
    console.log("S3 Path:", s3Path);

    if (!s3Path) {
      console.log("No S3 path provided");
      return res.status(400).json({ error: "S3 path is required" });
    }

    // Define bucket name
    const bucket = "print-your-trip-source-us-east-1";

    // Download the image from MinIO
    console.log(`Downloading image from MinIO: ${s3Path}`);
    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: s3Path,
    });

    const s3Response = await s3Client.send(getCommand);

    // Convert the S3 response body stream to buffer
    const chunks = [];
    for await (const chunk of s3Response.Body) {
      chunks.push(chunk);
    }
    const imageBuffer = Buffer.concat(chunks);
    console.log(`Downloaded image: ${imageBuffer.length} bytes`);

    // Process image with Sharp (convert to CMYK if needed, resize, etc.)
    console.log("Processing image with Sharp...");
    const processedImageBuffer = await sharp(imageBuffer)
      .resize(1800, 1200, {
        fit: "cover",
        position: "center",
      })
      .jpeg({
        quality: 95,
        mozjpeg: true,
      })
      .toBuffer();

    console.log(`Processed image: ${processedImageBuffer.length} bytes`);

    // Create PDF with the actual image
    console.log("Creating PDF with image...");
    const pdfBuffer = await new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: [612, 792], // 8.5 x 11 inches at 72 DPI
          margins: { top: 36, bottom: 36, left: 36, right: 36 }, // 0.5 inch margins
        });

        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Calculate image dimensions to fit the page
        const pageWidth = 612 - 72; // Page width minus margins
        const pageHeight = 792 - 72; // Page height minus margins

        // Calculate scaling to fit image on page while maintaining aspect ratio
        const imageAspectRatio = 1800 / 1200; // 1.5:1
        let imageWidth, imageHeight;

        if (pageWidth / pageHeight > imageAspectRatio) {
          // Fit to height
          imageHeight = pageHeight;
          imageWidth = imageHeight * imageAspectRatio;
        } else {
          // Fit to width
          imageWidth = pageWidth;
          imageHeight = imageWidth / imageAspectRatio;
        }

        // Center the image on the page
        const x = (612 - imageWidth) / 2;
        const y = (792 - imageHeight) / 2;

        // Add the image to the PDF
        doc.image(processedImageBuffer, x, y, {
          width: imageWidth,
          height: imageHeight,
        });

        // Add a small watermark/title
        doc
          .fontSize(8)
          .fillColor("#666666")
          .text("Print Your Trip", 36, 792 - 24, { align: "left" });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });

    console.log(`Created PDF: ${pdfBuffer.length} bytes`);

    // Use the correct naming convention
    const outputKey = s3Path.replace("-rgb.jpg", "-cmyk.pdf");
    console.log("Generated output key:", outputKey);

    // Upload PDF to MinIO
    console.log("Uploading to MinIO:", bucket, outputKey);
    console.log("S3 Client config:", {
      endpoint: s3Client.config.endpoint,
      region: s3Client.config.region,
      forcePathStyle: s3Client.config.forcePathStyle,
    });

    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: outputKey,
      Body: pdfBuffer,
      ContentType: "application/pdf",
    });

    console.log("Sending PutObjectCommand...");
    await s3Client.send(putCommand);
    console.log("Successfully uploaded to MinIO");

    // Use local MinIO URL for development
    const downloadUrl = `http://localhost:9000/${bucket}/${outputKey}`;

    const response = {
      message: "Successfully converted image to CMYK PDF",
      downloadUrl: downloadUrl,
      inputKey: s3Path,
      outputKey,
    };

    console.log("Convert response:", JSON.stringify(response, null, 2));
    console.log("=== CONVERT ENDPOINT SUCCESS ===");
    res.json(response);
  } catch (error) {
    console.error("=== CONVERT ENDPOINT ERROR ===");
    console.error("Error details:", error);
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Error converting image to PDF",
      details: error.message,
      name: error.name,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  console.log("Health check requested");
  res.json({ status: "OK", message: "Development server is running" });
});

app.listen(port, () => {
  console.log(`Development server running on http://localhost:${port}`);
  console.log("This server uploads files to MinIO for development");
});
