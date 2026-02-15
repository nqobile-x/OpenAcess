export interface UserProfile {
  mobility: {
    wheelchair: boolean;
    walker: boolean;
    cane: boolean;
    noStairs: boolean;
  };
  sensory: {
    lowNoise: boolean;
    lowLight: boolean;
    scentFree: boolean;
  };
  visual: {
    braille: boolean;
    screenReader: boolean;
  };
  other: {
    serviceAnimal: boolean;
    accessibleRestroom: boolean;
    accessibleParking: boolean;
  };
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  groundingUrls?: Array<{uri: string, title: string}>;
}

export interface Venue {
  name: string;
  address?: string;
  rating?: number;
  user_ratings_total?: number;
  accessibility_score?: number; // Calculated mock score
  photos?: string[];
  place_id?: string;
  types?: string[];
  groundingUri?: string;
}

export interface MapGroundingChunk {
  maps?: {
    uri?: string;
    title?: string;
    placeAnswerSources?: {
        reviewSnippets?: {
            reviewText?: string;
            author?: string;
        }[]
    }
  }
}

export interface SearchGroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  }
}

export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
export type ImageSize = "1K" | "2K" | "4K";
