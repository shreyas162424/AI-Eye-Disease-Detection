// src/lib/scanStorage.ts  (replace existing file)
export type ScanRecord = {
    id: string;
    timestamp: string;
    imageDataUrl?: string; // full image (avoid storing large ones if possible)
    thumbDataUrl?: string; // small thumbnail (preferred)
    prediction: string;
    probability: number;
    gradcamDataUrl?: string;
    notes?: string;
  };
  
  const KEY = "eye_analyzer_scans_v1";
  const MAX_RECORDS = 50; // keep recent 50 scans
  const TRIM_ON_QUOTA = 10; // remove 10 oldest when quota hit
  
  export function loadScans(): ScanRecord[] {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as ScanRecord[]) : [];
    } catch {
      return [];
    }
  }
  
  function writeScans(scans: ScanRecord[]) {
    localStorage.setItem(KEY, JSON.stringify(scans.slice(0, MAX_RECORDS)));
  }
  
  export function saveScan(record: ScanRecord) {
    const scans = loadScans();
    scans.unshift(record); // newest first
  
    try {
      writeScans(scans);
      return true;
    } catch (err: any) {
      // quota exceeded: attempt trimming older entries and try again
      console.warn("localStorage write failed, attempting to trim:", err?.message || err);
      try {
        const trimmed = scans.slice(0, MAX_RECORDS - TRIM_ON_QUOTA);
        // If images are present, try to drop full images and keep only thumbnails to save space
        const light = trimmed.map(s => ({
          ...s,
          imageDataUrl: undefined, // drop heavy image
        }));
        localStorage.setItem(KEY, JSON.stringify(light));
        return true;
      } catch (err2) {
        console.error("Failed to save scans after trimming:", err2);
        // as a last resort, clear storage key to avoid repeated exceptions
        try { localStorage.removeItem(KEY); } catch {}
        return false;
      }
    }
  }
  
  export function clearScans() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }
  