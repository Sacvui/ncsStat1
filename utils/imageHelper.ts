/**
 * Compresses an image file using HTML5 Canvas.
 * - Resizes to max dimensions (default 300x300 for avatars)
 * - Converts to WebP format for optimal size
 * - Quality reduced to 0.8
 */
export async function compressImage(file: File, maxWidth = 300, maxHeight = 300, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = URL.createObjectURL(file);

        image.onload = () => {
            const canvas = document.createElement('canvas');
            let width = image.width;
            let height = image.height;

            // Calculate new dimensions
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

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            ctx.drawImage(image, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas to Blob failed'));
                    return;
                }

                // Create new file from blob
                const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                    type: 'image/webp',
                    lastModified: Date.now(),
                });

                resolve(newFile);
            }, 'image/webp', quality);
        };

        image.onerror = (error) => reject(error);
    });
}
