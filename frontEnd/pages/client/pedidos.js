import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react'; // Import useCallback
import NavBar from '@/components/NavBar';
import CancelarPedidoModal from '@/components/CancelarPedidoModal';

export default function Pedidos() {
    const router = useRouter();
    const { slug } = router.query;

    const [pedidos, setPedidos] = useState([]);
    const [corPrimaria, setCorPrimaria] = useState("#3B82F6"); // Valor padrão
    const [corSecundaria, setCorSecundaria] = useState("#F3F4F6"); // Valor padrão
    const [nome_fantasia, setNomeFantasia] = useState("");
    const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [cliente, setCliente] = useState(null);

    const [pedidoDetalhes, setPedidoDetalhes] = useState(null);
    const [showDetalhes, setShowDetalhes] = useState(false);

    const getContrastColor = (hexColor) => {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#FFFFFF';
    };

    const formatarData = (dataISO) => {
        const data = new Date(dataISO);
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0'); // meses começam do 0
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
    };

    // Define fetchPedidos using useCallback so it can be safely passed around
    const fetchPedidos = useCallback(async () => {
        if (!slug || !cliente) return; // Ensure slug and client are available before fetching

        try {
            const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos/cliente/${cliente.id}`;
            console.log("Frontend: Chamando API de pedidos:", url);

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
    }, [slug, cliente]); // Dependencies for useCallback

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

        verificarLoginCliente();
    }, [slug, router]);

    useEffect(() => {
        // This useEffect now only fetches loja data.
        // fetchPedidos is handled by its own useCallback and triggered after client is set.
        if (!slug) return;

        async function fetchLoja() {
            try {
                const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug/${slug}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error("Erro ao buscar loja");
                const data = await response.json();
                setCorPrimaria(data.cor_primaria || "#3B82F6");
                setCorSecundaria(data.cor_secundaria || "#F3F4F6");
                setNomeFantasia(data.nome_fantasia || slug);
            } catch (error) {
                console.error("Erro ao buscar loja:", error);
            }
        }

        fetchLoja();
        // Call fetchPedidos here, as it now has client and slug as dependencies in its useCallback
        // and will run when those change.
        if (cliente) { // Only fetch pedidos if cliente is already available
            fetchPedidos();
        }
    }, [slug, cliente, fetchPedidos]); // Add fetchPedidos to dependencies

    const traduzirStatus = (status) => {
        switch (String(status)) { // Ensure status is treated as a string for comparison
            case '0':
                return 'Aguardando confirmação';
            case '1':
                return 'Confirmado';
            case '2':
                return 'Em preparação';
            case '3':
                return 'Pronto para entrega';
            case '4':
                return 'Finalizado';
            case '5':
                return 'Cancelado';
            default:
                return 'Status desconhecido';
        }
    };

    const abrirModalDetalhes = async (pedido) => {
        try {
            // Note: The API endpoint for item details uses 'http://localhost:4000'.
            // Ensure this is correct for your production environment or use an environment variable.
            const res = await fetch(`http://localhost:4000/pedidos/${pedido.id}/itens`);
            const itens = await res.json();
            setPedidoDetalhes({ ...pedido, itens });
            setShowDetalhes(true);
        } catch (err) {
            console.error("Erro ao buscar detalhes do pedido:", err);
        }
    };

    const abrirModalCancelamento = (pedido) => {
        setPedidoSelecionado(pedido); // passa o pedido inteiro
        setShowModal(true);
    };

    if (!slug || !cliente) return <p className="text-black text-center mt-10">Carregando...</p>;

    const textColor = getContrastColor(corPrimaria);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Barra superior */}
            <header
                className="px-4 py-3 flex items-center justify-center shadow"
                style={{ backgroundColor: corPrimaria, color: textColor }}
            >
                <h1 className="text-xl font-bold" style={{ color: textColor }}>
                    Seus pedidos em {nome_fantasia || slug}
                </h1>
            </header>

            {/* Conteúdo principal */}
            <main className="flex-1 p-4 pb-28 flex flex-col items-center">
                {pedidos.length === 0 ? (
                    <p className="text-black text-center text-lg mt-10">Você ainda não fez pedidos.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                        {pedidos.map((pedido) => (
                            <div
                                key={pedido.id}
                                className="bg-white border border-gray-300 rounded-md p-4 w-full text-black shadow"
                            >
                                <p><strong>ID do pedido:</strong> {pedido.id}</p>
                                <p><strong>Data:</strong> {formatarData(pedido.data)}</p>
                                <p><strong>Total:</strong> R$ {(Number(pedido.total) || 0).toFixed(2)}</p>
                                <p><strong>Status:</strong> {traduzirStatus(pedido.status)}</p>
                                <p><strong>Observações:</strong> {pedido.observacoes || 'Nenhuma'}</p>

                                <div className="mt-4 space-y-3">
                                    {['0', '1', '2'].includes(String(pedido.status)) && (
                                        <>
                                            {pedido.cancellation_status === 'pendente' ? (
                                                <div className="p-2 w-full text-center bg-yellow-100 border border-yellow-200 text-yellow-800 rounded-md text-sm">
                                                    Cancelamento solicitado, aguardando aprovação.
                                                </div>
                                            ) : pedido.cancellation_status === 'rejeitado' && (
                                                <div className="p-3 w-full text-left bg-red-100 border-l-4 border-red-500 text-red-800 rounded-md text-sm">
                                                    <p className="font-bold">Sua solicitação de cancelamento foi rejeitada.</p>
                                                    {pedido.rejection_reason && (
                                                        <p className="mt-1 text-xs italic">Motivo do estabelecimento: "{pedido.rejection_reason}"</p>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Linha de botões de ação */}
                                    <div className="flex justify-center items-center gap-3">
                                        {/* O botão de DETALHES agora está fora da condição e sempre será exibido */}
                                        <button
                                            onClick={() => abrirModalDetalhes(pedido)}
                                            className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 border"
                                            style={{
                                                backgroundColor: corPrimaria,
                                                color: getContrastColor(corPrimaria),
                                                borderColor: corPrimaria
                                            }}
                                        >
                                            Detalhes do pedido
                                        </button>

                                        {['0', '1'].includes(String(pedido.status)) && pedido.cancellation_status !== 'pendente' && (
                                            <button
                                                onClick={() => abrirModalCancelamento(pedido)}
                                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200"
                                            >
                                                Cancelar pedido
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showModal && (
                    <CancelarPedidoModal
                        pedidoId={pedidoSelecionado.id}
                        clienteId={cliente.id}
                        onClose={() => {
                            setShowModal(false);
                            fetchPedidos(); // Now fetchPedidos is accessible and will re-fetch
                        }}
                    />
                )}
                {showDetalhes && pedidoDetalhes && (
                    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50">
                        <div className="bg-white p-4 rounded-md shadow max-w-md w-full text-black">
                            <div className="flex flex-col items-center justify-center">
                                <h2 className="text-lg font-bold mb-2">Detalhes do Pedido</h2>
                                <div>
                                    <p><strong>ID:</strong> {pedidoDetalhes.id}</p>
                                    <p><strong>Data:</strong> {formatarData(pedidoDetalhes.data)}</p>
                                    <p><strong>Status:</strong> {traduzirStatus(pedidoDetalhes.status)}</p>
                                    <p><strong>Desconto:</strong> R$ {(Number(pedidoDetalhes.desconto) || 0).toFixed(2)}</p>
                                    <p><strong>Total:</strong> {Number(pedidoDetalhes.total).toFixed(2)}</p> {/* Ensure total is formatted */}

                                    <h3 className="mt-2 font-semibold">Itens:</h3>
                                    <ul className="list-disc list-inside">
                                        {pedidoDetalhes.itens?.map((item, idx) => (
                                            <li key={item.id}>
                                                {item.nome_produto} - {item.quantidade}x R$ {(Number(item.preco_unitario) || 0).toFixed(2)}
                                            </li>
                                        ))}
                                    </ul>
                                </div> 
                            <button
                                onClick={() => setShowDetalhes(false)}
                                className="mt-4 px-4 py-2 bg-gray-300 rounded-md"
                            >
                                Fechar
                            </button>          
                            </div>
                        </div>
                    </div>
                )}

            </main>

            <NavBar site={slug} corPrimaria={corPrimaria} />
        </div>
    );
}