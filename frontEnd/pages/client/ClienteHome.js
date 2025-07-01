// frontEnd/pages/client/ClienteHome.js

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import NavBar from "@/components/NavBar";
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import SecaoRecomendacoes from "@/components/SecaoRecomendacoes";
import SecaoCategoria from "@/components/SecaoCategoria";
import { verificarTipoDeLoja } from '../../hooks/verificarTipoLoja'; // Caminho para o hook
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY);

const diasSemanaMap = {
    0: 'domingo',
    1: 'segunda',
    2: 'terca',
    3: 'quarta',
    4: 'quinta',
    5: 'sexta',
    6: 'sabado',
};

export default function ClienteHome() {
    const router = useRouter();
    const { site, isReady } = router.query;

    const [clienteLogado, setClienteLogado] = useState(false);
    const [cliente, setCliente] = useState(null);
    const [rawRecomendacoes, setRawRecomendacoes] = useState([]);
    const [lojaId, setLojaId] = useState(null);
    const [nomeFantasia, setNomeFantasia] = useState("Carregando...");
    const [sloganLoja, setSloganLoja] = useState('');
    const [isLojaClosed, setIsLojaClosed] = useState(false);

    const [horariosLoja, setHorariosLoja] = useState(null);
    const [horarioExibicao, setHorarioExibicao] = useState("Verificando...");

    const [categorias, setCategorias] = useState([]);

    const [produtos, setProdutos] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [bannerLoja, setBannerLoja] = useState(null);
    const [ativarFidelidade, setAtivarFidelidade] = useState(false);

    // --- ESTADOS DO HEAD (Lojas e cores) ---
    const [fotoLoja, setFotoLoja] = useState(null);
    const [corPrimaria, setCorPrimaria] = useState("#3B82F6");
    const [corSecundaria, setCorSecundaria] = useState("#F3F4F6");

    const [outrasLojas, setOutrasLojas] = useState([]);
    const [idEmpresaAtual, setIdEmpresaAtual] = useState(null);
    const [mostrarOutrasLojasNoCliente, setMostrarOutrasLojasNoCliente] = useState(false);
    // --- FIM DOS ESTADOS DO HEAD ---

    // --- ESTADO DO BRANCH f1258a40daa811c58dd80c45475013cc0b312457 (tipoLoja) ---
    const [tipoLoja, setTipoLoja] = useState("");
    // --- FIM DO ESTADO DO BRANCH ---

    const removeAccents = (str) => {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    };

    // Removido 'produtosFiltrados' que estava no branch 'f1258a40daa811c58dd80c45475013cc0b312457'
    // pois 'produtosAgrupadosEFiltrados' já faz a filtragem e agrupamento de forma eficiente.
    // Manter ambos seria redundante e possivelmente causaria inconsistências.

    const [quantidades, setQuantidades] = useState({});
    const [mensagem, setMensagem] = useState('');
    const [corMensagem, setCorMensagem] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const produtosVisiveis = useMemo(() => {
        return produtos.filter((produto) => !produto.indisponivel_automatico);
    }, [produtos]);

    const produtosAgrupadosEFiltrados = useMemo(() => {
        const produtosFiltradosPorBusca = produtosVisiveis.filter((produto) =>
            removeAccents(produto.nome.toLowerCase()).includes(removeAccents(searchTerm.toLowerCase()))
        );

        const agrupados = produtosFiltradosPorBusca.reduce((acc, produto) => {
            const categoriaDoProduto = categorias.find(c => c.id === produto.categoria_id);
            const nomeCategoria = categoriaDoProduto ? categoriaDoProduto.nome : 'Outros';

            if (!acc[nomeCategoria]) {
                acc[nomeCategoria] = [];
            }
            acc[nomeCategoria].push(produto);
            return acc;
        }, {});
        const categoriasOrdenadas = categorias.map(c => c.nome);
        const resultadoOrdenado = {};

        for (const nomeCat of categoriasOrdenadas) {
            if (agrupados[nomeCat]) {
                resultadoOrdenado[nomeCat] = agrupados[nomeCat];
            }
        }
        if (agrupados['Outros']) {
            resultadoOrdenado['Outros'] = agrupados['Outros'];
        }

        return resultadoOrdenado;

    }, [searchTerm, produtosVisiveis, categorias]);

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
        if (!site) return;

        // --- Chamada a verificarTipoDeLoja do branch f1258a40daa811c58dd80c45475013cc0b312457 ---
        // É importante que essa chamada não bloqueie o fetchEmpresa principal.
        // Se `tipo_loja` já vier nos dados da loja, priorize. Senão, use o hook.
        // A melhor prática seria o `tipo_loja` vir junto com os dados da loja principal.
        async function fetchAndSetTipoLoja() {
            const tipo = await verificarTipoDeLoja(site);
            setTipoLoja(tipo);
        }
        fetchAndSetTipoLoja(); // Chama o hook para definir tipoLoja

        async function fetchEmpresa() {
            try {
                const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug/${site}`;
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
                console.log("DEBUG_LOJA_PRINCIPAL: Dados da loja principal ao carregar:", data);
                console.log("DEBUG_LOJA_PRINCIPAL: id_empresa recebido:", data.id_empresa);
                console.log("DEBUG_LOJA_PRINCIPAL: mostrar_outras_lojas recebido:", data.mostrar_outras_lojas);

                setLojaId(data.id);
                setNomeFantasia(data.nome_fantasia || "Sem nome fantasia");
                setFotoLoja(data.foto_loja || null); // Estado do HEAD
                setCorPrimaria(data.cor_primaria || "#3B82F6"); // Estado do HEAD
                setCorSecundaria(data.cor_secundaria || "#F3F4F6"); // Estado do HEAD
                setSloganLoja(data.slogan || '');
                setBannerLoja(data.banner || null);
                setIsLojaClosed(data.is_closed_for_orders || false);
                setAtivarFidelidade(data.ativarFidelidade || false);
                setHorariosLoja(data.horarios_funcionamento || null);
                setIdEmpresaAtual(data.id_empresa); // Estado do HEAD
                setMostrarOutrasLojasNoCliente(data.mostrar_outras_lojas || false); // Estado do HEAD
                // Se tipo_loja vier da API principal da loja, use-o
                if (data.tipo_loja) {
                    setTipoLoja(data.tipo_loja);
                }
                console.log("DEBUG_LOJA_PRINCIPAL: id_empresa:", data.id_empresa);
                console.log("DEBUG_LOJA_PRINCIPAL: mostrar_outras_lojas:", data.mostrar_outras_lojas);
            } catch (error) {
                console.error("DEBUG: ClienteHome - Erro na requisição ao buscar empresa:", error.message || error);
                setNomeFantasia("Erro ao carregar");
            }
        }

        fetchEmpresa();
    }, [site]);

    // Lógica para buscar OUTRAS LOJAS (Mantida intacta, crucial para a funcionalidade)
    useEffect(() => {
        console.log("DEBUG_OUTRAS_LOJAS: Verificando dependências para buscar outras lojas:");
        console.log("DEBUG_OUTRAS_LOJAS: idEmpresaAtual:", idEmpresaAtual);
        console.log("DEBUG_OUTRAS_LOJAS: site:", site);
        console.log("DEBUG_OUTRAS_LOJAS: mostrarOutrasLojasNoCliente:", mostrarOutrasLojasNoCliente);

        if (!idEmpresaAtual || !site || !mostrarOutrasLojasNoCliente) {
            console.log("DEBUG_OUTRAS_LOJAS: Condição para buscar outras lojas NÃO ATENDIDA.");
            setOutrasLojas([]); // Garante que o estado é limpo se a condição não for atendida
            return;
        }

        async function fetchOutrasLojas() {
            try {
                const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/outras-da-empresa?idEmpresa=${idEmpresaAtual}&currentLojaSlug=${site}`;
                console.log("DEBUG_OUTRAS_LOJAS: Fazendo requisição para:", url);
                const response = await fetch(url);

                if (!response.ok) {
                    console.error("DEBUG: ClienteHome - Erro ao buscar outras lojas:", response.status, response.statusText);
                    const errorData = await response.text();
                    console.error("DEBUG: ClienteHome - Resposta de erro:", errorData);
                    setOutrasLojas([]);
                    return;
                }

                const data = await response.json();
                console.log("DEBUG_OUTRAS_LOJAS: Resposta da API de outras lojas:", data);
                if (data && Array.isArray(data.lojas)) {
                    setOutrasLojas(data.lojas);
                } else {
                    setOutrasLojas([]);
                }

            } catch (error) {
                console.error("DEBUG: ClienteHome - Erro ao buscar outras lojas (catch):", error.message);
                setOutrasLojas([]);
            }
        }

        fetchOutrasLojas();
    }, [idEmpresaAtual, site, mostrarOutrasLojasNoCliente]); // Adicione mostrarOutrasLojasNoCliente como dependência

    // Lógica para buscar CATEGORIAS
    useEffect(() => {
        if (!lojaId) return;
        async function fetchCategorias() {
            try {
                const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/categorias/loja/${lojaId}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('Erro ao buscar categorias');
                const data = await response.json();
                setCategorias(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("DEBUG: Erro ao buscar categorias:", error.message);
                setCategorias([]);
            }
        }
        fetchCategorias();
    }, [lojaId]);

    // Lógica para buscar RECOMENDAÇÕES
    useEffect(() => {
        if (!isReady || !site) {
            return;
        }
        async function fetchRecomendacoes() {
            try {
                const clienteQuery = cliente?.id ? `?clienteId=${cliente.id}` : '';
                const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${site}/recomendacoes${clienteQuery}`;

                const response = await fetch(url);
                if (!response.ok) {
                    setRawRecomendacoes([]);
                    return;
                }

                const data = await response.json();

                if (Array.isArray(data)) {
                    setRawRecomendacoes(data);
                } else {
                    setRawRecomendacoes([]);
                }

            } catch (error) {
                setRawRecomendacoes([]);
            }
        }

        fetchRecomendacoes();
    }, [site, cliente, isReady]);

    const recomendacoesFiltradas = useMemo(() => {
        if (!rawRecomendacoes.length) {
            return [];
        }

        const produtosAtuaisIds = new Set(produtos.map(p => p.id));
        const resultadoFiltrado = rawRecomendacoes.filter(p => !produtosAtuaisIds.has(p.id));
        if (resultadoFiltrado.length === 0 && rawRecomendacoes.length > 0) {
            return rawRecomendacoes;
        }

        return resultadoFiltrado;

    }, [rawRecomendacoes, produtos]);

    // Lógica para buscar PRODUTOS
    useEffect(() => {
        if (!site) return;

        async function fetchProdutos() {
            try {
                const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/produtos/loja/${site}`;
                const response = await fetch(url);

                if (!response.ok) {
                    console.error("DEBUG: ClienteHome - Erro na resposta da API de produtos:", response.statusText);
                    setProdutos([]);
                    return;
                }

                const data = await response.json();

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

            } catch (error) {
                console.error("DEBUG: ClienteHome - Erro ao buscar produtos:", error.message);
                setProdutos([]);
            }
        }

        fetchProdutos();
    }, [site]);

    // Lógica para verificar horário de funcionamento
    useEffect(() => {
        const now = new Date();
        console.log('DEBUG_HORARIOS_DETALHES: Hora atual do cliente (local):', now.toLocaleString());
        console.log('DEBUG_HORARIOS_DETALHES: Dia da semana (num):', now.getDay());
        console.log('DEBUG_HORARIOS_DETALHES: Objeto horariosLoja (vindo do backend):', horariosLoja);

        const diaSemanaNum = now.getDay();
        const diaAtualKey = diasSemanaMap[diaSemanaNum];

        let lojaEstaAbertaAgoraCalculo = false;
        let mensagemHorarioTemporaria = 'Horário não configurado.';

        if (horariosLoja && horariosLoja[diaAtualKey]) {
            const horarioDoDia = horariosLoja[diaAtualKey];
            console.log('DEBUG_HORARIOS_DETALHES: Horário do dia (do backend, para o dia atual):', horarioDoDia);

            if (horarioDoDia.aberto) {
                const [startHour, startMinute] = horarioDoDia.inicio.split(':').map(Number);
                const [endHour, endMinute] = horarioDoDia.fim.split(':').map(Number);

                const nowHours = now.getHours();
                const nowMinutes = now.getMinutes();

                const startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMinute);
                let endDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, endMinute);

                console.log('DEBUG_HORARIOS_DETALHES: startHour:', startHour, 'startMinute:', startMinute);
                console.log('DEBUG_HORARIOS_DETALHES: endHour:', endHour, 'endMinute:', endMinute);
                console.log('DEBUG_HORARIOS_DETALHES: nowHours:', nowHours, 'nowMinutes:', nowMinutes);

                if (endDateTime.getTime() < startDateTime.getTime()) {
                    endDateTime.setDate(endDateTime.getDate() + 1);
                    console.log('DEBUG_HORARIOS_DETALHES: Horário de fim ajustado para o dia seguinte:', endDateTime.toLocaleString());
                }

                const currentDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), nowHours, nowMinutes);

                console.log('DEBUG_HORARIOS_DETALHES: startDateTime (calculada):', startDateTime.toLocaleString());
                console.log('DEBUG_HORARIOS_DETALHES: endDateTime (calculada):', endDateTime.toLocaleString());
                console.log('DEBUG_HORARIOS_DETALHES: currentDateTime (calculada):', currentDateTime.toLocaleString());

                const condition1 = endDateTime.getTime() < startDateTime.getTime() && currentDateTime.getTime() < startDateTime.getTime();
                const condition2 = currentDateTime.getTime() >= startDateTime.getTime() && currentDateTime.getTime() < endDateTime.getTime();

                console.log('DEBUG_HORARIOS_DETALHES: Condição noturna (end<start && current<start):', condition1);
                if (condition1) {
                    const prevDayStartDateTime = new Date(startDateTime);
                    prevDayStartDateTime.setDate(prevDayStartDateTime.getDate() - 1);
                    console.log('DEBUG_HORARIOS_DETALHES: Sub-condição noturna (current>=prevStart || current<end):', (currentDateTime.getTime() >= prevDayStartDateTime.getTime() || currentDateTime.getTime() < endDateTime.getTime()));
                }
                console.log('DEBUG_HORARIOS_DETALHES: Condição mesmo dia (current>=start && current<end):', condition2);

                if (condition1) {
                    const prevDayStartDateTime = new Date(startDateTime);
                    prevDayStartDateTime.setDate(prevDayStartDateTime.getDate() - 1);

                    if (currentDateTime.getTime() >= prevDayStartDateTime.getTime() || currentDateTime.getTime() < endDateTime.getTime()) {
                        lojaEstaAbertaAgoraCalculo = true;
                    }
                } else if (condition2) {
                    lojaEstaAbertaAgoraCalculo = true;
                }

                console.log('DEBUG_HORARIOS_DETALHES: lojaEstaAbertaAgoraCalculo APÓS cálculo:', lojaEstaAbertaAgoraCalculo);

                mensagemHorarioTemporaria = `${horarioDoDia.inicio} às ${horarioDoDia.fim}`;
                if (lojaEstaAbertaAgoraCalculo) {
                    mensagemHorarioTemporaria = `Aberto agora! Fecha às ${horarioDoDia.fim}`;
                } else {
                    mensagemHorarioTemporaria = `Fechado. Abre às ${horarioDoDia.inicio}`;
                }

            } else {
                mensagemHorarioTemporaria = 'Fechado hoje.';
            }
        } else {
            mensagemHorarioTemporaria = 'Horário não disponível.';
        }

        console.log('DEBUG_HORARIOS_DETALHES: Status final isLojaClosed (ANTES da atualização de estado):', !lojaEstaAbertaAgoraCalculo);
        console.log('DEBUG_HORARIOS_DETALHES: Mensagem final (ANTES da atualização de estado):', mensagemHorarioTemporaria);

        // A loja está fechada se (isLojaClosed vindo do BD for true) OU (o cálculo local der false)
        setIsLojaClosed(prevIsLojaClosed => prevIsLojaClosed || !lojaEstaAbertaAgoraCalculo);
        setHorarioExibicao(mensagemHorarioTemporaria);

    }, [horariosLoja, isLojaClosed]); // isLojaClosed adicionado como dependência para refletir o status do BD

    const handleShareClick = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Compartilhe este link",
                    url: window.location.href,
                });
            } catch (error) {
                console.error("DEBUG: ClienteHome - Erro ao compartilhar nativamente:", error);
            }
        } else {
            const url = window.location.href;
            const text = encodeURIComponent("Confira esse conteúdo:");
            const shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
            window.open(shareUrl, "_blank");
        }
    };

    const getImagemProduto = (caminhoImagem) => {
        if (!caminhoImagem) {
            return "/fallback.png";
        }
        if (caminhoImagem.startsWith('http')) return caminhoImagem;
        const baseUrl = 'https://cufzswdymzevdeonjgan.supabase.co/storage/v1/object/public';
        const fullUrl = `${baseUrl}/imagens/clientes/${encodeURIComponent(caminhoImagem)}`; // OU /lojas/ ou outro bucket
        return fullUrl;
    };

    useEffect(() => {
        if (!showSearch) {
            setSearchTerm("");
        }
    }, [showSearch]);

    const handleAumentar = (id) => {
        setQuantidades((prev) => ({
            ...prev,
            [id]: (prev[id] || 1) + 1,
        }));
    };

    const handleDiminuir = (id) => {
        setQuantidades((prev) => ({
            ...prev,
            [id]: Math.max(1, (prev[id] || 1) - 1),
        }));
    };

    const handleAdicionar = async (produto) => {
        console.log('DEBUG: ClienteHome - Tentando adicionar produto ao carrinho:', produto.nome);

        if (isLojaClosed) {
            setMensagem('Desculpe, a loja está fechada para pedidos no momento.');
            setCorMensagem('text-red-600');
            setTimeout(() => setMensagem(''), 5000);
            return;
        }

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
                credentials: 'include',
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

    const getTextColorForBackground = (bgColor) => {
        const hexToRgb = (hex) => {
            const bigint = parseInt(hex.slice(1), 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return [r, g, b];
        };

        const rgb = hexToRgb(bgColor);
        const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <header
                className="text-white px-4 py-3 flex items-center justify-between shadow relative z-20"
                style={{ backgroundColor: corPrimaria }}
            >
                {!showSearch && (
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                            <Image
                                src={fotoLoja ? getImagemProduto(fotoLoja) : "/fallback.png"}
                                alt="Logo da Loja"
                                width={50}
                                height={50}
                                unoptimized
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold">{nomeFantasia}</h1>
                            {sloganLoja && (
                                <p className="text-xs" style={{ color: getTextColorForBackground(corPrimaria) }}>
                                    {sloganLoja}
                                </p>
                            )}
                        </div>
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
                                <Menu.Items className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 focus:outline-none overflow-hidden">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <Link
                                                href={`/loja/${site}/minha-conta`}
                                                className={`block px-4 py-2 text-sm w-full text-left text-gray-700 ${active ? 'bg-gray-100' : ''}`}
                                            >
                                                Minha Conta
                                            </Link>
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
                        {ativarFidelidade && clienteLogado && <PontosFidelidade clienteId={cliente?.id} />}
                    </div>
                )}
            </header>
            {bannerLoja ? (
            <div className="w-full h-48 relative rounded-t-lg overflow-hidden mb-2">
            {bannerLoja && (
                <Image
                src={`${getImagemProduto(bannerLoja)}?v=${new Date().getTime()}`}
                alt="Banner da loja"
                fill
                unoptimized
                style={{ objectFit: 'cover' }}
                className="rounded-t-lg"
                />
            )}
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
                        {sloganLoja && <p className="text-sm mt-1">{sloganLoja}</p>}
                        {!sloganLoja && <p className="text-sm mt-1">Explore nosso catálogo e faça seu pedido online</p>}
                    </div>
                    <div className="h-full flex items-center z-10">
                        <Image
                            src="/carrinho-banner.svg"
                            alt="Carrinho"
                            width={200}
                            height={200}
                            unoptimized
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

            {isLojaClosed ? (
                <div className="bg-red-50 border border-red-200 rounded-md mx-4 my-4 mt-3 px-3 py-2 flex items-center gap-2 text-sm text-red-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L12 12m-6.364-6.364l12.728 12.728" />
                    </svg>
                    <span className="font-bold">Loja fechada no momento.</span> {horarioExibicao && `(${horarioExibicao})`}
                </div>
            ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-md mx-4 my-4 mt-3 px-3 py-2 flex items-center gap-2 text-sm text-blue-800"
                    style={{ backgroundColor: corSecundaria }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        style={{ color: getTextColorForBackground(corSecundaria) }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span style={{ color: getTextColorForBackground(corSecundaria) }}>Atendimento: <strong>{horarioExibicao}</strong></span>
                </div>
            )}

            { tipoLoja !== 'atendimento' && (
                <div className="flex-1 px-4 overflow-y-auto pb-24">
                    {mensagem && (
                        <div className={`text-center mb-4 font-medium ${corMensagem}`}>
                            {mensagem}
                        </div>
                    )}

                    {recomendacoesFiltradas.length > 0 && !searchTerm && (
                        <SecaoRecomendacoes
                            titulo="Você pode gostar"
                            produtos={recomendacoesFiltradas}
                            slug={site}
                            corPrimaria={corPrimaria}
                            onAdicionar={handleAdicionar}
                            getImagemProduto={getImagemProduto}
                            isLojaClosed={isLojaClosed}
                            quantidades={quantidades}
                        />
                    )}
                    {Object.keys(produtosAgrupadosEFiltrados).length > 0 ? (
                        <div>
                            {Object.entries(produtosAgrupadosEFiltrados).map(([nomeCategoria, produtosDaCategoria]) => (
                                <SecaoCategoria
                                    key={nomeCategoria}
                                    nomeCategoria={nomeCategoria}
                                    produtosDaCategoria={produtosDaCategoria}
                                    slug={site}
                                    corPrimaria={corPrimaria}
                                    onAdicionar={handleAdicionar}
                                    getImagemProduto={getImagemProduto}
                                    isLojaClosed={isLojaClosed}
                                    quantidades={quantidades}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-600 mt-10 text-lg">
                            {searchTerm
                                ? `Nenhum produto encontrado para "${searchTerm}".`
                                : "Nenhum produto disponível no momento."
                            }
                        </div>
                    )}

                    {outrasLojas.length > 0 && (
                        <div className="mt-8 mb-4">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                                Veja também estas lojas da mesma empresa:
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {outrasLojas.map((loja) => (
                                    <Link key={loja.slug_loja} href={`/loja/${loja.slug_loja}`} passHref>
                                        <div className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4 cursor-pointer hover:shadow-lg transition-shadow">
                                            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={loja.foto_loja ? getImagemProduto(loja.foto_loja) : "/fallback.png"}
                                                    alt={loja.nome_fantasia || "Loja"}
                                                    width={64}
                                                    height={64}
                                                    unoptimized
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg text-gray-900">{loja.nome_fantasia}</h3>
                                                <p className="text-sm text-gray-600">Ir para a loja</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {site && (
                <Link
                    href={`/loja/${site}/ajuda`}
                    className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform transform hover:scale-110 z-30"
                    style={{ backgroundColor: corPrimaria }}
                    aria-label="Ajuda e Suporte"
                >
                    <QuestionMarkCircleIcon className="w-8 h-8 text-white" />
                </Link>
            )}
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

        if (!error) fetchCliente();
    }

    return (
        <div className="p-4 border rounded-lg bg-white shadow mb-4">
            {/* Adicionando text-sm para o tamanho da fonte */}
            <div className="text-black text-sm">Olá, <strong>{nomeCliente}</strong></div> 
            {/* Adicionando text-sm para o tamanho da fonte */}
            <div className="text-black text-sm">Você tem <strong>{pontos}</strong> ponto{pontos === 1 ? '' : 's'}</div>
        </div>
    )
}