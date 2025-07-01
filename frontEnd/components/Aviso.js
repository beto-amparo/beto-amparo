// components/Aviso.jsx
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion'; // Para animações mais fluidas

export default function Aviso({ message, type, onClose }) {
    const [isVisible, setIsVisible] = useState(true);

    // Define classes de estilo com base no tipo de aviso
    const baseClasses = "fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white flex items-center justify-between z-50 max-w-sm w-full";
    const typeClasses = {
        success: "bg-green-600",
        error: "bg-red-600",
        info: "bg-blue-600",
        warning: "bg-yellow-600 text-gray-900" // Aviso pode ter texto escuro
    };
    const iconClasses = {
        success: "✅",
        error: "❌",
        info: "ℹ️",
        warning: "⚠️"
    };

    useEffect(() => {
        // O aviso desaparece automaticamente após 5 segundos
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onClose) {
                onClose(); // Chama a função onClose (se fornecida) após o aviso desaparecer
            }
        }, 5000);

        return () => clearTimeout(timer); // Limpa o timer se o componente for desmontado
    }, [onClose]);

    // Animações de entrada/saída usando Framer Motion
    const variants = {
        hidden: { opacity: 0, y: 50, scale: 0.8 },
        visible: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 50, scale: 0.8, transition: { duration: 0.2 } }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className={`${baseClasses} ${typeClasses[type] || typeClasses.info}`}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={variants}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{iconClasses[type] || iconClasses.info}</span>
                        <p className="font-medium text-sm">{message}</p>
                    </div>
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            if (onClose) onClose();
                        }}
                        className="ml-4 text-white hover:opacity-80 transition-opacity text-xl font-bold leading-none cursor-pointer"
                    >
                        &times;
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}