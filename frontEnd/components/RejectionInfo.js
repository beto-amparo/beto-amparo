// components/RejectionInfo.js

import { useState } from 'react';

export default function RejectionInfo() {
    return (
        <div className="flex items-center justify-center p-6 w-full bg-red-50 border-l-4 border-red-500 rounded-lg">
            {/* Ícone de "X" grande para simbolizar o cancelamento */}
            <svg 
                className="w-16 h-16 text-red-600" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </div>
    );
}