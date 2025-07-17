import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export const uploadImage = async (file: File, itemId: string) => {
  try {
    // Validate inputs
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (!itemId) {
      throw new Error('No item ID provided');
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }
    
    // Create a unique filename to avoid conflicts
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${timestamp}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, `items/${itemId}/${uniqueFileName}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const imageUrl = await getDownloadURL(snapshot.ref);
    
    return imageUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteImage = async (imageUrl: string) => {
  try {
    if (!imageUrl) {
      return; // No image to delete
    }
    
    // Extract the file path from the download URL
    // Firebase URLs look like: https://firebasestorage.googleapis.com/v0/b/bucket/o/items%2FitemId%2Ffilename?alt=media&token=...
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+?)(\?|$)/);
    
    if (pathMatch) {
      const filePath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.error('Delete image error:', error);
    // Don't throw error - we still want to upload the new image even if delete fails
  }
};

export const replaceImage = async (file: File, itemId: string, oldImageUrl?: string) => {
  try {
    // Delete old image if it exists
    if (oldImageUrl) {
      await deleteImage(oldImageUrl);
    }
    
    // Upload new image
    return await uploadImage(file, itemId);
  } catch (error) {
    console.error('Replace image error:', error);
    throw error;
  }
};