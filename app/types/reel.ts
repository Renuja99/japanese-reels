export interface Reel {
  id: number;
  text: string;
  translation: string;
  audio: string | null;
}

export interface UploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
  details?: string;
}

export interface AudioFile {
  filename: string;
  url: string;
  reelId: string;
  timestamp: number;
  size: number;
}

export interface GetAudioResponse {
  success: boolean;
  files?: AudioFile[];
  error?: string;
}