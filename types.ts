
export enum SystemPhase {
  ONBOARDING = 'ONBOARDING',
  READY = 'READY',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED'
}

export interface SocialConnections {
  instagram: boolean;
  youtube: boolean;
  x: boolean;
  linkedin: boolean;
  tiktok: boolean;
}

export interface BrandInputs {
  primaryNiche: string;
  subNiches: string[];
  targetAudience: string;
  tone: string;
}

export interface ContentConstraints {
  topicsToAvoid: string[];
  wordsToAvoid: string[];
  priorityPlatforms: string[];
  frequency: string;
}

export interface TrainingData {
  videos: string[]; // Base64
  images: string[]; // Base64
  voiceSample?: string; // Base64
}

export interface UserConfig {
  connections: SocialConnections;
  brand: BrandInputs;
  training: TrainingData;
  constraints: ContentConstraints;
}

export interface ContentSet {
  id: string;
  topic: string;
  postText: string;
  carousel: string[];
  reelScript: {
    scenes: { instruction: string; text: string }[];
    narration: string;
  };
  storyFrames: string[];
  caption: string;
  hashtags: string[];
  score: number;
}

export interface SystemLogEntry {
  timestamp: number;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface DailyAsset {
  date: string;
  selectedContent: ContentSet;
  insights: string;
}
