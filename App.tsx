
import React, { useState } from 'react';
import { BrainCircuitIcon, ImageIcon, VideoIcon, MessageSquareIcon, UsersIcon } from './components/Icon';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import ImageGenerator from './components/ImageGenerator';
import VideoGenerator from './components/VideoGenerator';
import PeerChatPanel from './components/PeerChatPanel';

type Feature = 'chat' | 'image' | 'video' | 'p2p-chat';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('chat');

  const renderFeature = () => {
    switch (activeFeature) {
      case 'chat':
        return <ChatPanel />;
      case 'image':
        return <ImageGenerator />;
      case 'video':
        return <VideoGenerator />;
      case 'p2p-chat':
        return <PeerChatPanel />;
      default:
        return <ChatPanel />;
    }
  };

  const NavItem: React.FC<{
    feature: Feature;
    icon: React.ReactNode;
    label: string;
  }> = ({ feature, icon, label }) => (
    <button
      onClick={() => setActiveFeature(feature)}
      className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ${
        activeFeature === feature
          ? 'bg-indigo-600 text-white shadow-lg'
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <aside className="w-64 bg-gray-800 p-4 flex flex-col space-y-4 border-r border-gray-700">
        <div className="flex items-center space-x-2 p-2">
            <BrainCircuitIcon className="w-8 h-8 text-indigo-400"/>
            <h1 className="text-2xl font-bold text-white">MindLink</h1>
        </div>
        <nav className="flex flex-col space-y-2 mt-4">
          <NavItem feature="chat" icon={<MessageSquareIcon className="w-6 h-6"/>} label="AI Chat" />
          <NavItem feature="p2p-chat" icon={<UsersIcon className="w-6 h-6"/>} label="MindLink Chat" />
          <NavItem feature="image" icon={<ImageIcon className="w-6 h-6"/>} label="Image Studio" />
          <NavItem feature="video" icon={<VideoIcon className="w-6 h-6"/>} label="Video Lab" />
        </nav>
      </aside>
      <main className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderFeature()}
        </div>
      </main>
    </div>
  );
};

export default App;
