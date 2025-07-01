import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { verificarTipoDeLoja } from '../hooks/verificarTipoLoja'; // Verifique o caminho real para este hook

// Helper component para os itens de navegação
function NavItem({ icon, label, path, currentSlug, onClick, className }) {
    const router = useRouter();

    // A lógica robusta para construir o caminho completo e verificar se está ativo
    const isFullPathURL = path.startsWith('http://') || path.startsWith('https://');
    const targetPath = isFullPathURL ? path : (currentSlug ? `/empresa/${currentSlug}${path}` : path);
    
    // Verifica se a rota atual é exatamente a do item ou se o item é um prefixo da rota atual (para sub-rotas)
    // Ajustado para ser mais flexível com sub-rotas, mas ainda garantindo que não pegue paths muito curtos como prefixo.
    const isActive = router.asPath === targetPath || (router.asPath.startsWith(`${targetPath}/`) && targetPath.length > `/empresa/${currentSlug}`.length);
    
    const baseClasses = "flex items-center gap-2 p-2 w-full text-left cursor-pointer rounded transition-all duration-200";
    const hoverShadowClasses = 'hover-shadow-blue'; // Classe CSS para hover (se definida globalmente)
    const activeTextClass = isActive ? 'font-bold text-white' : 'font-normal text-white';

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className={`${baseClasses} ${activeTextClass} ${className || ''} ${hoverShadowClasses}`}
            >
                <Image src={icon} alt={label} width={20} height={20} className="flex-shrink-0" />
                <span>{label}</span>
            </button>
        );
    }

    return (
        <Link
            href={targetPath}
            className={`${baseClasses} ${activeTextClass} ${className || ''} ${hoverShadowClasses}`}
        >
            <Image src={icon} alt={label} width={20} height={20} className="flex-shrink-0" />
            <span>{label}</span>
        </Link>
    );
}

function LevelMedal({ level }) {
    let medalImage = null;
    let altText = "";

    switch (level) {
        case 'Bronze':
            medalImage = '/icons/medal_bronze.png';
            altText = 'Medalha de Bronze';
            break;
        case 'Prata':
            medalImage = '/icons/medal_silver.png';
            altText = 'Medalha de Prata';
            break;
        case 'Ouro':
            medalImage = '/icons/medal_gold.png';
            altText = 'Medalha de Ouro';
            break;
        default:
            return null;
    }

    return (
        <div className="flex items-center justify-center">
            <Image src={medalImage} alt={altText} width={30} height={30} />
        </div>
    );
}

