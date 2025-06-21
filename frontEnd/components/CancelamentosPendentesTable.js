// components/CancelamentosPendentesTable.js

import { useState } from 'react';

// Função para formatar a data
const formatarData = (dataISO) => {
    if (!dataISO) return 'Data indisponível';
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function CancelamentosPendentesTable({ requests, onActionComplete }) { 
    const [loadingAction, setLoadingAction] = useState(null);
    const [rejectionData, setRejectionData] = useState({ isOpen: false, requestId: null, reason: '' });

    const handleOpenRejectionModal = (requestId) => {
        setRejectionData({ isOpen: true, requestId: requestId, reason: '' });
    };

    const handleCloseRejectionModal = () => {
        setRejectionData({ isOpen: false, requestId: null, reason: '' });
    };

    const handleUpdateStatus = async (requestId, newStatus, motivoRejeicao = null) => {
        if (newStatus === 'aprovado' && !confirm('Tem certeza que deseja APROVAR esta solicitação?')) {
            return;
        }

        setLoadingAction(requestId);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/order-cancellations/${requestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    status: newStatus, 
                    motivo_rejeicao: motivoRejeicao
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao atualizar status.');
            }

            alert(`Solicitação ${newStatus === 'aprovado' ? 'aprovada' : 'rejeitada'} com sucesso!`);
            handleCloseRejectionModal();
            onActionComplete(prev => prev + 1);

        } catch (error) {
            console.error("Erro ao atualizar status da solicitação:", error);
            alert(`Erro: ${error.message}`);
        } finally {
            setLoadingAction(null);
        }
    };

    if (!requests || requests.length === 0) {
        return <p className="text-gray-500">Nenhuma solicitação de cancelamento pendente.</p>;
    }

    return (
        <>
            {/* Tabela de solicitações */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID do Pedido</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data da Solicitação</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo do Cliente</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {requests.map((req) => (
                            <tr key={req.id}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{req.pedidos.id}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{formatarData(req.created_at)}</td>
                                <td className="px-4 py-2 text-sm text-gray-600 min-w-[200px]">{req.motivo}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                    <button 
                                        onClick={() => handleUpdateStatus(req.id, 'aprovado')} 
                                        disabled={loadingAction === req.id}
                                        className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 disabled:bg-gray-400 mr-2"
                                    >
                                        Aprovar
                                    </button>
                                    <button 
                                        onClick={() => handleOpenRejectionModal(req.id)} 
                                        disabled={loadingAction === req.id}
                                        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 disabled:bg-gray-400"
                                    >
                                        Rejeitar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Rejeição */}
            {rejectionData.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Motivo da Rejeição</h3>
                        <p className="text-sm text-gray-600 mb-3">Por favor, informe ao cliente por que o cancelamento não pode ser processado.</p>
                        <textarea
                            className="w-full p-2 border rounded-md text-base resize-none text-gray-700"
                            rows="4"
                            placeholder="Ex: Seu pedido já saiu para entrega."
                            value={rejectionData.reason}
                            onChange={(e) => setRejectionData({ ...rejectionData, reason: e.target.value })}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={handleCloseRejectionModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">Cancelar</button>
                            <button 
                                onClick={() => handleUpdateStatus(rejectionData.requestId, 'rejeitado', rejectionData.reason)}
                                disabled={!rejectionData.reason.trim() || loadingAction === rejectionData.requestId}
                                className="bg-red-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
                            >
                                {loadingAction === rejectionData.requestId ? 'Enviando...' : 'Confirmar Rejeição'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}