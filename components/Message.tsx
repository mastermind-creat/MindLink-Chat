
import React from 'react';
import { ChatMessage } from '../types';
import { BotIcon, UserIcon, LinkIcon } from './Icon';

interface MessageProps {
  message: ChatMessage;
  children?: React.ReactNode;
}

const Message: React.FC<MessageProps> = ({ message, children }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-indigo-600 flex items-center justify-center">
          <BotIcon className="w-5 h-5 text-white" />
        </div>
      )}
      <div className={`max-w-lg md:max-w-xl lg:max-w-2xl ${isUser ? 'order-1' : 'order-2'}`}>
        <div
          className={`px-4 py-3 rounded-xl ${
            isUser ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>
          {children && <div className="mt-2 flex justify-end">{children}</div>}
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 px-2 text-xs text-gray-400 space-y-1">
            <p className="font-semibold">Sources:</p>
            {message.sources.map((source, index) => (
              <a
                key={index}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-indigo-400 hover:underline"
              >
                <LinkIcon className="w-3 h-3 flex-shrink-0"/>
                <span className="truncate">{source.title || source.uri}</span>
              </a>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-600 flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default Message;
