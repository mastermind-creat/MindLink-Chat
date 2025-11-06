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

// The AIStudio interface has been inlined in the global Window declaration below
// to resolve "conflicting global type declarations" errors.

// Fix: Centralize global window type declarations to resolve conflicts.
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    // Fix: Inlined the AIStudio type to resolve declaration conflicts.
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
    gemini: {
        generateSpeech: (text: string) => Promise<string>;
    };
  }
}
