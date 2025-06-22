// frontEnd/pages/client/ClienteHome.js

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import NavBar from "@/components/NavBar";
import ProdutoCard from "@/components/ProdutoCard";
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { Menu } from '@headlessui/react';
import { temas } from '../empresa/[slug]/temas';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY);


export default function ClienteHome() {
    const router = useRouter();
    const { site } = router.query; // 'site' é o slug da loja
    const [clienteLogado, setClienteLogado] = useState(false);
    const [cliente, setCliente] = useState(null);

    const [lojaId, setLojaId] = useState(null);
    const [nomeFantasia, setNomeFantasia] = useState("Carregando...");
    const [isLojaClosed, setIsLojaClosed] = useState(false); // Estado para o status da loja

    const [produtos, setProdutos] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [bannerLoja, setBannerLoja] = useState(null);
    const [ativarFidelidade, setAtivarFidelidade] = useState(false);

    const removeAccents = (str) => {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    };

    // A filtragem agora deve ser feita APÓS o carregamento dos produtos,
    // e deve considerar também a disponibilidade para o cliente.
    const produtosFiltrados = produtos.filter((produto) => {
        const matchesSearch = removeAccents(produto.nome.toLowerCase()).includes(
            removeAccents(searchTerm.toLowerCase())
        );

        const isActuallyAvailableToClient = !produto.indisponivel_automatico;

        console.log(`DEBUG: ClienteHome - Filtrando produto ${produto.nome}: matchesSearch=${matchesSearch}, isActuallyAvailableToClient=${isActuallyAvailableToClient}`);
        return matchesSearch && isActuallyAvailableToClient;
    });

    const [quantidades, setQuantidades] = useState({});
    const [mensagem, setMensagem] = useState('');
    const [corMensagem, setCorMensagem] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [fotoLoja, setFotoLoja] = useState(null);
    const [corPrimaria, setCorPrimaria] = useState("#3B82F6");
    const [corSecundaria, setCorSecundaria] = useState("#F3F4F6");
    const [temaVisual, setTemaVisual] = useState('');

    const verificarLoginCliente = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/me`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setCliente(data.cliente);
                setClienteLogado(true);
            } else {
                setCliente(null);
                setClienteLogado(false);
            }
        } catch (err) {
            setCliente(null);
            setClienteLogado(false);
        }
    }, []);

    useEffect(() => {
        verificarLoginCliente();
        window.addEventListener('focus', verificarLoginCliente);
        return () => {
            window.removeEventListener('focus', verificarLoginCliente);
        };
    }, [verificarLoginCliente]);

    useEffect(() => {
        console.log('DEBUG: ClienteHome - useEffect para fetchEmpresa disparado. Site:', site);
        if (!site) return;

        async function fetchEmpresa() {
            try {
                const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug/${site}`;
                console.log('DEBUG: ClienteHome - Buscando dados da empresa:', url);
                const response = await fetch(url);

                if (!response.ok) {
                    let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
                    try {
                        const errorData = await response.json();
                        if (errorData.message) {
                            errorMessage += ` - ${errorData.message}`;
                        }
                    } catch (jsonError) {
                        console.error('DEBUG: ClienteHome - Erro ao parsear JSON de erro da empresa:', jsonError);
                    }
                    console.error("DEBUG: ClienteHome - Erro na resposta da API de empresa:", errorMessage);
                    setNomeFantasia("Erro ao carregar");
                    return;
                }

                const data = await response.json();
                console.log('DEBUG: ClienteHome - Dados da empresa recebidos:', data);
                setLojaId(data.id);
                setNomeFantasia(data.nome_fantasia || "Sem nome fantasia");
                setFotoLoja(data.foto_loja || null);
                setCorPrimaria(data.cor_primaria || "#3B82F6");
                setCorSecundaria(data.cor_secundaria || "#F3F4F6");
                setBannerLoja(data.banner || null);
                setIsLojaClosed(data.is_closed_for_orders || false); // NOVO: Define o status de fechado/aberto
                setAtivarFidelidade(data.ativarFidelidade || false);
                setTemaVisual(data.tema_visual || '');
            } catch (error) {
                console.error("DEBUG: ClienteHome - Erro na requisição ao buscar empresa:", error.message || error);
                setNomeFantasia("Erro ao carregar");
            }
        }

        fetchEmpresa();
    }, [site]);

    const temaSelecionado = temaVisual && temas[temaVisual] ? temas[temaVisual] : null;

    useEffect(() => {
        if (temaSelecionado) {
            setCorPrimaria(temaSelecionado.corPrimaria);
            setCorSecundaria(temaSelecionado.corSecundaria);
            document.body.style.fontFamily = temaSelecionado.fonte;
        } else {
            // Caso não tenha tema, reseta fonte padrão
            document.body.style.fontFamily = '';
        }
    }, [temaSelecionado]);

    useEffect(() => {
        console.log('DEBUG: ClienteHome - useEffect para fetchProdutos disparado. Site:', site);
        if (!site) return;

        async function fetchProdutos() {
            try {
                const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/produtos/loja/${site}`;
                console.log('DEBUG: ClienteHome - Buscando produtos da loja:', url);
                const response = await fetch(url);

                if (!response.ok) {
                    console.error("DEBUG: ClienteHome - Erro na resposta da API de produtos:", response.statusText);
                    setProdutos([]);
                    return;
                }

                const data = await response.json();
                console.log('DEBUG: ClienteHome - Produtos brutos recebidos da API:', data);

                if (Array.isArray(data)) {
                    setProdutos(data);
                } else if (data && Array.isArray(data.produtos)) {
                    setProdutos(data.produtos);
                } else if (data && Array.isArray(data.itens)) {
                    setProdutos(data.itens);
                } else {
                    console.warn("DEBUG: ClienteHome - API de produtos retornou dados em formato inesperado:", data);
                    setProdutos([]);
                }
                console.log('DEBUG: ClienteHome - Produtos processados e definidos no estado:', data);

            } catch (error) {
                console.error("DEBUG: ClienteHome - Erro ao buscar produtos:", error.message);
                setProdutos([]);
            }
        }

        fetchProdutos();
    }, [site]);

    const handleShareClick = async () => {
        console.log('DEBUG: ClienteHome - Tentando compartilhar link.');
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Compartilhe este link",
                    url: window.location.href,
                });
                console.log('DEBUG: ClienteHome - Compartilhamento nativo bem-sucedido.');
            } catch (error) {
                console.error("DEBUG: ClienteHome - Erro ao compartilhar nativamente:", error);
            }
        } else {
            const url = window.location.href;
            const text = encodeURIComponent("Confira esse conteúdo:");
            const shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
            console.log('DEBUG: ClienteHome - Abrindo janela de compartilhamento no WhatsApp:', shareUrl);
            window.open(shareUrl, "_blank");
        }
    };

    const getImagemProduto = (caminhoImagem) => {
        if (!caminhoImagem) {
            console.warn('DEBUG: ClienteHome - Caminho de imagem nulo/vazio. Retornando fallback.');
            return "/fallback.png";
        }
        if (caminhoImagem.startsWith('http')) return caminhoImagem;
        const baseUrl = 'https://cufzswdymzevdeonjgan.supabase.co/storage/v1/object/public'; // Hardcoded base URL
        const fullUrl = `${baseUrl}/imagens/clientes/${encodeURIComponent(caminhoImagem)}`;
        console.log('DEBUG: ClienteHome - URL da imagem generada:', fullUrl);
        return fullUrl;
    };

    useEffect(() => {
        if (!showSearch) {
            setSearchTerm("");
        }
    }, [showSearch]);

    const handleAumentar = (id) => {
        console.log('DEBUG: ClienteHome - Aumentar quantidade para produto ID:', id);
        setQuantidades((prev) => ({
            ...prev,
            [id]: (prev[id] || 1) + 1,
        }));
    };

    const handleDiminuir = (id) => {
        console.log('DEBUG: ClienteHome - Diminuir quantidade para produto ID:', id);
        setQuantidades((prev) => ({
            ...prev,
            [id]: Math.max(1, (prev[id] || 1) - 1),
        }));
    };

    const handleAdicionar = async (produto) => {
        console.log('DEBUG: ClienteHome - Tentando adicionar produto ao carrinho:', produto.nome);

        // Impedir adição ao carrinho e mostrar aviso suave se a loja estiver fechada
        if (isLojaClosed) {
            setMensagem('Desculpe, a loja está fechada para pedidos no momento.');
            setCorMensagem('text-red-600');
            setTimeout(() => setMensagem(''), 5000); // Mensagem por 5 segundos
            return; // Impede a continuação da função
        }

        // Impedir adição ao carrinho se o produto estiver indisponível automaticamente (esgotado)
        if (produto.indisponivel_automatico) {
            setMensagem('Produto indisponível no momento.');
            setCorMensagem('text-red-600');
            setTimeout(() => setMensagem(''), 3000);
            return;
        }

        const id_cliente = cliente?.id;

        if (!id_cliente) {
            router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
            return;
        }

        try {
            const qtd = quantidades[produto.id] || 1;
            const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${site}/carrinho`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    produtoId: produto.id,
                    quantidade: qtd,
                    id_cliente,
                    lojaId: lojaId
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 400 && data.erro && data.erro.includes('estoque')) {
                    console.error('DEBUG: ClienteHome - Erro de estoque ao adicionar ao carrinho:', data.erro);
                    throw new Error(data.erro);
                }
                // Adicional: Lidar com erro 403 (loja fechada) caso o backend também retorne
                if (response.status === 403 && data.erro && data.erro.includes('fechada para pedidos')) {
                    console.error('DEBUG: ClienteHome - Loja fechada para pedidos (backend):', data.erro);
                    throw new Error(data.erro);
                }
                console.error('DEBUG: ClienteHome - Erro desconhecido ao adicionar ao carrinho:', data.erro || response.statusText);
                throw new Error(data.erro || 'Erro desconhecido ao adicionar ao carrinho');
            }

            setMensagem('Produto adicionado ao carrinho!');
            setCorMensagem('text-green-600');
        } catch (err) {
            setMensagem(`Erro: ${err.message}`);
            setCorMensagem('text-red-600');
        }

        setTimeout(() => setMensagem(''), 3000);
    };

    const handleLogout = async () => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientLogout`, {
                method: 'GET',
                credentials: 'include',
            });
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        } finally {
            location.reload();
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <header
                className="text-white px-4 py-3 flex items-center justify-between shadow relative z-20"
                style={{ backgroundColor: corPrimaria }}
            >
                {!showSearch && (
                    <div className="flex items-center gap-2">
                        <div className="relative w-10 h-10">
                            {/* Imagem da loja */}
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                <Image
                                    src={fotoLoja ? getImagemProduto(fotoLoja) : "/fallback.png"}
                                    alt="Logo da Loja"
                                    width={50}
                                    height={50}
                                    className="object-cover w-full h-full"
                                />
                            </div>

                            {/* Ícone decorativo sobre a imagem */}
                            {temaSelecionado?.iconeSobreLogo && (
                                <div
                                    className="absolute"
                                    style={{
                                        top: temaSelecionado.iconeEstilo?.top || '-8px',
                                        left: temaSelecionado.iconeEstilo?.left || '-8px',
                                        transform: temaSelecionado.iconeEstilo?.transform || 'none',
                                        width: temaSelecionado.iconeEstilo?.width || '24px',
                                        height: 'auto',
                                    }}
                                >
                                    <Image
                                        src={temaSelecionado.iconeSobreLogo}
                                        alt="Ícone do tema"
                                        width={0} // obrigatórios para o Next, mas serão ignorados com width via style
                                        height={0}
                                        sizes="100vw"
                                        style={{ width: '100%', height: 'auto' }}
                                    />
                                </div>
                            )}

                        </div>

                        <h1 className="text-lg font-bold">{nomeFantasia}</h1>
                    </div>
                )}
                {showSearch && (
                    <div className="flex items-center bg-white rounded-full px-3 py-1 w-full max-w-xl mx-auto shadow">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 mr-2"
                            fill={corPrimaria}
                            viewBox="0 0 24 24"
                            stroke="none"
                        >
                            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="O que você quer comprar hoje?"
                            className="flex-1 text-sm text-gray-800 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button onClick={() => setShowSearch(false)} className="text-gray-500 hover:text-red-600">
                            ✕
                        </button>
                    </div>
                )}
                {!showSearch && (
                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            onClick={() => setShowSearch(true)}
                            className="flex flex-col items-center cursor-pointer"
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-5 h-5"
                                    fill={corPrimaria}
                                    viewBox="0 0 24 24"
                                    stroke="none"
                                >
                                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                                </svg>
                            </div>
                            <span className="text-[10px] mt-1">Buscar</span>
                        </button>
                        <button
                            onClick={handleShareClick}
                            className="flex flex-col items-center cursor-pointer"
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-5 h-5"
                                    fill={corPrimaria}
                                    viewBox="0 0 24 24"
                                    stroke="none"
                                >
                                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                                </svg>
                            </div>
                            <span className="text-[10px] mt-1">Compartilhar</span>
                        </button>
                        {clienteLogado ? (
                            <Menu as="div" className="relative">
                                <Menu.Button className="flex flex-col items-center cursor-pointer">
                                    <div className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={corPrimaria} viewBox="0 0 24 24">
                                            <path d="M12 12c2.67 0 8 1.34 8 4v2H4v-2c0-2.66 5.33-4 8-4zm0-2a2 2 0 100-4 2 2 0 000 4z" />
                                        </svg>
                                    </div>
                                    <span className="text-[10px] mt-1">Conta</span>
                                </Menu.Button>
                                <Menu.Items className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-md z-50">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={() => router.push(`/cliente/cupons`)}
                                                className={`block px-4 py-2 w-full text-black text-left text-sm ${active ? 'bg-gray-100' : ''}`}
                                            >
                                                Meus Cupons
                                            </button>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={handleLogout}
                                                className={`block px-4 py-2 w-full text-left text-sm text-red-600 ${active ? 'bg-red-100' : ''}`}
                                            >
                                                Sair
                                            </button>
                                        )}
                                    </Menu.Item>
                                </Menu.Items>
                            </Menu>
                        ) : (
                            <button
                                onClick={() => router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`)}
                                className="flex flex-col items-center cursor-pointer"
                            >
                                <div className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={corPrimaria} viewBox="0 0 24 24">
                                        <path d="M12 12c2.67 0 8 1.34 8 4v2H4v-2c0-2.66 5.33-4 8-4zm0-2a2 2 0 100-4 2 2 0 000 4z" />
                                    </svg>
                                </div>
                                <span className="text-[10px] mt-1">Entrar</span>
                            </button>
                        )}
                        {ativarFidelidade && <PontosFidelidade clienteId={cliente?.id} />}
                    </div>
                )}
            </header>
            {bannerLoja ? (
                <div className="w-full h-48 relative">
                    <Image
                        src={`${getImagemProduto(bannerLoja)}?v=${new Date().getTime()}`}
                        alt="Banner da loja"
                        fill
                        unoptimized
                        style={{ objectFit: 'cover' }}
                        className="rounded-none"
                    />
                </div>
            ) : (
                <div
                    className="w-full h-48 flex items-center justify-between px-6 relative overflow-hidden"
                    style={{
                        background: `linear-gradient(to right, ${corSecundaria}, #1a202c)`,
                        backgroundImage: 'url("/bg-loja-padrao.svg")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="text-white z-10">
                        <h2 className="text-2xl font-bold">Seja Bem-Vindo (a)!</h2>
                        <p className="text-sm mt-1">Explore nosso catálogo e faça seu pedido online</p>
                    </div>
                    <div className="h-full flex items-center z-10">
                        <Image
                            src="/carrinho-banner.svg"
                            alt="Carrinho"
                            width={200}
                            height={200}
                            className="object-contain"
                        />
                    </div>

                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <Image
                            src="/bg-pattern.svg"
                            alt=""
                            fill
                            unoptimized
                            style={{ objectFit: 'cover' }}
                        />
                    </div>
                </div>

            )}

            {/* AQUI: Mudei a seção de Atendimento para exibir "Loja fechada no momento" */}
            {isLojaClosed ? (
                <div className="bg-red-50 border border-red-200 rounded-md mx-4 my-4 mt-3 px-3 py-2 flex items-center gap-2 text-sm text-red-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L12 12m-6.364-6.364l12.728 12.728" />
                    </svg>
                    <span className="font-bold">Loja fechada no momento.</span>
                </div>
            ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-md mx-4 my-4 mt-3 px-3 py-2 flex items-center gap-2 text-sm text-blue-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Atendimento: <strong>Segunda a Sexta, das 08h às 18h</strong>
                </div>
            )}

            <div className="flex-1 px-4 overflow-y-auto pb-24">
                {mensagem && (
                    <div className={`text-center mb-4 font-medium ${corMensagem}`}>
                        {mensagem}
                    </div>
                )}
                {/* O aviso de loja fechada na ClienteHome foi movido para a seção de atendimento acima. */}
                {/* Removido o bloco {isLojaClosed && (...) } que estava aqui */}

                {produtosFiltrados.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-x-6 gap-y-4">
                        {produtosFiltrados.map((produto) => (
                            <ProdutoCard
                                key={produto.id}
                                produto={produto}
                                quantidade={quantidades[produto.id] || 1}
                                onAumentar={() => handleAumentar(produto.id)}
                                onDiminuir={() => handleDiminuir(produto.id)}
                                onAdicionar={() => handleAdicionar(produto)}
                                getImagemProduto={getImagemProduto}
                                slug={site}
                                cor={corPrimaria}
                                // NOVO: Passar status de fechado da loja e indisponibilidade para o ProdutoCard
                                // isIndisponivel será TRUE se o produto estiver indisponível OU se a loja estiver fechada
                                isIndisponivel={produto.indisponivel_automatico || isLojaClosed}
                                isLojaClosed={isLojaClosed} // Passa o status da loja para o card, para estilo específico
                                statusEstoque={produto.status_estoque}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-600 mt-10 text-lg">
                        Nenhum produto disponível no momento.
                    </div>
                )}
            </div>
            <NavBar site={site} corPrimaria={corPrimaria} />
        </div>
    );
}

function PontosFidelidade({ clienteId }) {
    const [pontos, setPontos] = useState(0);
    const [nomeCliente, setNomeCliente] = useState('');

    useEffect(() => {
        fetchCliente();
    }, [clienteId]);

    async function fetchCliente() {
        const { data, error } = await supabase
            .from('clientes')
            .select('nome, total_pontos')
            .eq('id', clienteId)
            .single();

        if (!error && data) {
            setPontos(data.total_pontos || 0);
            setNomeCliente(data.nome || 'Cliente');
        }
    }

    async function resgatarPontos(pontosParaResgatar) {
        if (pontos < pontosParaResgatar) return;

        const { error } = await supabase
            .from('clientes')
            .update({ total_pontos: pontos - pontosParaResgatar })
            .eq('id', clienteId);

        if (!error) fetchCliente(); // Atualiza os pontos e nome após resgate
    }

    return (
        <div className="p-4 border rounded-lg bg-white shadow mb-4">
            <div className="text-black">Olá, <strong>{nomeCliente}</strong></div>
            <div className="text-black">Você tem <strong>{pontos}</strong> ponto{pontos === 1 ? '' : 's'}</div>
        </div>
    );
}