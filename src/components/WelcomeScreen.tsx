import React from 'react';

export default function WelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="bg-blue-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
        <svg 
          className="w-8 h-8 text-blue-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
      </div>
      
      <h1 className="text-xl font-semibold text-gray-900 mb-2 text-center">
        Start a conversation to generate React components
      </h1>
      
      <p className="text-gray-500 text-center max-w-md">
        I can help you create buttons, forms, cards, and more
      </p>
    </div>
  );
}