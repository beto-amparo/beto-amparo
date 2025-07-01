// components/ContatoModal.js

import { useState, useEffect } from 'react';

export default function ContatoModal({ isOpen, onClose, onSubmit }) {
    const [motivo, setMotivo] = useState('Pedido');
    const [numeroPedido, setNumeroPedido] = useState('');

    // Reseta o número do pedido se o motivo mudar
    useEffect(() => {
        if (motivo !== 'Pedido') {
            setNumeroPedido('');
        }
    }, [motivo]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = () => {
        // Validação simples para garantir que o número do pedido seja preenchido se necessário
        if (motivo === 'Pedido' && !numeroPedido.trim()) {
            alert('Por favor, informe o número do pedido.');
            return;
        }
        onSubmit(motivo, numeroPedido);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Como podemos ajudar?</h2>
                
                {/* Campo de Seleção do Motivo */}
                <div className="mb-4">
                    <label htmlFor="motivo-contato" className="block text-sm font-medium text-gray-700 mb-1">
                        Selecione o motivo do contato:
                    </label>
                    <select
                        id="motivo-contato"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="Pedido">Ajuda com um Pedido</option>
                        <option value="Produto">Dúvida sobre um Produto</option>
                        <option value="Entrega">Problema com a Entrega</option>
                        <option value="Pagamento">Questões sobre Pagamento</option>
                        <option value="Outro">Outro Assunto</option>
                    </select>
                </div>

                {/* Campo do Número do Pedido (Condicional) */}
                {motivo === 'Pedido' && (
                    <div className="mb-6">
                        <label htmlFor="numero-pedido" className="block text-sm font-medium text-gray-700 mb-1">
                            Informe o número do pedido:
                        </label>
                        <input
                            type="text"
                            id="numero-pedido"
                            value={numeroPedido}
                            onChange={(e) => setNumeroPedido(e.target.value)}
                            placeholder="#0000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                )}

                {/* Botões de Ação */}
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none"
                    >
                        Iniciar Conversa
                    </button>
                </div>
            </div>
        </div>
    );
}