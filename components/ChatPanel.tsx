import React, { useState, useRef, useEffect } from 'react';
import { ChatMode, ChatMessage, GroundingSource } from '../types';
import { generateChatResponse, playAudio } from '../services/geminiService';
import Message from './Message';
import { SendIcon, BotIcon, SearchIcon, MapPinIcon, BrainCircuitIcon, Volume2Icon, PlusIcon } from './Icon';
import LoadingSpinner from './LoadingSpinner';
import { useGeolocation } from '../hooks/useGeolocation';

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<ChatMode>(ChatMode.Standard);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const { location, error: geoError, loading: geoLoading } = useGeolocation();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleModeChange = (mode: ChatMode) => {
    setActiveMode(mode);
    setError(null);
    if (mode === ChatMode.LocalSearch && geoError) {
        setError(`Location Error: ${geoError}. Please enable location services.`);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    if (activeMode === ChatMode.LocalSearch && !location) {
        setError("Could not get your location for local search. Please ensure location services are enabled.");
        setIsLoading(false);
        return;
    }

    try {
      const response = await generateChatResponse(input, activeMode, location ?? undefined);
      const aiText = response.text;
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      let sources: GroundingSource[] | undefined = undefined;

      if (groundingChunks) {
        sources = groundingChunks.map((chunk: any) => {
          if(chunk.web) {
            return { uri: chunk.web.uri, title: chunk.web.title, type: 'web' };
          }
          if(chunk.maps) {
             return { uri: chunk.maps.uri, title: chunk.maps.title, type: 'maps' };
          }
          return null;
        }).filter((source: GroundingSource | null): source is GroundingSource => source !== null);
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: 'ai',
        sources: sources,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get response from AI: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = async (message: ChatMessage) => {
      if (playingAudioId === message.id) return;
      setPlayingAudioId(message.id);
      try {
          // This would ideally be a streaming call in a real app
          // Fix: Remove `(window as any)` cast and rely on global types.
          const base64Audio = await window.gemini.generateSpeech(message.text);
          await playAudio(base64Audio);
      } catch (err) {
          console.error("Failed to play audio:", err);
          setError("Sorry, couldn't play the audio for that message.");
      } finally {
          setPlayingAudioId(null);
      }
  };
  
  useEffect(() => {
    // This is a workaround to make the function available on the window object
    // for the handlePlayAudio function. In a real application with a module system,
    // you would import it directly.
    // Fix: Remove `(window as any)` cast and rely on global types.
    window.gemini = {
        generateSpeech: async (text: string) => {
            const { generateSpeech } = await import('../services/geminiService');
            return generateSpeech(text);
        }
    }
  }, []);

  const ModeButton: React.FC<{mode: ChatMode, label: string, icon: React.ReactNode}> = ({mode, label, icon}) => (
      <button onClick={() => handleModeChange(mode)} className={`flex items-center px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${activeMode === mode ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
          {icon}
          <span className="ml-2">{label}</span>
      </button>
  );

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-xl shadow-2xl">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center flex-wrap gap-2">
               <ModeButton mode={ChatMode.Standard} label="Standard" icon={<BotIcon className="w-5 h-5"/>}/>
               <ModeButton mode={ChatMode.WebSearch} label="Web Search" icon={<SearchIcon className="w-5 h-5"/>}/>
               <ModeButton mode={ChatMode.LocalSearch} label="Local Search" icon={<MapPinIcon className="w-5 h-5"/>}/>
               <ModeButton mode={ChatMode.DeepThought} label="Deep Thought" icon={<BrainCircuitIcon className="w-5 h-5"/>}/>
            </div>
            <button
                onClick={handleNewChat}
                className="flex-shrink-0 flex items-center px-3 py-2 text-sm font-medium rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-200"
                title="Start a new chat session"
            >
                <PlusIcon className="w-5 h-5"/>
                <span className="ml-2 hidden sm:inline">New Chat</span>
            </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <Message key={msg.id} message={msg}>
              {msg.sender === 'ai' && (
                <button
                  onClick={() => handlePlayAudio(msg)}
                  disabled={playingAudioId === msg.id}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-wait"
                  aria-label="Play audio for this message"
                >
                  {playingAudioId === msg.id ? <LoadingSpinner size="w-4 h-4" /> : <Volume2Icon className="w-4 h-4"/>}
                </button>
              )}
            </Message>
          ))}
          {isLoading && (
            <div className="flex justify-start">
                <div className="flex items-center space-x-2 bg-gray-700 px-4 py-2 rounded-lg">
                    <LoadingSpinner />
                    <span className="text-gray-300 animate-pulse">AI is thinking...</span>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
        {error && <div className="p-4 text-red-400 bg-red-900/50 border-t border-red-700 text-sm">{error}</div>}

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center bg-gray-700 rounded-lg p-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask MindLink anything..."
            className="flex-1 bg-transparent px-4 py-2 text-white placeholder-gray-400 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-full bg-indigo-600 text-white disabled:bg-indigo-900 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors duration-200"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;