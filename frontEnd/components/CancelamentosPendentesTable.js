import { useState } from 'react';

// Função para formatar a data (sem alterações)
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
    
    // Estado para o modal de inserir o motivo da rejeição (semelhante ao anterior)
    const [rejectionData, setRejectionData] = useState({ isOpen: false, requestId: null, reason: '' });

    // --- NOVOS ESTADOS PARA MODAIS ---
    // Estado para o modal de confirmação de aprovação
    const [approvalConfirm, setApprovalConfirm] = useState({ isOpen: false, requestId: null });
    // Estado para o modal de notificação (sucesso/erro)
    const [notification, setNotification] = useState({ isOpen: false, message: '' });


    // --- FUNÇÕES DE CONTROLE DOS MODAIS ---
    const handleOpenRejectionModal = (requestId) => {
        setRejectionData({ isOpen: true, requestId: requestId, reason: '' });
    };
    const handleCloseRejectionModal = () => {
        setRejectionData({ isOpen: false, requestId: null, reason: '' });
    };
    
    // Novas funções para controlar o modal de confirmação
    const handleOpenApprovalConfirm = (requestId) => {
        setApprovalConfirm({ isOpen: true, requestId: requestId });
    };
    const handleCloseApprovalConfirm = () => {
        setApprovalConfirm({ isOpen: false, requestId: null });
    };

    // Nova função para fechar o modal de notificação
    const handleCloseNotification = () => {
        setNotification({ isOpen: false, message: '' });
    };


    // --- LÓGICA PRINCIPAL ATUALIZADA ---
    const handleUpdateStatus = async (requestId, newStatus, motivoRejeicao = null) => {
        // Removemos o 'confirm' do navegador daqui. A confirmação agora acontece no modal.
        
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao atualizar status.');
            }
            
            // Define a mensagem de sucesso e abre o modal de notificação
            const successMessage = newStatus === 'aprovado'
                ? 'A solicitação foi aprovada com sucesso.'
                : 'Você recusou a solicitação de cancelamento.';
            setNotification({ isOpen: true, message: successMessage });

            // Fecha os modais de ação (rejeição ou aprovação)
            handleCloseRejectionModal();
            handleCloseApprovalConfirm();
            
            onActionComplete(prev => prev + 1);

        } catch (error) {
            console.error("Erro ao atualizar status da solicitação:", error);
            // Exibe o erro no modal de notificação
            setNotification({ isOpen: true, message: `Erro: ${error.message}` });
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
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{req.order_id}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{formatarData(req.created_at)}</td>
                                <td className="px-4 py-2 text-sm text-gray-600 min-w-[200px]">{req.motivo}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                    {/* Botão Aprovar agora abre o modal de confirmação */}
                                    <button 
                                        onClick={() => handleOpenApprovalConfirm(req.id)} 
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

            {/* --- NOVOS MODAIS EM JSX --- */}

            {/* Modal de Confirmação de Aprovação */}
            {approvalConfirm.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Confirmar Aprovação</h3>
                        <p className="text-gray-600 mb-6">Tem certeza que deseja APROVAR esta solicitação?</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={handleCloseApprovalConfirm} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">
                                Cancelar
                            </button>
                            <button 
                                onClick={() => handleUpdateStatus(approvalConfirm.requestId, 'aprovado')}
                                disabled={loadingAction === approvalConfirm.requestId}
                                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:opacity-50"
                            >
                                {loadingAction === approvalConfirm.requestId ? 'Processando...' : 'Sim, Aprovar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Rejeição (semelhante ao anterior) */}
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

            {/* Modal de Notificação Genérico (Sucesso/Erro) */}
            {notification.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center relative">
                        <button 
                            onClick={handleCloseNotification} 
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
                        >
                            &times; {/* Este é o caractere 'X' */}
                        </button>
                        <p className="text-gray-700 text-lg mt-4">{notification.message}</p>
                    </div>
                </div>
            )}
        </>
    );
}