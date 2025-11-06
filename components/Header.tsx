
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
      <h2 className="text-xl font-semibold text-gray-200">AI Assistant</h2>
      {/* Additional header content can go here */}
    </header>
  );
};

export default Header;
