// components/ConfirmCancelModal.js
import React from 'react';

export default function ConfirmCancelModal({ onConfirm, onCancel, message }) {
    return (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
                <p className="text-lg font-semibold mb-6 text-gray-800">{message}</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                        Não, obrigado
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 bg-red-600 text-white hover:bg-red-700"
                    >
                        Sim, cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}