export default function OwnerSidebar({ children, slug }) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [slugEmpresa, setSlugEmpresa] = useState(''); // Slug da loja, como prop

    // Estados relacionados aos dados da loja para o OwnerSidebar
    const [lojaData, setLojaData] = useState(null); // Dados completos da loja
    const [loadingLoja, setLoadingLoja] = useState(true); // Estado de carregamento da loja
    const [errorLoja, setErrorLoja] = useState(null); // Erro ao carregar loja
    const [isLojaClosed, setIsLojaClosed] = useState(false); // Status de aberto/fechado
    const [shopLevel, setShopLevel] = useState('Nenhum'); // Nível da loja (Bronze, Prata, Ouro)

    // Estados para o bloco de link e funcionalidades
    const [isClient, setIsClient] = useState(false); // Para lidar com hidratação
    const [showLinkBlock, setShowLinkBlock] = useState(true); // Visibilidade do bloco de link
    const [copied, setCopied] = useState(false); // Estado para o botão de copiar
    const [baseUrl, setBaseUrl] = useState(""); // Base URL para o link da Vercel

    // Estado para o slug da EMPRESA para o link "Outras Lojas"
    const [empresaSlugParaOutrasLojas, setEmpresaSlugParaOutrasLojas] = useState('');

    // Estado para o tipo de loja (do branch f1258a40daa811c58dd80c45475013cc0b312457)
    const [tipoLoja, setTipoLoja] = useState("");

    // Effect para lidar com a hidratação e carregar a visibilidade do localStorage
    useEffect(() => {
        setIsClient(true);

        if (typeof window !== 'undefined') {
            const savedVisibility = localStorage.getItem('linkBlockVisibility');
            if (savedVisibility !== null) {
                setShowLinkBlock(JSON.parse(savedVisibility));
            }
            setBaseUrl(`${window.location.protocol}//${window.location.host}`);
        }
    }, []); // Executa apenas uma vez na montagem do cliente

    // Effect para buscar detalhes da loja e da empresa
    useEffect(() => {
        if (!slug) {
            setLoadingLoja(false);
            return;
        }

        const getLojaDetails = async () => {
            setLoadingLoja(true);
            setErrorLoja(null);
            try {
                // Endpoint /loja/slug-completo/slugLoja retorna { loja, empresa }
                const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug-completo/${slug}`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    const { loja, empresa } = data; // Desestrutura para pegar dados da loja e da empresa

                    setLojaData(loja);
                    setSlugEmpresa(loja?.slug_loja || '');
                    setIsLojaClosed(loja?.is_closed_for_orders || false);
                    setShopLevel(loja?.level_tier || 'Nenhum'); // Pega o level_tier da loja
                    
                    // Armazena o slug da empresa (nome/site/slug_empresa) para o link "Outras Lojas"
                    // Use o campo correto do seu backend para o slug da EMPRESA
                    setEmpresaSlugParaOutrasLojas(empresa?.slug_empresa || empresa?.site || empresa?.nome || ''); 
                    
                    // Verifica o tipo de loja usando o hook (do branch f1258a40daa811c58dd80c45475013cc0b312457)
                    if (loja?.tipo_loja) { // Assumindo que tipo_loja vem da API
                         setTipoLoja(loja.tipo_loja);
                    } else {
                        // Fallback se tipo_loja não estiver na API, usa o hook
                        setTipoLoja(await verificarTipoDeLoja(slug));
                    }
                    
                    console.log("OwnerSidebar: Dados da loja e empresa obtidos com sucesso:", data);
                } else {
                    const errorData = await response.json();
                    console.error('OwnerSidebar: Falha ao obter dados da loja:', errorData.message || response.statusText);
                    setErrorLoja(errorData.message || `Erro ${response.status}: ${response.statusText}`);
                    setLojaData(null);
                    setSlugEmpresa('');
                    setIsLojaClosed(false);
                    setShopLevel('Nenhum');
                    setEmpresaSlugParaOutrasLojas('');
                    setTipoLoja("");
                }
            } catch (error) {
                console.error('OwnerSidebar: Erro ao buscar dados da loja:', error);
                setErrorLoja("Erro de conexão ao buscar dados da loja.");
                setLojaData(null);
                setSlugEmpresa('');
                setIsLojaClosed(false);
                setShopLevel('Nenhum');
                setEmpresaSlugParaOutrasLojas('');
                setTipoLoja("");
            } finally {
                setLoadingLoja(false);
            }
        };

        getLojaDetails();
    }, [slug]); // Dependência do 'slug' para re-executar quando ele muda

    // Effect para salvar a visibilidade do bloco de link no localStorage
    useEffect(() => {
        if (isClient && typeof window !== 'undefined') {
            localStorage.setItem('linkBlockVisibility', JSON.stringify(showLinkBlock));
        }
    }, [showLinkBlock, isClient]);

    const currentActiveSlug = slugEmpresa || slug; // Preferir o slug da loja se já carregado, senão usar o da URL

    const handleLogout = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                router.push('/empresa/LoginEmpresa');
            } else {
                const errorData = await response.json();
                alert(`Erro ao fazer logout: ${errorData.mensagem || 'Tente novamente.'}`);
            }
        } catch (error) {
            alert('Erro de conexão. Verifique sua rede e tente novamente.');
        }
    };

    const handleCopyClick = (textToCopy) => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    const handleToggleLojaStatus = async () => {
        const newStatus = !isLojaClosed; // Inverte o status atual
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${currentActiveSlug}/toggle-status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isClosed: newStatus }), // Envia o novo status para o backend
            });

            if (response.ok) {
                const data = await response.json();
                setIsLojaClosed(data.is_closed_for_orders); // Atualiza o estado com o status retornado pelo backend
            } else {
                const errorData = await response.json();
                alert(`Erro ao alternar status da loja: ${errorData.message || 'Tente novamente.'}`);
            }
        } catch (error) {
            alert('Erro de conexão. Verifique sua rede e tente novamente.');
        }
    };

    // Caminho da Área do Dono (Dashboard principal)
    const ownerAreaPath = `/empresa/${currentActiveSlug}/donoarea`;

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Header Mobile (visível apenas em telas pequenas) */}
            <div className="bg-[#3681B6] text-white flex items-center justify-between p-4 md:hidden">
                <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Logo" width={32} height={32} />
                    <span className="font-bold text-lg">BETO Amparo</span>
                </div>
                <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Sidebar (barra lateral principal) */}
            <aside className={`
                fixed md:static z-40 bg-[#3681B6] text-white w-64 min-h-screen p-4 flex flex-col justify-between
                transition-transform duration-300
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
            `}>
                <div className="sidebar-menu-area">
                    <div className="flex items-center mb-4">
                        <Image src="/logo.png" alt="Logo" width={40} height={40} className="mr-2" />
                        <div className="leading-tight text-lg">
                            <span className="font-bold">BETO</span>{' '}
                            <span className="font-normal">Amparo</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">

                        {/* Bloco do Nível da Loja */}
                        {lojaData && shopLevel && shopLevel !== 'Nenhum' && (
                            <div className="p-2 rounded-md bg-blue-700 text-white flex items-center justify-between shadow-md">
                                <div className="flex items-center gap-2">
                                    <LevelMedal level={shopLevel} />
                                    <span className="text-sm font-semibold">Nível {shopLevel}</span>
                                </div>
                                <Link href={`/empresa/${currentActiveSlug}/conquistas`} className="text-xs underline opacity-80 hover:opacity-100 transition-opacity">Ver mais</Link>
                            </div>
                        )}

                        {/* Bloco do link da loja (visível condicionalmente) */}
                        {isClient && showLinkBlock && (loadingLoja || errorLoja || lojaData) && (
                            <div className="mb-4 p-2 bg-white rounded-md text-[#3681B6] relative">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-sm font-semibold">Link da sua loja:</p>
                                    <button
                                        onClick={() => setShowLinkBlock(false)}
                                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full focus:outline-none cursor-pointer"
                                        title="Esconder link"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                </div>
                                {loadingLoja && <p className="text-xs">Carregando...</p>}
                                {errorLoja && <p className="text-xs text-red-500">{errorLoja}</p>}
                                {lojaData && (
                                    <>
                                        <p className="text-xs break-all text-[#3681B6]">
                                            {/* Usando baseUrl do estado para garantir o domínio Vercel correto */}
                                            {baseUrl}/loja/{lojaData.slug_loja}
                                        </p>
                                        <button
                                            onClick={() => handleCopyClick(`${baseUrl}/loja/${lojaData.slug_loja}`)}
                                            className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded text-white cursor-pointer"
                                        >
                                            {copied ? 'Copiado!' : 'Copiar'}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                        {/* Botão para mostrar o link da loja, se ele estiver escondido */}
                        {isClient && !showLinkBlock && (
                            <div className="flex justify-center mt-2">
                                <button
                                    onClick={() => setShowLinkBlock(true)}
                                    className="p-2 text-white flex items-center gap-2 hover-shadow-blue rounded transition-all duration-200 cursor-pointer text-center"
                                    title="Mostrar link da loja"
                                >
                                    Mostrar Link da Loja
                                </button>
                            </div>
                        )}

                        {/* Bloco de status da loja (aberta/fechada) */}
                        {lojaData && (
                            <div className={`mt-4 p-2 rounded-md text-white flex items-center justify-between ${isLojaClosed ? 'bg-gray-500' : 'bg-blue-700'}`}>
                                <span>Loja: {isLojaClosed ? 'Fechada' : 'Aberta'} para Pedidos</span>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={!isLojaClosed}
                                        onChange={handleToggleLojaStatus}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        )}

                        {/* Itens de Navegação da Sidebar */}
                        <Link
                            href={ownerAreaPath}
                            className="flex flex-col items-center gap-2 p-2 cursor-pointer text-center owner-area-sidebar-item hover-shadow-blue"
                        >
                            <Image src="/icons/store_white.svg" alt="Área do dono" width={40} height={40} />
                            <span className="font-semibold text-lg">Área do dono</span>
                        </Link>

                        <NavItem // Dashboard
                            icon="/icons/dashboard_white.svg"
                            label="Dashboard"
                            path="/dashboard"
                            currentSlug={currentActiveSlug}
                            className="sidebar-dashboard-item"
                        />

                        {/* Condicional para "Meus Produtos" baseado em tipoLoja */}
                        {tipoLoja !== "atendimento" && (
                            <NavItem
                                icon="/icons/add_white.svg"
                                label="Meus Produtos"
                                path="/produtos"
                                currentSlug={currentActiveSlug}
                                className="sidebar-produtos-item"
                            />
                        )}
                        
                        <NavItem icon="/icons/paint_white.svg" label="Personalizar Loja" path="/personalizacao" currentSlug={currentActiveSlug} className="sidebar-personalizar-item" />
                        <NavItem icon="/icons/clock_white.svg" label="Horarios" path="/horarioEmpresa" currentSlug={currentActiveSlug} className="sidebar-horarios-item" />
                        
                        {/* Condicional para "Meus Agendamentos" baseado em tipoLoja */}
                        {tipoLoja === "atendimento" && (
                            <NavItem icon="/icons/notes.png" label="Meus agendamentos" path="/meusAgendamentos" currentSlug={currentActiveSlug} className="sidebar-agendamentos-item" />
                        )}
                        
                        <NavItem icon="/icons/trophy_white.svg" label="Minhas Conquistas" path="/conquistas" currentSlug={currentActiveSlug} className="sidebar-conquistas-item" />

                        {/* Removido NavItem Suporte duplicado e mantido o do HEAD */}
                        <NavItem icon="/icons/help_white.svg" label="Suporte" path="/suporte" currentSlug={currentActiveSlug} className="sidebar-suporte-item" />

                        <NavItem 
                            icon="/icons/settings_white.svg"
                            label="Configurações" 
                            path="/configuracoes/"
                            currentSlug={currentActiveSlug} 
                            className="sidebar-configuracoes-item" 
                        />

                        {/* ITEM: Outras Lojas - Agora com o link correto para a Vercel */}
                        {empresaSlugParaOutrasLojas && (
                            <Link
                                href={`/${empresaSlugParaOutrasLojas}/lojas`} // Link para a página de donos: /ben/lojas
                                className="flex items-center gap-2 p-2 w-full text-left cursor-pointer rounded transition-all duration-200 font-normal text-white hover-shadow-blue"
                            >
                                <Image src="/icons/loja.png" alt="Outras Lojas" width={20} height={20} className="flex-shrink-0" />
                                <span>Outras Lojas</span>
                            </Link>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="bg-orange-400 hover:bg-orange-500 p-2 rounded text-white mt-4 w-full sidebar-logout-button"
                >
                    SAIR
                </button>
            </aside>

            <main className="flex-1 bg-gray-100 p-6 md:p-8">
                {children}
            </main>
        </div>
    );
}