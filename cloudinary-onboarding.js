const cloudinary = require('cloudinary').v2;

// 1. Configure Cloudinary
// Using the credentials provided:
// Cloud Name: iwdexpzg (← replace this)
// API Key: 429768881848573 (← replace this)
// API Secret: btfF-PpbbC7dvLeg_yPSh900Wuc (← replace this)
cloudinary.config({
  cloud_name: 'iwdexpzg',
  api_key: '429768881848573',
  api_secret: 'btfF-PpbbC7dvLeg_yPSh900Wuc'
});

async function run() {
  try {
    console.log("Starting Cloudinary Integration Test...");

    // 2. Upload an image
    console.log("\nUploading sample image...");
    const uploadResult = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      { public_id: 'filorae_sample_upload' }
    );
    console.log("Upload Successful!");
    console.log("Secure URL:", uploadResult.secure_url);
    console.log("Public ID:", uploadResult.public_id);

    // 3. Get image details
    console.log("\nFetching image metadata...");
    const details = await cloudinary.api.resource(uploadResult.public_id);
    console.log("Width:", details.width, "px");
    console.log("Height:", details.height, "px");
    console.log("Format:", details.format);
    console.log("File Size:", details.bytes, "bytes");

    // 4. Transform the image
    // Generating a transformed URL
    // f_auto: Automatically selects the most efficient image format (e.g., WebP/AVIF) based on the user's browser.
    // q_auto: Automatically adjusts the image quality to reduce file size without visible degradation.
    console.log("\nGenerating optimized transformed image...");
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      fetch_format: 'auto',
      quality: 'auto'
    });

    console.log("\nDone! Click link below to see optimized version of the image. Check the size and the format.");
    console.log(transformedUrl);

  } catch (error) {
    console.error("Error during Cloudinary operations:", error);
  }
}

run();
