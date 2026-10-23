import { API_BASE_URL } from '../config/api';

/**
 * Resolves complaint image URLs seamlessly for both AWS S3 and local storage.
 * - If imageUrl is a full URL (e.g. AWS S3 https://bucket.s3.amazonaws.com/uploads/...), returns it directly.
 * - If imageUrl is a local file path (e.g. C:\CIVIC\uploads\photo.jpg or /uploads/photo.jpg), returns API_BASE_URL/uploads/photo.jpg.
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) {
    return 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&auto=format&fit=crop&q=60';
  }
  
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  const filename = imageUrl.split(/[\\/]/).pop();
  return `${API_BASE_URL}/uploads/${filename}`;
};
