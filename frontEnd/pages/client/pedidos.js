// pages/loja/[slug]/pedidos.js

import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import NavBar from '@/components/NavBar';
import RejectionInfo from '@/components/RejectionInfo';
import ConfirmCancelModal from '@/components/ConfirmCancelModal'; // <<<<< NOVO IMPORT

// IMPORTS NECESSÁRIOS para formatação de data/hora
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';


export default function Pedidos() {
    const router = useRouter();
    const { slug } = router.query;

    const [pedidos, setPedidos] = useState([]);
    const [corPrimaria, setCorPrimaria] = useState("#3B82F6");
    const [corSecundaria, setCorSecundaria] = useState("#F3F4F6");
    const [nome_fantasia, setNomeFantasia] = useState("");
    const [cliente, setCliente] = useState(null);

    const [pedidoDetalhes, setPedidoDetalhes] = useState(null);
    const [showDetalhes, setShowDetalhes] = useState(false);

    // <<<<<< ESTADOS PARA O NOVO MODAL DE CONFIRMAÇÃO DE CANCELAMENTO >>>>>
    const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
    const [pedidoToCancel, setPedidoToCancel] = useState(null); // Armazena o pedido que será cancelado
    // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

    // <<<<<< ESTADOS PARA AVISOS PERSONALIZADOS (mantidos para outras mensagens) >>>>>
    const [mensagem, setMensagem] = useState('');
    const [corMensagem, setCorMensagem] = useState('');
    // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

    const getContrastColor = (hexColor) => {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#FFFFFF';
    };

    const TIME_ZONE = 'America/Araguaina';
    
    const formatarData = (dataISO) => {
        if (!dataISO) {
            return 'N/A';
        }
        
        try {
            const zonedDate = toZonedTime(dataISO, TIME_ZONE);
            const formattedDate = formatInTimeZone(zonedDate, TIME_ZONE, 'dd/MM/yyyy HH:mm', { locale: ptBR });
            return formattedDate;
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return 'Erro na data';
        }
    };

    const irParaFinalizar = (idCliente, pedidoId) => {
        router.push({
            pathname: `/client/finalizarPedido`, // <--- CORRIGIDO AQUI
            query: {
                slug: slug,       // slug da loja vindo da URL
                clienteId: idCliente,
                pedidoId: pedidoId    // ID do pedido em andamento
            }
        });
    };

    const fetchPedidos = useCallback(async () => {
        if (!slug || !cliente) return;

        try {
            const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos/cliente/${cliente.id}`;
            const res = await fetch(url, {
                method: "GET",
                credentials: 'include',
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            setPedidos(data);
        } catch (error) {
            console.error("Erro ao buscar pedidos:", error);
        }
    }, [slug, cliente]);

    useEffect(() => {
        if (!slug) return;

        async function verificarLoginCliente() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/me`, {
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    setCliente(data.cliente);
                } else {
                    router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
                }
            } catch (err) {
                console.error("Erro ao verificar login", err);
                router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
            }
        }

        async function fetchLojaData() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug/${slug}`);
                if (response.ok) {
                    const data = await response.json();
                    setNomeFantasia(data.nome_fantasia || slug);
                    setCorPrimaria(data.cor_primaria || "#3B82F6");
                    setCorSecundaria(data.cor_secundaria || "#F3F4F6");
                } else {
                    console.error("Erro ao buscar dados da loja:", response.statusText);
                    setNomeFantasia("Loja não encontrada");
                }
            } catch (error) {
                console.error("Erro ao buscar dados da loja:", error);
            }
        }

        verificarLoginCliente();
        fetchLojaData();
    }, [slug, router]);


    useEffect(() => {
        if (cliente && slug) {
            fetchPedidos();
            const interval = setInterval(fetchPedidos, 15000);
            return () => clearInterval(interval);
        }
    }, [slug, cliente, fetchPedidos]);

    const traduzirStatus = (status) => {
        switch (String(status)) {
            case '-1':
                return 'Carrinho Aberto';
            case '0':
                return 'Aguardando confirmação';
            case '1':
                return 'Confirmado';
            case '2':
                return 'Em preparação';
            case '3':
                return 'Pronto para entrega';
            case '4':
                return 'Entregue';
            case '5':
                return 'Cancelado';
            default:
                return 'Status desconhecido';
        }
    };

    const getPedidoCardProps = (status) => {
        let classes = "bg-white border-2 rounded-md p-4 w-full text-black shadow-lg";
        let headerClasses = "text-xl font-bold mb-2";
        let message = null;
        let messageColor = "text-gray-700";
        let icon = null;

        switch (String(status)) {
            case '-1':
                classes += " border-purple-500 opacity-90";
                headerClasses += " text-purple-700";
                message = "Seu carrinho está aguardando para ser finalizado!";
                messageColor = "text-purple-600";
                icon = "🛒";
                break;
            case '0': // Aguardando confirmação (Pedido Recente)
                classes += " border-blue-500 animate-pulse-subtle";
                headerClasses += " text-blue-700";
                message = "Confirmando seu pedido! Estamos avisando a loja.";
                messageColor = "text-blue-600";
                icon = "🕒";
                break;
            case '1': // Confirmado (Pedido Recente)
                classes += " border-green-500";
                headerClasses += " text-green-700";
                message = "Seu pedido foi confirmado e será preparado em breve!";
                messageColor = "text-green-600";
                icon = "✅";
                break;
            case '2': // Em preparação (Pedido Recente)
                classes += " border-yellow-500 bg-yellow-50";
                headerClasses += " text-yellow-700";
                message = "A loja está preparando seu pedido com todo carinho!";
                messageColor = "text-yellow-600";
                icon = "🍳";
                break;
            case '3': // Pronto para entrega (Pedido Recente)
                classes += " border-indigo-500 bg-indigo-50 animate-bounce-subtle";
                headerClasses += " text-indigo-700";
                message = "Seu pedido saiu para entrega! Prepare-se para receber. 🛵";
                messageColor = "text-indigo-600";
                icon = "📦";
                break;
            case '4': // Entregue (Histórico)
                classes += ` border-gray-400 opacity-80 border-b-4 border-r-4`; 
                classes += ` bg-white`; 
                headerClasses += " text-gray-600";
                message = "Pedido entregue com sucesso! Esperamos que tenha gostado. ⭐";
                messageColor = "text-gray-500";
                icon = "🎉";
                break;
            case '5': // Cancelado (Histórico)
                classes += ` border-red-500 opacity-80 border-b-4 border-r-4`; 
                classes += ` bg-white`; 
                headerClasses += " text-red-700";
                message = null; // Mensagem será tratada pelo RejectionInfo
                messageColor = "text-red-600";
                icon = "❌";
                break;
            default: // Status desconhecido
                classes += " border-gray-300 opacity-90";
                headerClasses += " text-gray-700";
                message = "Verifique o status do seu pedido.";
                messageColor = "text-gray-600";
                icon = "❓";
        }
        return { classes, headerClasses, message, messageColor, icon };
    };

    const abrirModalDetalhes = async (pedido) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/pedidos/${pedido.id}/itens`);
            if (!res.ok) throw new Error(`Erro HTTP! status: ${res.status}`);
            const itens = await res.json();
            setPedidoDetalhes({ ...pedido, itens });
            setShowDetalhes(true);
        } catch (err) {
            console.error("Erro ao buscar detalhes do pedido:", err);
            setMensagem('Erro ao buscar detalhes do pedido.');
            setCorMensagem('text-red-600');
            setTimeout(() => setMensagem(''), 3000);
        }
    };

    // FUNÇÃO: Cancelamento direto para pedidos com status 0
    const handleDirectCancel = async () => {
        if (!pedidoToCancel || !cliente) return; // Garante que há um pedido para cancelar e um cliente logado

        const pedidoId = pedidoToCancel.id;
        const clienteId = cliente.id;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/pedidos/${pedidoId}/cancelar-direto`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clienteId }),
                credentials: 'include',
            });
    
            if (!res.ok) {
                const errorData = await res.json();
                setMensagem(errorData.mensagem || `Erro ao cancelar pedido: ${res.status}`);
                setCorMensagem('text-red-600');
                setTimeout(() => setMensagem(''), 3000);
                throw new Error(errorData.mensagem || `Erro ao cancelar pedido diretamente: ${res.status}`);
            }
    
            setMensagem("Pedido cancelado com sucesso!");
            setCorMensagem('text-green-600');
            setTimeout(() => setMensagem(''), 3000);
            fetchPedidos(); 
    
        } catch (error) {
            console.error("Erro no cancelamento direto:", error);
            if (!mensagem) { // Evita sobrescrever mensagem de erro da API
                setMensagem(`Erro inesperado: ${error.message}`);
                setCorMensagem('text-red-600');
                setTimeout(() => setMensagem(''), 3000);
            }
        } finally {
            setShowConfirmCancelModal(false); // Fecha o modal após a tentativa de cancelamento
            setPedidoToCancel(null); // Limpa o pedido selecionado
        }
    };

    // Abre o modal de confirmação, definindo qual pedido será cancelado
    const handleOpenCancelConfirmation = (pedido) => {
        if (String(pedido.status) === '0') {
            setPedidoToCancel(pedido);
            setShowConfirmCancelModal(true);
        }
    };

    // Função para cancelar o modal de confirmação
    const handleCancelConfirmation = () => {
        setShowConfirmCancelModal(false);
        setPedidoToCancel(null);
    };

    if (!slug || !cliente) return <p className="text-black text-center mt-10">Carregando...</p>;

    const textColor = getContrastColor(corPrimaria);

    const pedidosRecentes = pedidos.filter(pedido =>
        parseInt(pedido.status) < 4
    ).sort((a, b) => new Date(b.data) - new Date(a.data));

    const historicoPedidos = pedidos.filter(pedido =>
        parseInt(pedido.status) >= 4
    ).sort((a, b) => new Date(b.data) - new Date(a.data));


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="px-4 py-3 flex items-center justify-center shadow-md sticky top-0 bg-white z-10" 
                    style={{ backgroundColor: corPrimaria, color: textColor }}
            >
                <h1 className="text-xl font-semibold tracking-wide" style={{ color: textColor }}>
                    Seus pedidos em {nome_fantasia || slug}
                </h1>
            </header>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col items-center">
                {mensagem && (
                    <div className={`text-center mb-4 font-medium ${corMensagem}`}>
                        {mensagem}
                    </div>
                )}

                {pedidos.length === 0 ? (
                    <div className="text-center mt-16">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Sem pedidos</h3>
                        <p className="mt-1 text-sm text-gray-500">Você ainda não fez nenhum pedido nesta loja.</p>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl">
                        {/* SEÇÃO: PEDIDOS RECENTES (Ativos/Em Andamento) */}
                        {pedidosRecentes.length > 0 && (
                            <>
                                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Meus Pedidos Ativos</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {pedidosRecentes.map((pedido) => {
                                        const { classes, headerClasses, message, messageColor, icon } = getPedidoCardProps(pedido.status);
                                        return (
                                            <div
                                                key={pedido.id}
                                                className={classes}
                                            >
                                                <h3 className={`text-lg mb-2 flex items-center gap-2 ${headerClasses}`}>
                                                    {icon && <span className="text-xl">{icon}</span>}
                                                    Status do Pedido: {traduzirStatus(pedido.status)}
                                                </h3>
                                                {String(pedido.status) !== '5' && message && <p className={`font-semibold mb-3 ${messageColor}`}>{message}</p>}

                                                {String(pedido.status) === '5' && pedido.rejection_reason && (
                                                    <RejectionInfo rejection_reason={pedido.rejection_reason} />
                                                )}

                                                <hr className="border-gray-200 mb-3" />

                                                <p><strong>ID do pedido:</strong> {pedido.id}</p>
                                                <p><strong>Data:</strong> {formatarData(pedido.data)}</p>
                                                <p><strong>Total:</strong> R$ {(Number(pedido.total) || 0).toFixed(2)}</p>
                                                <p><strong>Observações:</strong> {pedido.observacoes || 'Nenhuma'}</p>

                                                <div className="mt-4 flex justify-around gap-2">
                                                    <button
                                                        onClick={() => abrirModalDetalhes(pedido)}
                                                        className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 border flex-1 cursor-pointer"
                                                        style={{
                                                            backgroundColor: corPrimaria,
                                                            color: getContrastColor(corPrimaria),
                                                            borderColor: corPrimaria
                                                        }}
                                                    >
                                                        Detalhes do pedido
                                                    </button>
                                                    
                                                    {String(pedido.status) === '-1' ? (
                                                        <button
                                                            onClick={() => irParaFinalizar(cliente.id, pedido.id)}
                                                                className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors flex-1 cursor-pointer"
                                                                style={{ backgroundColor: corPrimaria, color: getContrastColor(corPrimaria) }}
                                                        >
                                                            Finalizar Pedido
                                                        </button>
                                                    ) : (
                                                        // <<<<< LÓGICA DO BOTÃO "CANCELAR PEDIDO" AGORA ABRE O MODAL >>>>>
                                                        String(pedido.status) === '0' && !pedido.rejection_reason && (
                                                            <button
                                                                onClick={() => handleOpenCancelConfirmation(pedido)} // <<<<< CHAMAR FUNÇÃO QUE ABRE O MODAL
                                                                className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 border bg-red-500 text-white flex-1 cursor-pointer"
                                                            >
                                                                Cancelar pedido
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* SEÇÃO: HISTÓRICO DE PEDIDOS (Concluídos/Cancelados) */}
                        {historicoPedidos.length > 0 && (
                            <>
                                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Histórico de Pedidos</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {historicoPedidos.map((pedido) => {
                                        const { classes, headerClasses, message, messageColor, icon } = getPedidoCardProps(pedido.status);
                                        return (
                                            <div
                                                key={pedido.id}
                                                className={classes}
                                            >
                                                <h3 className={`text-lg mb-2 flex items-center gap-2 ${headerClasses}`}>
                                                    {icon && <span className="text-xl">{icon}</span>}
                                                    Status do Pedido: {traduzirStatus(pedido.status)}
                                                </h3>
                                                {String(pedido.status) !== '5' && message && <p className={`font-semibold mb-3 ${messageColor}`}>{message}</p>}
                                                
                                                {String(pedido.status) === '5' && pedido.rejection_reason && ( 
                                                    <RejectionInfo rejection_reason={pedido.rejection_reason} />
                                                )}
                                                <hr className="border-gray-200 mb-3" />

                                                <p><strong>ID do pedido:</strong> {pedido.id}</p>
                                                <p><strong>Data:</strong> {formatarData(pedido.data)}</p>
                                                <p><strong>Total:</strong> R$ {(Number(pedido.total) || 0).toFixed(2)}</p>
                                                <p><strong>Observações:</strong> {pedido.observacoes || 'Nenhuma'}</p>

                                                <div className="mt-4 flex justify-around gap-2">
                                                    <button
                                                        onClick={() => abrirModalDetalhes(pedido)}
                                                        className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 border flex-1 cursor-pointer"
                                                        style={{
                                                            backgroundColor: corPrimaria,
                                                            color: getContrastColor(corPrimaria),
                                                            borderColor: corPrimaria
                                                        }}
                                                    >
                                                        Detalhes do pedido
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* MODAL DE DETALHES DO PEDIDO */}
                {showDetalhes && pedidoDetalhes && (
                    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">Detalhes do Pedido #{pedidoDetalhes.id}</h2>
                            <div className="text-sm space-y-2 text-gray-800">
                                <p><strong>Data:</strong> {formatarData(pedidoDetalhes.data)}</p>
                                <p><strong>Status:</strong> {traduzirStatus(pedidoDetalhes.status)}</p>
                                <p><strong>Total:</strong> R$ {Number(pedidoDetalhes.total).toFixed(2)}</p>
                                {pedidoDetalhes.desconto > 0 && <p><strong>Desconto:</strong> R$ {Number(pedidoDetalhes.desconto).toFixed(2)}</p>}
                                <h3 className="font-semibold text-base pt-2 border-t mt-3">Itens:</h3>
                                <ul className="list-disc list-inside space-y-1 pl-2">
                                    {pedidoDetalhes.itens?.map((item) => (
                                        <li key={item.id}>
                                            {item.quantidade}x {item.produto?.nome || item.nome_produto} - R$ {(Number(item.preco_unitario) || 0).toFixed(2)}
                                        </li>
                                    ))}
                                </ul>
                            </div> 
                            <button onClick={() => setShowDetalhes(false)} className="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                                Fechar
                            </button>          
                        </div>
                    </div>
                )}

                {/* <<<<<< NOVO MODAL DE CONFIRMAÇÃO DE CANCELAMENTO >>>>> */}
                {showConfirmCancelModal && pedidoToCancel && (
                    <ConfirmCancelModal
                        message={`Tem certeza que deseja cancelar o pedido #${pedidoToCancel.id}?`}
                        onConfirm={handleDirectCancel}
                        onCancel={handleCancelConfirmation}
                    />
                )}
                {/* <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< */}
            </main>

            <NavBar site={slug} corPrimaria={corPrimaria} />
        </div>
    );
}