import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase';

const clean = (value: string) =>
  value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'asset';

export const assetStorageService = {
  async uploadFile(input: {
    userId: string;
    file: File | Blob;
    filename: string;
    folder?: 'masters' | 'videos' | 'artwork' | 'stems' | 'documents';
    onProgress?: (percent: number) => void;
  }): Promise<{ path: string; url: string }> {
    const folder = input.folder || 'masters';
    const id = crypto.randomUUID();
    const path = `users/${input.userId}/${folder}/${id}-${clean(input.filename)}`;
    const storageRef = ref(storage, path);

    return await new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, input.file, {
        contentType: input.file.type || 'application/octet-stream',
        customMetadata: { ownerUid: input.userId }
      });

      task.on(
        'state_changed',
        snapshot => {
          const total = snapshot.totalBytes || 1;
          input.onProgress?.(Math.round((snapshot.bytesTransferred / total) * 100));
        },
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({ path, url });
        }
      );
    });
  }
};
