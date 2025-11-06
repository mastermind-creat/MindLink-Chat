import React, { useState, useEffect, useRef } from 'react';
import { SendIcon, UserIcon, LinkIcon, UsersIcon } from './Icon';

interface P2PMessage {
  id: string;
  text: string;
  senderId: string;
}

const PeerMessageDisplay: React.FC<{ message: P2PMessage; isMe: boolean }> = ({ message, isMe }) => {
  return (
    <div className={`flex items-start gap-3 ${isMe ? 'justify-end' : ''}`}>
      {!isMe && (
        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-600 flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
      )}
      <div className={`max-w-md md:max-w-lg`}>
        <div
          className={`px-4 py-3 rounded-xl ${
            isMe ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
      {isMe && (
        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-indigo-600 flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};


const PeerChatPanel: React.FC = () => {
  const [chatId, setChatId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [messages, setMessages] = useState<P2PMessage[]>([]);
  const [input, setInput] = useState('');
  const [joinLink, setJoinLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect to initialize user ID and check URL for a chatId
  useEffect(() => {
    let sessionUserId = sessionStorage.getItem('mindlink-userId');
    if (!sessionUserId) {
      sessionUserId = crypto.randomUUID();
      sessionStorage.setItem('mindlink-userId', sessionUserId);
    }
    setUserId(sessionUserId);

    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('chatId');
    if (idFromUrl) {
      setChatId(idFromUrl);
    }
  }, []);

  // Effect to manage BroadcastChannel connection
  useEffect(() => {
    if (!chatId || !userId) return;

    const channel = new BroadcastChannel(chatId);
    channel.onmessage = (event: MessageEvent<P2PMessage>) => {
      const newMessage = event.data;
      if (newMessage.senderId !== userId) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };
    channelRef.current = channel;

    const url = new URL(window.location.href);
    if (url.searchParams.get('chatId') !== chatId) {
        url.searchParams.set('chatId', chatId);
        window.history.pushState({ path: url.href }, '', url.href);
    }

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [chatId, userId]);
  
  const handleCreateChat = () => {
    const newChatId = crypto.randomUUID();
    setChatId(newChatId);
    setError(null);
  };

  const handleJoinChat = () => {
    setError(null);
    try {
        if (!joinLink.trim()) {
            throw new Error("Link cannot be empty.");
        }
        const url = new URL(joinLink);
        const idFromLink = url.searchParams.get('chatId');
        if (!idFromLink) {
            throw new Error("The provided link is not a valid MindLink chat invite.");
        }
        setChatId(idFromLink);
    } catch(err) {
        // Fallback for just pasting the ID
        const potentialId = joinLink.split('?chatId=')[1] || joinLink;
        if (potentialId.length > 10) { // Simple validation
            setChatId(potentialId);
        } else {
            setError(err instanceof Error ? err.message : "Invalid link or ID provided.");
        }
    }
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;
    const message: P2PMessage = {
      id: crypto.randomUUID(),
      text: input,
      senderId: userId,
    };
    setMessages((prev) => [...prev, message]);
    channelRef.current?.postMessage(message);
    setInput('');
  };
  
  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?chatId=${chatId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!chatId) {
    return (
      <div className="max-w-md mx-auto text-center bg-gray-800 p-8 rounded-lg shadow-2xl">
        <UsersIcon className="w-16 h-16 mx-auto text-indigo-400 mb-4" />
        <h3 className="text-2xl font-bold mb-2">MindLink Chat</h3>
        <p className="text-gray-400 mb-6">Connect with others directly. Create a secure session and share the link to start chatting.</p>
        <button onClick={handleCreateChat} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 transition-colors duration-200">
            Create MindLink Session
        </button>
        <div className="my-6 flex items-center">
            <hr className="flex-grow border-gray-600" />
            <span className="mx-4 text-gray-500">OR</span>
            <hr className="flex-grow border-gray-600" />
        </div>
        <div className="space-y-2">
            <input 
                type="text" 
                value={joinLink}
                onChange={(e) => setJoinLink(e.target.value)}
                placeholder="Paste invite link or ID here..."
                className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={handleJoinChat} className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-500 transition-colors duration-200">
                Join Session
            </button>
        </div>
        {error && <p className="mt-4 text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-xl shadow-2xl">
       <div className="p-4 border-b border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="text-sm text-gray-400">
            <span className="font-bold text-gray-200">Invite Link:</span>
            <p className="truncate text-indigo-300">{`${window.location.origin}${window.location.pathname}?chatId=${chatId}`}</p>
        </div>
        <button onClick={copyInviteLink} className="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-200">
            <LinkIcon className="w-4 h-4 mr-2 inline" />
            {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <PeerMessageDisplay key={msg.id} message={msg} isMe={msg.senderId === userId} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center bg-gray-700 rounded-lg p-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-transparent px-4 py-2 text-white placeholder-gray-400 focus:outline-none"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim()}
            className="p-2 rounded-full bg-indigo-600 text-white disabled:bg-indigo-900 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors duration-200"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PeerChatPanel;
