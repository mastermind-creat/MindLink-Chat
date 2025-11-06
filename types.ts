export enum ChatMode {
  Standard = 'standard',
  WebSearch = 'web_search',
  LocalSearch = 'local_search',
  DeepThought = 'deep_thought',
}

export interface GroundingSource {
  uri: string;
  title: string;
  type: 'web' | 'maps';
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  sources?: GroundingSource[];
}

// Fix: Define VideosOperation interface as it is not exported from the SDK.
export interface VideosOperation {
  // Fix: Made the 'done' property optional to match the SDK's type, resolving assignment errors.
  done?: boolean;
  response?: {
    generatedVideos?: {
      video?: {
        uri?: string;
      };
    }[];
  };
}

// Fix: Centralize global window type declarations to resolve conflicts.
declare global {
  // Fix: Moved AIStudio interface to the global scope to resolve declaration conflicts.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    webkitAudioContext: typeof AudioContext;
    // Fix: Made 'aistudio' optional to resolve a declaration conflict where modifiers did not match.
    aistudio?: AIStudio;
  }
}
