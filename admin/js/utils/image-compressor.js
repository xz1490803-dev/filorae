// ============================================
// FILORAE ADMIN — Image Compression Utility
// ============================================

/**
 * Compresses an image file using HTML5 Canvas
 * @param {File} file - The original image file
 * @param {Object} options - Compression options
 * @param {number} [options.maxWidth=1200] - Max width of output image
 * @param {number} [options.maxHeight=1200] - Max height of output image
 * @param {number} [options.quality=0.8] - JPEG/WEBP quality (0 to 1)
 * @param {string} [options.type='image/webp'] - Output MIME type
 * @returns {Promise<File>} - A promise that resolves to the compressed File
 */
export async function compressImage(file, {
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8,
  type = 'image/webp'
} = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid file type. Please upload an image.'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Fill background with white in case of transparent png -> jpeg conversion
        if (type === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          
          // Create a new File object
          const extension = type === 'image/webp' ? 'webp' : 'jpg';
          const originalName = file.name.replace(/\.[^/.]+$/, ""); // Strip old extension
          const newFile = new File([blob], `${originalName}_optimized.${extension}`, {
            type: type,
            lastModified: Date.now(),
          });
          
          resolve(newFile);
        }, type, quality);
      };

      img.onerror = (error) => {
        reject(error);
      };
    };

    reader.onerror = (error) => {
      reject(error);
    };
  });
}
