// C:\Users\Dallyla\OneDrive\Área de Trabalho\beto-amparo\beto-amparo\frontEnd\pages\client\carrinho.js
import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { FaTrashAlt } from "react-icons/fa";
import NavBar from "@/components/NavBar";
import { useRouter } from "next/router";
import toast from 'react-hot-toast'; 
import ConfirmModal from "@/components/ConfirmModal";

export default function CarrinhoCliente({ empresaId }) {
    const [itensCarrinho, setItensCarrinho] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [corPrimaria, setCorPrimaria] = useState("#3B82F6");
    const [lojaId, setLojaId] = useState(null);
    const [lojaAberta, setLojaAberta] = useState(true);
    const [totalPontosCliente, setTotalPontosCliente] = useState(0);
    const [pontosParaUsar, setPontosParaUsar] = useState(0);
    const [descontoAplicado, setDescontoAplicado] = useState(0);
    const [ativarFidelidade, setAtivarFidelidade] = useState(false);
    const [observacoes, setobservacoes] = useState("");
    const [isLoading, setIsLoading] = useState(true); 

    const [codigoCupom, setCodigoCupom] = useState("");
    const [cupomAplicado, setCupomAplicado] = useState(null);
    const [descontoCupom, setDescontoCupom] = useState(0);

    const router = useRouter();
    const { slug } = router.query;

    const API_BASE_URL = process.env.NEXT_PUBLIC_EMPRESA_API;
    const [cliente, setCliente] = useState(null);

    // Função para verificar login do cliente, usada no primeiro useEffect
    const verificarLoginCliente = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/me`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setCliente(data.cliente); // Define o cliente no estado
                return data.cliente; // Retorna o cliente para ser usado imediatamente
            } else {
                router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
                return null;
            }
        } catch (err) {
            console.error("Erro ao verificar login", err);
            router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
            return null;
        }
    }, [API_BASE_URL, router]);

    // Função memorizada para buscar dados da loja
    const fetchLoja = useCallback(async () => {
        if (!slug) return;
        try {
            const url = `${API_BASE_URL}/loja/slug/${slug}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Erro ao buscar loja");
            const data = await response.json();
            setCorPrimaria(data.cor_primaria || "#3B82F6");
            setLojaId(data.id);
            setAtivarFidelidade(data.ativarFidelidade || false);
            setLojaAberta(data.is_closed_for_orders !== true); // Assume 'aberta' se is_closed_for_orders não for true
        } catch (error) {
            console.error("Erro ao buscar loja:", error);
            setCorPrimaria("#3B82F6");
            setLojaAberta(false);
        }
    }, [slug, API_BASE_URL]);

    // Função memorizada para buscar itens do carrinho
    const fetchCarrinho = useCallback(async () => {
        if (!slug) return;
        try {
            const url = `${API_BASE_URL}/loja/${slug}/carrinho`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Erro ao buscar carrinho");
            const data = await response.json();
            setItensCarrinho(data);
            const total = data.reduce((acc, item) => acc + item.quantidade * item.produto.preco, 0);
            setSubtotal(total);
        } catch (error) {
            console.error("Erro ao carregar carrinho:", error);
            setItensCarrinho([]);
            setSubtotal(0);
        }
    }, [slug, API_BASE_URL]);

    // Função memorizada para buscar dados dos pontos do cliente
    const fetchClientePontos = useCallback(async (currentClienteId) => {
        if (!currentClienteId) return; // Garante que o ID do cliente está disponível
        try {
            const url = `${API_BASE_URL}/clientes/${currentClienteId}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Erro ao buscar dados do cliente");
            const data = await response.json();
            setTotalPontosCliente(data.total_pontos || 0);
            setPontosParaUsar(data.total_pontos || 0); // Inicia com todos os pontos disponíveis
        } catch (error) {
            console.error("Erro ao buscar dados do cliente:", error);
            setTotalPontosCliente(0);
            setPontosParaUsar(0);
        }
    }, [API_BASE_URL]);

    // Efeito para carregar dados iniciais e verificar login
    useEffect(() => {
        if (!slug) return;

        const loadInitialData = async () => {
            setIsLoading(true);
            const loggedInClient = await verificarLoginCliente(); // Obtém o cliente logado

            if (loggedInClient) {
                await Promise.all([
                    fetchLoja(),
                    fetchCarrinho(),
                    fetchClientePontos(loggedInClient.id) // Passa o ID do cliente para fetchClientePontos
                ]);
            } else {
                // Se o cliente não estiver logado, ainda pode carregar loja e carrinho
                await Promise.all([
                    fetchLoja(),
                    fetchCarrinho()
                ]);
            }
            setIsLoading(false);
        };

        loadInitialData();
    }, [slug, verificarLoginCliente, fetchLoja, fetchCarrinho, fetchClientePontos]); // Dependências

    const atualizarQuantidade = useCallback(
        async (itemId, novaQuantidade) => {
            if (novaQuantidade < 1) return;

            try {
                const url = `${API_BASE_URL}/loja/${slug}/carrinho/${itemId}`;
                const response = await fetch(url, {
                    method: "PUT",
                    credentials: 'include',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ quantidade: novaQuantidade }),
                });

                if (!response.ok) throw new Error("Erro ao atualizar quantidade do item.");

                setItensCarrinho((prevItens) => {
                    const novosItens = prevItens.map((item) =>
                        item.id === itemId ? { ...item, quantidade: novaQuantidade } : item
                    );
                    const novoSubtotal = novosItens.reduce(
                        (acc, item) => acc + item.quantidade * item.produto.preco,
                        0
                    );
                    setSubtotal(novoSubtotal);
                    return novosItens;
                });
            } catch (error) {
                console.error("Erro ao atualizar quantidade:", error);
                toast.error("Não foi possível atualizar a quantidade do item.");
            }
        },
        [slug, API_BASE_URL]
    );

    const aplicarDesconto = useCallback(() => {
        const pontosDisponiveis = Math.min(pontosParaUsar, totalPontosCliente);

        const valorDesconto = (subtotal * (pontosDisponiveis / 100));

        setDescontoAplicado(Math.min(valorDesconto, subtotal));
    }, [pontosParaUsar, totalPontosCliente, subtotal]);

    const totalFinal = useMemo(() => {
        const totalComDesconto = subtotal - descontoAplicado - descontoCupom;
        return Math.max(0, totalComDesconto);
    }, [subtotal, descontoAplicado, descontoCupom]);

    const validarCupom = async (codigo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/loja/${slug}/validar-cupom?nome=${codigo}`);
            if (!response.ok) {
                const erro = await response.json();
                toast.error(erro.erro);
                return null;
            }
            const data = await response.json();
            return data; // { id, nome, valor }
        } catch (error) {
            console.error('Erro ao validar cupom:', error);
            toast.error('Erro ao validar cupom.');
            return null;
        }
    };

    const handleAplicarCupom = async () => {
    if (!codigoCupom) {
        toast.error("Digite o código do cupom.");
        return;
    }

    const cupom = await validarCupom(codigoCupom);
        if (cupom) {
            setCupomAplicado(cupom);
            setDescontoCupom((subtotal * cupom.valor) / 100);
        } else {
            setCupomAplicado(null);
            setDescontoCupom(0);
        }
    };
    

    const handleFinalizarCompra = useCallback(async () => {
        if (!lojaAberta) {
            toast.error("A loja está fechada e não é possível realizar o pedidodno momento.");
            return;
        }
        if (itensCarrinho.length === 0) {
            toast.error("Seu carrinho está vazio. Adicione itens antes de realizar o pedido.");
            return;
        }
        if (lojaId === null) {
            toast.error("Informações da loja não carregadas. Tente novamente.");
            return;
        }
        if (!cliente?.id) { // Verifica se o cliente está logado e tem ID
            toast.error("Você precisa estar logado para realizar o pedido.");
            router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
            return;
        }

        try {
            const id_cliente = cliente.id; // Agora cliente.id é seguro para usar
            const dataPedido = new Date().toISOString().split("T")[0];
            const status = 0; // Exemplo de status inicial

            // 1. Criar pedido
            const pedidoResponse = await fetch(`${API_BASE_URL}/loja/${slug}/pedidos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_cliente, // Usar id_cliente do estado
                    id_loja: lojaId,
                    data: dataPedido,
                    total: totalFinal,
                    desconto: descontoAplicado + descontoCupom,
                    observacoes: observacoes, 
                    status,
                }),
            });
            console.log("Enviando pedido com dados:", {
                id_cliente,
                id_loja: lojaId,
                data: dataPedido,
                total: totalFinal,
                desconto: descontoAplicado,
                status,
                observacoes
            });


            const pedidoCriado = await pedidoResponse.json();
            if (!pedidoResponse.ok) {
                throw new Error(pedidoCriado.erro || "Erro ao criar pedido.");
            }

            const pedidoId = pedidoCriado.id;

            // 2. Adicionar itens ao pedido
            const itemPromises = itensCarrinho.map((item) =>
                fetch(`${API_BASE_URL}/loja/${slug}/pedidos/item`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        pedido_id: pedidoId,
                        produto_id: item.produto.id,
                        quantidade: item.quantidade,
                        preco_unitario: item.produto.preco,
                    }),
                }).then(async (response) => {
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.erro || `Erro ao adicionar item ${item.produto.nome} ao pedido.`);
                    }
                })
            );
            await Promise.all(itemPromises);

            // 3. Limpar carrinho
            const deleteCartPromises = itensCarrinho.map((item) =>
                fetch(`${API_BASE_URL}/loja/${slug}/carrinho/${item.id}`, {
                    method: "DELETE",
                }).then(async (response) => {
                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error(`Erro ao remover item ${item.id} do carrinho:`, errorData);
                    }
                })
            );
            await Promise.all(deleteCartPromises);

            // 4. Atualizar pontos do cliente
            if (ativarFidelidade) {
                if (descontoAplicado > 0) {
                    // Cliente usou pontos → desconta os pontos usados
                    const urlAtualizaPontos = `${API_BASE_URL}/clientes/${id_cliente}/pontos`;
                    const pontosRestantes = totalPontosCliente - pontosParaUsar;
                    const updatePointsResponse = await fetch(urlAtualizaPontos, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ total_pontos: pontosRestantes }),
                    });
                    if (!updatePointsResponse.ok) {
                        console.error("Erro ao atualizar pontos após uso.");
                    }
                } else {
                    // Cliente não usou pontos → GANHA novos pontos
                    const urlGanharPontos = `${API_BASE_URL}/clientes/${id_cliente}/ganhar-pontos`;
                    const gainPointsResponse = await fetch(urlGanharPontos, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            valorTotalCompra: subtotal,
                            usouPontos: false,
                            id_loja: lojaId,
                        }),
                    });
                    if (!gainPointsResponse.ok) {
                        console.error("Erro ao conceder novos pontos.");
                    }
                }
            }

           router.push(`/client/finalizarPedido?slug=${slug}&pedidoId=${pedidoId}&clienteId=${cliente.id}`);

            setItensCarrinho([]);
            setSubtotal(0);
            setDescontoAplicado(0);
            setPontosParaUsar(0);
        } catch (error) {
            console.error("Erro ao realizar o pedido:", error);
            toast.error(`Ocorreu um erro ao realizar o pedido: ${error.message || "Tente novamente."}`);
        }
    }, [
        lojaAberta,
        itensCarrinho,
        lojaId,
        API_BASE_URL,
        slug,
        totalFinal,
        descontoAplicado,
        ativarFidelidade,
        totalPontosCliente,
        pontosParaUsar,
        subtotal,
        router,
        cliente, // Adicionar cliente como dependência
        observacoes
    ]);

    const handleRemoverItem = useCallback(
        async (id) => {
            try {
                const url = `${API_BASE_URL}/loja/${slug}/carrinho/${id}`;
                const response = await fetch(url, { method: "DELETE" });
                if (!response.ok) throw new Error("Erro ao remover item do carrinho.");

                setItensCarrinho((prevItens) => {
                    const novosItens = prevItens.filter((item) => item.id !== id);
                    const novoSubtotal = novosItens.reduce(
                        (acc, item) => acc + item.quantidade * item.produto.preco,
                        0
                    );
                    setSubtotal(novoSubtotal);
                    return novosItens;
                });
            } catch (error) {
                console.error("Erro ao remover item:", error);
                toast.error("Não foi possível remover o item do carrinho.");
            }
        },
        [slug, API_BASE_URL]
    );

    const getImagemProduto = useCallback((caminhoImagem) => {
        if (!caminhoImagem) return "/fallback.png";
        if (caminhoImagem.startsWith("http")) return caminhoImagem;
        const baseUrl = "https://cufzswdymzevdeonjgan.supabase.co/storage/v1/object/public";
        return `${baseUrl}/imagens/clientes/${encodeURIComponent(caminhoImagem)}`;
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-white text-black">
                <p className="text-xl">Carregando carrinho...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-white text-black">
            <header
                className="text-white px-4 py-3 shadow flex items-center justify-center"
                style={{ backgroundColor: corPrimaria }}
            >
                <h1 className="text-xl font-bold">Seu Carrinho</h1>
            </header>

            {/* Modal de Loja Fechada */}
            {!lojaAberta && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-sm mx-auto transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                        <h2 className="text-3xl font-extrabold text-red-600 mb-4">Loja Fechada!</h2>
                        <p className="text-lg text-gray-800 mb-6 leading-relaxed">
                            Desculpe, mas a loja está <span className="font-semibold">fechada no momento</span>.
                            Não é possível realizar pedidos agora.
                        </p>
                        <p className="text-md text-gray-600 mb-6">
                            Por favor, volte durante o horário de funcionamento para fazer seu pedido.
                        </p>
                        <button
                            onClick={() => router.push(`/loja/${slug}`)}
                            className="w-full px-6 py-3 rounded-lg text-white font-semibold text-lg shadow-md transition duration-300 ease-in-out hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                            style={{ backgroundColor: corPrimaria, borderColor: corPrimaria, outlineColor: corPrimaria }}
                        >
                            Entendi
                        </button>
                    </div>
                </div>
            )}

            {/* Conteúdo principal do carrinho com desfoque condicional */}
            <div
                className={`flex-1 flex items-center justify-center p-4 ${
                    !lojaAberta ? "filter blur-sm pointer-events-none" : ""
                }`}
            >
                <div className="max-w-2xl w-full pb-28">
                    {ativarFidelidade && (
                        <div className="space-y-2 mb-4 p-4 border rounded-lg shadow-sm bg-gray-50">
                            <label htmlFor="pontos" className="block text-sm font-medium text-gray-700">
                                Usar pontos de fidelidade:
                            </label>

                            <input
                                id="pontos"
                                type="number"
                                value={pontosParaUsar}
                                onChange={(e) => {
                                    const novoValor = parseInt(e.target.value, 10);
                                    if (!isNaN(novoValor) && novoValor >= 0 && novoValor <= totalPontosCliente) {
                                        setPontosParaUsar(novoValor);
                                    } else if (isNaN(novoValor) || novoValor < 0) {
                                        setPontosParaUsar(0);
                                    } else if (novoValor > totalPontosCliente) {
                                        setPontosParaUsar(totalPontosCliente);
                                    }
                                }}
                                className="border p-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />

                            <p className="text-sm text-gray-600">
                                Você tem <span className="font-semibold">{totalPontosCliente}</span> pontos
                                disponíveis.
                            </p>

                            <button
                                onClick={aplicarDesconto}
                                className="px-4 py-2 rounded-md text-white font-semibold shadow-md transition duration-300 ease-in-out hover:opacity-90"
                                style={{ backgroundColor: corPrimaria }}
                            >
                                Aplicar Desconto
                            </button>

                            {descontoAplicado > 0 && (
                                <div className="text-green-700 font-semibold mt-2">
                                    Desconto aplicado: R$ {descontoAplicado.toFixed(2)}
                                </div>
                            )}
                        </div>
                    )}

                    {itensCarrinho.length === 0 ? (
                        <p className="text-center text-gray-700 mt-10">Seu carrinho está vazio.</p>
                    ) : (
                        <div className="space-y-4">
                            {itensCarrinho.map((item) => (
                                <div
                                    key={item.id} // Use item.id como chave, é mais estável que o index
                                    className="flex items-center border rounded-lg p-4 shadow-sm bg-white"
                                >
                                    <Image
                                        src={getImagemProduto(item.produto.image)}
                                        alt={item.produto.nome}
                                        width={80}
                                        height={80}
                                        className="rounded object-cover"
                                        unoptimized
                                    />
                                    <div className="ml-4 flex-1">
                                        <p className="text-lg font-medium text-black">{item.produto.nome}</p>
                                        <p className="text-sm text-gray-800">
                                            Valor unitário: R$ {item.produto.preco.toFixed(2)}
                                        </p>

                                        <div className="flex items-center mt-2 space-x-2">
                                            <button
                                                onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}
                                                className="px-2 py-1 bg-gray-300 rounded text-black"
                                                disabled={item.quantidade <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="text-base">{item.quantidade}</span>
                                            <button
                                                onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)}
                                                className="px-2 py-1 bg-gray-300 rounded text-black"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoverItem(item.id)}
                                        className="ml-4 text-red-500 hover:text-red-700 transition duration-200 ease-in-out"
                                    >
                                        <FaTrashAlt size={20} />
                                    </button>
                                </div>
                            ))}

                            <div className="mt-4">
                                <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
                                    Observações para o pedido:
                                </label>
                                <textarea
                                    id="observacoes"
                                    value={observacoes}
                                    onChange={(e) => setobservacoes(e.target.value)}
                                    rows={3}
                                    placeholder="Ex.: Sem cebola, adicionar picles..."
                                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-2 mb-4 p-4 border rounded-lg shadow-sm bg-gray-50">
                                <label htmlFor="cupom" className="block text-sm font-medium text-gray-700">
                                    Aplicar cupom de desconto:
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        id="cupom"
                                        type="text"
                                        value={codigoCupom}
                                        onChange={(e) => setCodigoCupom(e.target.value)}
                                        placeholder="Digite o código do cupom"
                                        className="flex-1 border p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <button
                                        onClick={handleAplicarCupom}
                                        className="px-4 py-2 rounded-md text-white font-semibold shadow-md transition duration-300 ease-in-out hover:opacity-90"
                                        style={{ backgroundColor: corPrimaria }}
                                    >
                                        Aplicar
                                    </button>
                                </div>

                                {cupomAplicado && (
                                    <div className="text-green-700 font-semibold">
                                        Cupom {cupomAplicado.nome} aplicado! Desconto de R$ {descontoCupom.toFixed(2)}
                                    </div>
                                )}
                            </div>



                            <div className="flex justify-between font-bold border-t pt-4 text-black text-lg">
                                <span>Subtotal:</span>
                                <span>R$ {subtotal.toFixed(2)}</span>
                            </div>

                            {descontoAplicado > 0 && (
                                <div className="flex justify-between text-black">
                                    <span>Desconto (Fidelidade):</span>
                                    <span>- R$ {descontoAplicado.toFixed(2)}</span>
                                </div>
                            )}

                            {descontoCupom > 0 && (
                                <div className="flex justify-between text-black">
                                    <span>Desconto (Cupom):</span>
                                    <span>- R$ {descontoCupom.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-black font-bold text-xl">
                                <span>Total final:</span>
                                <span>R$ {totalFinal.toFixed(2)}</span>
                            </div>

                            <button
                                onClick={handleFinalizarCompra}
                                disabled={lojaId === null || !lojaAberta || itensCarrinho.length === 0}
                                className="w-full py-3 rounded-xl mt-6 text-white font-bold hover:opacity-90 transition-opacity"
                                style={{
                                    backgroundColor: corPrimaria,
                                    cursor:
                                        lojaId === null || !lojaAberta || itensCarrinho.length === 0
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >
                                Realizar Pedido
                            </button>
                            {!lojaAberta && (
                                <p className="text-red-500 text-center mt-2">
                                    A loja está fechada. Não é possível realizar o pedido.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <NavBar empresaId={empresaId} corPrimaria={corPrimaria} />
        </div>
    );
}
