import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateVideo, pollVideoOperation } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { FilmIcon } from './Icon';
// Fix: Removed import of VideosOperation as it is not exported from @google/genai.
// The type is now handled via the service and a custom interface in types.ts.


type LoadingState = 'idle' | 'generating' | 'polling' | 'done' | 'error';
const loadingMessages: Record<LoadingState, string> = {
    idle: '',
    generating: 'Initializing video generation...',
    polling: 'Creating your video. This can take a few minutes...',
    done: 'Video generation complete!',
    error: 'An error occurred.'
};

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  const pollIntervalRef = useRef<number | null>(null);

  const checkApiKey = useCallback(async () => {
    if (typeof window.aistudio?.hasSelectedApiKey === 'function') {
        const keyStatus = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(keyStatus);
        return keyStatus;
    }
    setHasApiKey(true); // Assume key exists if check function is not present
    return true;
  }, []);

  useEffect(() => {
    checkApiKey();
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
      await window.aistudio.openSelectKey();
      // Assume success and optimistically update UI
      setHasApiKey(true);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    
    // Fix: Per guidelines, a new GoogleGenAI instance should be created before an API call
    // This is handled in the geminiService functions. We also check for API key before generating.
    const keyPresent = await checkApiKey();
    if (!keyPresent) {
        setError('API Key not selected. Please select a key to generate videos.');
        return;
    }

    setLoadingState('generating');
    setError(null);
    setVideoUrl(null);

    try {
      let operation = await generateVideo(prompt, aspectRatio);
      setLoadingState('polling');

      const poll = async () => {
        try {
            operation = await pollVideoOperation(operation);
            if (operation.done) {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
                if (downloadLink) {
                    const apiKey = process.env.API_KEY;
                    setVideoUrl(`${downloadLink}&key=${apiKey}`);
                    setLoadingState('done');
                } else {
                    throw new Error("Video generation finished but no video URI was found.");
                }
            }
        } catch (pollErr: any) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            console.error("Polling error:", pollErr);
            setError(`Error checking video status: ${pollErr.message || 'Unknown polling error'}`);
            if (pollErr.message?.includes('Requested entity was not found')) {
                setHasApiKey(false); // Reset key status
            }
            setLoadingState('error');
        }
      };
      
      pollIntervalRef.current = window.setInterval(poll, 10000);
      poll();

    } catch (err: any) {
      console.error(err);
      setError(`Failed to start video generation: ${err.message || 'An unknown error occurred.'}`);
      if (err.message?.includes('Requested entity was not found')) {
          setHasApiKey(false); // Reset key status on initial call failure
      }
      setLoadingState('error');
    }
  };

  if (hasApiKey === null) {
      return <div className="flex items-center justify-center h-full"><LoadingSpinner /> <span className="ml-2">Checking API key status...</span></div>;
  }
  
  if (!hasApiKey) {
    return (
        <div className="max-w-md mx-auto text-center bg-gray-800 p-8 rounded-lg">
            <h3 className="text-xl font-bold mb-4">API Key Required</h3>
            <p className="text-gray-400 mb-6">Video generation with Veo requires you to select an API key. This helps manage resources for this intensive feature.</p>
            <p className="text-xs text-gray-500 mb-6">For information on billing, please see <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">ai.google.dev/gemini-api/docs/billing</a>.</p>
            <button onClick={handleSelectKey} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors">
                Select Your API Key
            </button>
        </div>
    );
  }

  const isLoading = loadingState === 'generating' || loadingState === 'polling';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-800 rounded-xl shadow-2xl">
      <h3 className="text-2xl font-bold text-white mb-4">Video Lab</h3>
      <p className="text-gray-400 mb-6">Bring your ideas to life. Describe the video you want to create.</p>

      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A neon hologram of a cat driving a futuristic car at top speed"
          className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={3}
        />
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-400">Aspect Ratio:</span>
            <button onClick={() => setAspectRatio('16:9')} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${aspectRatio === '16:9' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Landscape (16:9)</button>
            <button onClick={() => setAspectRatio('9:16')} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${aspectRatio === '9:16' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Portrait (9:16)</button>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-wait transition-colors"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              <span className="ml-2">Generating...</span>
            </>
          ) : (
            <>
              <FilmIcon className="w-5 h-5 mr-2" />
              <span>Generate Video</span>
            </>
          )}
        </button>
      </div>

      {error && <div className="mt-4 p-3 text-red-400 bg-red-900/50 rounded-lg text-sm">{error}</div>}

      {isLoading && (
          <div className="mt-6 text-center text-indigo-300">
              <p>{loadingMessages[loadingState]}</p>
          </div>
      )}

      {videoUrl && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Result:</h4>
          <div className="bg-gray-900 p-2 rounded-lg">
            <video src={videoUrl} controls autoPlay loop className="w-full h-auto rounded-md" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
