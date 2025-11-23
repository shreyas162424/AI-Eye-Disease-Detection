export interface ScanRecord {
  id: string;
  timestamp: string;
  imageDataUrl: string;
  prediction: string;
  probability: number;
  gradcamDataUrl?: string;
  maskDataUrl?: string;
  notes?: string;
}

const BASE_KEY = 'clarity_scan_history';

// Helper to get the key for a specific user
const getUserKey = (userId: string) => `${BASE_KEY}_${userId}`;

export const getScans = (userId: string): ScanRecord[] => {
  if (!userId) return [];
  try {
    const data = localStorage.getItem(getUserKey(userId));
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading scans", error);
    return [];
  }
};

export const saveScan = (userId: string, scan: ScanRecord) => {
  if (!userId) return;
  try {
    const scans = getScans(userId);
    const updatedScans = [scan, ...scans].slice(0, 50); // Keep last 50
    localStorage.setItem(getUserKey(userId), JSON.stringify(updatedScans));
  } catch (error) {
    console.error("Error saving scan", error);
  }
};

export const clearScans = (userId: string) => {
  if (!userId) return;
  localStorage.removeItem(getUserKey(userId));
};
