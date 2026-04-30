/**
 * Native Canvas-based Image Compressor
 * Reduces massive file sizes strictly via Client-side downscaling.
 */

export interface CompressOptions {
  maxWidthOrHeight: number;
  quality: number; // 0.0 to 1.0
  fileType?: string; // e.g. "image/jpeg"
}

export const validateImageFile = (file: File, maxSizeMB: number = 10): string | null => {
  if (!file.type.startsWith("image/")) {
    return "กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (jpg, png, webp)";
  }
  
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return `ขนาดไฟล์ใหญ่เกินไป (${fileSizeMB.toFixed(1)}MB) กรุณาอัปโหลดไฟล์ขนาดไม่เกิน ${maxSizeMB}MB`;
  }
  
  return null;
};

export const compressImage = async (file: File, options: CompressOptions): Promise<File> => {
  return new Promise((resolve, reject) => {
    // We won't strictly compress if it's already ultra-small, but doing it ensures normalization.
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        let { width, height } = img;
        const maxDim = options.maxWidthOrHeight;

        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Fill background with white in case of transparent png -> jpeg conversion
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the downscaled image
        ctx.drawImage(img, 0, 0, width, height);

        const targetType = options.fileType || "image/jpeg";
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFile = new File([blob], file.name, {
                type: targetType,
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          },
          targetType,
          options.quality
        );
      };
      
      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (err) => reject(err);
  });
};
