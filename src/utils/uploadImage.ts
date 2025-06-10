import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export const uploadImage = async (file: File, itemId: string) => {
  const storageRef = ref(storage, `items/${itemId}/${file.name}`);
  await uploadBytes(storageRef, file);
  const Imageurl = await getDownloadURL(storageRef);
  return Imageurl;
};

export const deleteImage = async (imageUrl: string) => {
  try {
    // Extract the file path from the download URL
    // Firebase URLs look like: https://firebasestorage.googleapis.com/v0/b/bucket/o/items%2FitemId%2Ffilename?alt=media&token=...
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+?)(\?|$)/);
    
    if (pathMatch) {
      const filePath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
      console.log("Old image deleted successfully");
    }
  } catch (error) {
    console.error("Error deleting old image:", error);
    // Don't throw error - we still want to upload the new image even if delete fails
  }
};

export const replaceImage = async (file: File, itemId: string, oldImageUrl?: string) => {
  // Delete old image if it exists
  if (oldImageUrl) {
    await deleteImage(oldImageUrl);
  }
  
  // Upload new image
  return await uploadImage(file, itemId);
};