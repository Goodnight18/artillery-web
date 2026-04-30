import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads a compressed File to Firebase Storage.
 */
export const uploadImageToStorage = async (
  file: File,
  storagePath: string,
  onProgress?: (progress: number) => void
): Promise<{ downloadUrl: string; fullPath: string }> => {
  return new Promise((resolve, reject) => {
    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              downloadUrl,
              fullPath: uploadTask.snapshot.ref.fullPath,
            });
          } catch (err) {
            reject(err);
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Deletes an old image from Firebase Storage if it exists.
 */
export const deleteOldImageIfNeeded = async (storagePath: string | undefined): Promise<void> => {
  if (!storagePath) return;
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn(`Silently failed to delete old image at ${storagePath}`, error);
    // Ignore errors (e.g., file not found won't crash the form update)
  }
};
