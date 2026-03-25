import { StoredObject } from './alarmSettings';

const STORAGE_KEY = 'stored_objects';

export const getStoredObjects = (): StoredObject[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveStoredObjects = (objects: StoredObject[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(objects));
};

export const addStoredObject = (label: string, imageBase64: string): StoredObject => {
  const objects = getStoredObjects();
  const newObj: StoredObject = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    label,
    imageBase64,
    createdAt: Date.now(),
  };
  if (objects.length >= 10) {
    throw new Error('Maximum 10 objects allowed');
  }
  objects.push(newObj);
  saveStoredObjects(objects);
  return newObj;
};

export const removeStoredObject = (id: string) => {
  const objects = getStoredObjects().filter(o => o.id !== id);
  saveStoredObjects(objects);
};

export const captureImageFromVideo = (video: HTMLVideoElement, maxWidth = 320): string => {
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, maxWidth / video.videoWidth);
  canvas.width = video.videoWidth * scale;
  canvas.height = video.videoHeight * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.7);
};
