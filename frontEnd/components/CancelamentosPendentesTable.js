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

    const handleUpdateStatus = async (requestId, newStatus) => {
        if (!confirm(`Tem certeza que deseja "${newStatus === 'aprovado' ? 'APROVAR' : 'REJEITAR'}" esta solicitação?`)) {
            return;
        }
        setLoadingAction(requestId);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/order-cancellations/${requestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao atualizar status.');
            }

            alert(`Solicitação ${newStatus === 'aprovado' ? 'aprovada' : 'rejeitada'} com sucesso!`);

            onActionComplete(prev => prev + 1); 

        } catch (error) {
            console.error("Erro ao atualizar status da solicitação:", error);
            alert(`Erro: ${error.message}`);
        } finally {
            setLoadingAction(null);
        }
    };

    // PARTE VISUAL (JSX) QUE ESTAVA FALTANDO:
    if (!requests || requests.length === 0) {
        return <p className="text-gray-500">Nenhuma solicitação de cancelamento pendente.</p>;
    }

    return (
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
                            {/* AJUSTE FINAL: Lendo o ID do pedido de dentro do objeto aninhado */}
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{req.order_id}</td>
                            
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{formatarData(req.created_at)}</td>
                            <td className="px-4 py-2 text-sm text-gray-600 min-w-[200px]">{req.motivo}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                                <button
                                    onClick={() => handleUpdateStatus(req.id, 'aprovado')}
                                    disabled={loadingAction === req.id}
                                    className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 disabled:bg-gray-400 mr-2"
                                >
                                    {loadingAction === req.id ? 'Aguarde...' : 'Aprovar'}
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(req.id, 'rejeitado')}
                                    disabled={loadingAction === req.id}
                                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 disabled:bg-gray-400"
                                >
                                    {loadingAction === req.id ? 'Aguarde...' : 'Rejeitar'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}