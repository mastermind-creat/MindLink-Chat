import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { ChatMode, VideosOperation } from '../types';

const getApiKey = (): string => {
    // Fix: Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key from the dialog.
    // The key is available via process.env.API_KEY. It is injected automatically.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return apiKey;
};

export const generateChatResponse = async (
    prompt: string, 
    mode: ChatMode,
    location?: {latitude: number, longitude: number}
): Promise<GenerateContentResponse> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    let model = 'gemini-2.5-flash';
    let config: any = {};

    switch(mode) {
        case ChatMode.WebSearch:
            config.tools = [{googleSearch: {}}];
            break;
        case ChatMode.LocalSearch:
            config.tools = [{googleMaps: {}}];
            if(location) {
                config.toolConfig = {
                    retrievalConfig: {
                        latLng: {
                            latitude: location.latitude,
                            longitude: location.longitude,
                        }
                    }
                }
            }
            break;
        case ChatMode.DeepThought:
            model = 'gemini-2.5-pro';
            config.thinkingConfig = { thinkingBudget: 32768 };
            break;
        case ChatMode.Standard:
        default:
            // No special config needed
            break;
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: config
    });
    
    return response;
};

export const generateImage = async (prompt: string, aspectRatio: string = '1:1') => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16'): Promise<VideosOperation> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    });
    return operation;
};

export const pollVideoOperation = async (operation: VideosOperation): Promise<VideosOperation> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    // Fix: Cast operation to 'any' to satisfy the SDK's expected internal type,
    // which is not exported for direct use.
    return await ai.operations.getVideosOperation({ operation: operation as any });
};

export const generateSpeech = async (text: string): Promise<string> => {
    const ai = new GoogleGenAI({apiKey: getApiKey()});
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        // Fix: Use Modality.AUDIO enum as per guidelines.
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data received from API.");
    }
    return base64Audio;
};

// Audio Decoding utilities
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playAudio = async (base64Audio: string) => {
    const outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    const decodedBytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(decodedBytes, outputAudioContext, 24000, 1);
    
    const source = outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputAudioContext.destination);
    source.start();
};
