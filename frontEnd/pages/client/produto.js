import { useEffect, useState } from "react";
import axios from "axios";
import ExibirProduto from "@/components/ExibirProduto";
import Adicionais from "@/components/Adicionais";
import QuantidadeControl from "@/components/QuantidadeControl";
import Carrinho from "@/components/AdicionarCarrinho";
import NavBar from "@/components/NavBar";
import { Obersevacao } from "@/components/Observacao";
import Rating from "@/components/Rating"; // IMPORTANTE
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function Produto() {
    const router = useRouter();
    const { id, site } = router.query;

    const [produto, setProduto] = useState(null);
    const [adicionais, setAdicionais] = useState({});
    const [quantidade, setQuantidade] = useState(1);
    const [selecionados, setSelecionados] = useState({});
    const [corPrimaria, setCorPrimaria] = useState("#3B82F6");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [nomeAvaliador, setNomeAvaliador] = useState('');
    const [comentario, setComentario] = useState('');
    const [nota, setNota] = useState(0);
    const [avaliacoes, setAvaliacoes] = useState([]);
    const [cliente , setCliente] = useState("")
    const subtotal =
        (produto?.preco || 0) * quantidade +
        Object.values(selecionados).reduce(
            (acc, item) => acc + item.count * item.price,
            0
        );

    useEffect(() => {
        if (!site) return;

        async function fetchEmpresa() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug/${site}`);
                const data = await response.json();
                setCorPrimaria(data.cor_primaria || "#3B82F6");
            } catch (error) {
                console.error("Erro ao buscar empresa:", error);
            }
        }
        fetchEmpresa();
    }, [site]);

    useEffect(() => {
        if (!router.isReady || !id) return;

        async function fetchProduto() {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produto/${id}`);
                const data = await response.json();

                if (!response.ok || !data) {
                    setError("Produto não encontrado.");
                    setProduto(null);
                } else {
                    setProduto(data);
                    setAdicionais(data.itens?.adicionais || {});
                }
            } catch (err) {
                setError("Erro ao carregar produto.");
                setProduto(null);
            } finally {
                setLoading(false);
            }
        }

        async function fetchAvaliacoes() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produto/${id}/avaliacoes`);
                const data = await response.json();
                console.log("Avaliações recebidas:", data);

                if (Array.isArray(data)) {
                    setAvaliacoes(data);
                } else if (Array.isArray(data.avaliacoes)) {
                    setAvaliacoes(data.avaliacoes);
                } else {
                    setAvaliacoes([]);
                    console.warn("Formato inesperado de avaliações:", data);
                }
            } catch (err) {
                console.error("Erro ao buscar avaliações:", err);
            }
        }
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
        verificarLoginCliente()

        fetchProduto();
        fetchAvaliacoes();
    }, [id, router.isReady]);

    const toggleAdicional = (name, price, type) => {
        setSelecionados((prev) => {
            const count = prev[name]?.count || 0;
            const newCount = type === "+" ? count + 1 : Math.max(count - 1, 0);
            return {
                ...prev,
                [name]: { count: newCount, price },
            };
        });
    };

    const handleAddToCart = async () => {
        try {
          
            if (!produto || !produto.id_loja) {
                toast.error("Informações do produto incompletas.");
                return;
            }
           
         
            const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${site}/carrinho`;
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                  },
                body: JSON.stringify({
                    produtoId: produto.id,
                    quantidade,
                    lojaId: produto.id_loja
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.mensagem || 'Erro');
            toast.success(data.mensagem || 'Adicionado com sucesso!');
        } catch (error) {
            toast.error('Erro ao adicionar ao carrinho');
        }
    };

    const handleEnviarAvaliacao = async () => {
        if (!nomeAvaliador.trim() || nota === 0) {
            toast.error("Informe o nome e selecione uma nota.");
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produto/${id}/avaliacao`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: nomeAvaliador,
                    rating: nota,
                    comentario
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro');

            toast.success("Avaliação enviada!");
            setNomeAvaliador('');
            setNota(0);
            setComentario('');

            setAvaliacoes(prev => [...prev, data.avaliacao]); // Atualiza a lista
        } catch (err) {
            toast.error("Erro ao enviar avaliação.");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-md w-full">
                <p className="font-bold">Erro</p>
                <p>{error}</p>
            </div>
        </div>
    );

    if (!produto) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 max-w-md w-full">
                <p className="font-bold">Aviso</p>
                <p>Produto não disponível.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Main Product Container */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="md:flex">
                        {/* Left Column - Product Image and Info */}
                        <div className="md:w-1/2 p-6">
                            <div className="mb-6">
                                <ExibirProduto produto={produto} corPrimaria={corPrimaria} />
                            </div>

                            <div className="mb-6">
                                <QuantidadeControl
                                    produto={produto}
                                    quantidade={quantidade}
                                    setQuantidade={setQuantidade}
                                    corPrimaria={corPrimaria}
                                />
                            </div>

                            <div className="mb-6">
                                <Obersevacao produto={produto} />
                            </div>
                        </div>

                        {/* Right Column - Extras, Reviews and Cart */}
                        <div className="md:w-1/2 p-6 bg-gray-50 border-l border-gray-200">
                            <div className="mb-6">
                                <Adicionais
                                    adicionais={adicionais}
                                    selecionados={selecionados}
                                    toggleAdicional={toggleAdicional}
                                    corPrimaria={corPrimaria}
                                />
                            </div>

                            {/* Cart */}
                            <div className="sticky bottom-0 bg-white p-4 rounded-lg shadow-md border border-gray-200">
                                <Carrinho
                                    subtotal={subtotal}
                                    handleAddToCart={handleAddToCart}
                                    corPrimaria={corPrimaria}
                                />
                            </div>

                            {/* Rating Form */}
                            <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Avalie este produto</h3>

                                <div className="space-y-3">
                                    <div>
                                        <input
                                            type="text"
                                            value={nomeAvaliador}
                                            onChange={(e) => setNomeAvaliador(e.target.value)}
                                            placeholder="Seu nome"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <span className="mr-2 text-sm text-gray-700">Nota:</span>
                                        <Rating editable rating={nota} onRatingChange={setNota} />
                                    </div>

                                    <div>
                                        <textarea
                                            value={comentario}
                                            onChange={(e) => setComentario(e.target.value)}
                                            placeholder="Comentário (opcional)"
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>

                                    <button
                                        onClick={handleEnviarAvaliacao}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
                                        style={{ backgroundColor: corPrimaria }}
                                    >
                                        Enviar Avaliação
                                    </button>
                                </div>
                            </div>

                            {/* Customer Reviews */}
                            <div className="mb-6">
                                <h4 className="text-lg font-semibold text-gray-800 mb-3">Avaliações</h4>

                                {avaliacoes.length === 0 ? (
                                    <p className="text-gray-500 text-sm">Nenhuma avaliação ainda.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {avaliacoes.map((av) => (
                                            <div key={av.id} className="p-3 bg-white rounded-lg shadow-sm">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-medium">{av.nome}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(av.data).toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                                <Rating rating={av.rating} />
                                                {av.comentario && (
                                                    <p className="text-sm text-gray-700 mt-1">{av.comentario}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="mt-6">
                    <NavBar site={site} corPrimaria={corPrimaria} />
                </div>
            </div>
        </div>
    );
}