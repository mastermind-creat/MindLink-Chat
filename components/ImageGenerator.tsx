
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { SparklesIcon } from './Icon';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const url = await generateImage(prompt, aspectRatio);
      setImageUrl(url);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate image: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const AspectRatioButton: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <button
      onClick={() => setAspectRatio(value)}
      className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
        aspectRatio === value ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-800 rounded-xl shadow-2xl">
      <h3 className="text-2xl font-bold text-white mb-4">Image Studio</h3>
      <p className="text-gray-400 mb-6">Describe the image you want to create. Be as detailed as you like.</p>

      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A majestic lion wearing a crown, cinematic lighting, hyperrealistic"
          className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={3}
        />
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-400">Aspect Ratio:</span>
            <AspectRatioButton value="1:1" label="Square" />
            <AspectRatioButton value="16:9" label="Landscape" />
            <AspectRatioButton value="9:16" label="Portrait" />
            <AspectRatioButton value="4:3" label="4:3" />
            <AspectRatioButton value="3:4" label="3:4" />
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-wait transition-colors duration-200"
        >
          {isLoading ? (
              <>
                <LoadingSpinner />
                <span className="ml-2">Generating...</span>
              </>
          ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                <span>Generate Image</span>
              </>
          )}
        </button>
      </div>

      {error && <div className="mt-4 p-3 text-red-400 bg-red-900/50 rounded-lg text-sm">{error}</div>}

      {imageUrl && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Result:</h4>
          <div className="bg-gray-900 p-2 rounded-lg">
            <img src={imageUrl} alt="Generated" className="w-full h-auto rounded-md" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
