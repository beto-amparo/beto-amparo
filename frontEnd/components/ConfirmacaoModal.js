// components/ConfirmacaoModal.jsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ConfirmacaoModal({ message, onConfirm, onCancel, title = "Confirmar Ação" }) {
    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-auto"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{title}</h2>
                    <p className="text-gray-700 mb-6">{message}</p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer"
                        >
                            Confirmar
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}