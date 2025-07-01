import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import OwnerSidebar from '@/components/OwnerSidebar';
import ProductTour from '@/components/ProductTour';
import { FaTrashAlt, FaBuilding, FaArrowRight } from 'react-icons/fa'; // Combined FaTrashAlt and added FaBuilding, FaArrowRight

import FloatingNotificationsTop from '@/components/notification';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import toast from 'react-hot-toast';
import Link from 'next/link';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY);

const donoAreaTourSteps = [
    {
        target: '.welcome-message',
        content: 'Bem-vindo(a) à sua Área do Dono! Este é o seu painel principal, onde você controla sua loja.',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '.loja-link-card',
        content: 'Este é o link público da sua loja! Compartilhe-o com seus clientes para que eles possam acessar seus produtos e serviços.',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '.copy-link-button',
        content: 'Clique aqui para copiar o link direto da sua loja.',
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '.resumo-geral-card',
        content: 'Esta seção mostra um resumo rápido do desempenho da sua loja, incluindo produtos ativos, novos pedidos e notificações.',
        placement: 'top',
        disableBeacon: true,
    },
    {
        target: '.add-products-action-card',
        content: 'Comece a vender! Clique neste card para adicionar novos produtos à sua loja.',
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '.sidebar-dashboard-item', // Classe que adicionaremos ao item Dashboard na sidebar
        content: 'Este é o item "Dashboard" na sua barra lateral. Ele te leva para a página de gráficos, controle de estoque e histórico de pedidos da sua loja.',
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '.sidebar-produtos-item', // Classe que adicionaremos ao item Meus Produtos na sidebar
        content: 'Acesse e gerencie todos os seus produtos cadastrados por aqui.',
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '.sidebar-personalizar-item', // Classe que adicionaremos ao item Personalizar Loja na sidebar
        content: 'Mude as cores, o slogan e a foto da sua loja a qualquer momento.',
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '.sidebar-horarios-item', // Classe para "Horarios"
        content: 'Defina os horários de funcionamento da sua loja e a disponibilidade para agendamentos.',
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '.sidebar-agendamentos-item', // Classe para "Meus agendamentos"
        content: 'Acompanhe todos os agendamentos feitos pelos seus clientes aqui.',
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '.sidebar-suporte-item', // Classe para "Suporte"
        content: 'Se precisar de ajuda ou tiver alguma dúvida, clique aqui para falar com nosso suporte.',
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '.sidebar-logout-button',
        content: 'Para encerrar sua sessão, clique no botão SAIR.',
        placement: 'right',
        disableBeacon: true,
    },
];
// --- Fim da Definição dos passos do Tour ---


export default function OwnerDono() {
    const router = useRouter();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [donoData, setDonoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [baseUrl, setBaseUrl] = useState('');
    const [metrics, setMetrics] = useState({
        novosPedidos: null,
        pedidosFinalizados: null,
        notificacoes: null,
    });
    const [valorPonto, setValorPonto] = useState('');
    const [ativo, setAtivo] = useState(false);
    const [saving, setSaving] = useState(false);
    const [open, setOpen] = useState(false);

    const [openCupons, setOpenCupons] = useState(false);
    const [cupons, setCupons] = useState([]);
    const [loadingCupons, setLoadingCupons] = useState(false);

    const [openCadastrarCupom, setOpenCadastrarCupom] = useState(false);
    const [nomeCupom, setNomeCupom] = useState('');
    const [valorCupom, setValorCupom] = useState('');
    const [salvandoCupom, setSalvandoCupom] = useState(false);


    const [runDonoAreaTour, setRunDonoAreaTour] = useState(false); // Novo estado para o tour da Área do Dono

    useEffect(() => {
        setBaseUrl(window.location.origin);
        if (!router.isReady) {
            return;
        }

        const { slug } = router.query;
        if (!slug) {
            setLoading(false);
            setError("Não foi possível identificar a loja. O slug não está presente na URL.");
            return;
        }
        async function fetchDonoArea() {
            setError(null);
            setLoading(true);

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/dono/${slug}`, {
                    credentials: 'include',
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    if (res.status === 401) {
                        toast.error(errorData.error || 'Sessão expirada. Faça o login novamente.');
                        router.push('/loginEmpresa');
                        return; // Retorna para não continuar a execução
                    }
                    if (res.status === 403) {
                        throw new Error(errorData.detail || 'Você não tem permissão para acessar esta página.');
                    }
                    throw new Error(errorData.error || errorData.message || 'Ocorreu um erro ao carregar os dados.');
                }

                const data = await res.json();
                setDonoData(data);
                setMetrics({
                    novosPedidos: data?.novosPedidos ?? 0,
                    pedidosFinalizados: data?.pedidosFinalizados ?? 0,
                    notificacoes: data?.notificacoes ?? 0,
                });

                const shouldStartDonoAreaTour = localStorage.getItem('startDonoAreaTour');
                if (shouldStartDonoAreaTour === 'true') {
                    localStorage.removeItem('startDonoAreaTour'); // Limpa a flag
                    const hasSeenDonoAreaTour = localStorage.getItem('hasSeenDonoAreaTour'); // Verifica se já viu o tour da Área do Dono
                    if (!hasSeenDonoAreaTour) { // Só inicia se não viu
                        setRunDonoAreaTour(true); // Inicia o tour da Área do Dono
                    }
                }
            } catch (err) {
                console.error("Erro na requisição fetchDonoArea:", err);
                setError(err.message);
            } finally {
                // Este bloco será executado sempre, garantindo que o loading termine.
                setLoading(false);
            }
        }

        fetchDonoArea();

    }, [router.isReady, router.query.slug]);


    async function salvarConfiguracao() {
        if (!donoData?.loja?.id) return;

        setSaving(true);
        const { error } = await supabase
        .from("loja")
        .update({
            valorPonto: valorPonto || null,
            ativarFidelidade: ativo,
        })
        .eq("id", donoData.loja.id);

        if (error) {
        console.error(error);
        toast.error("Erro ao salvar configuração.");
        } else {
        toast.success("Configuração salva com sucesso!");
        setOpen(false);
        }
        setSaving(false);
    }

    async function buscarCupons() {
        if (!donoData?.loja?.id) return;
        setLoadingCupons(true);

        const { data, error } = await supabase
            .from('cupons')
            .select('*')
            .eq('id_loja', donoData.loja.id);

        if (error) {
            console.error('Erro ao buscar cupons:', error);
            toast.error('Erro ao buscar cupons.');
        } else {
            setCupons(data);
        }

        setLoadingCupons(false);
    }

    async function salvarCupom() {
        if (!donoData?.loja?.id) {
            toast.error("Loja não encontrada.");
            return;
        }

        if (!nomeCupom.trim() || !valorCupom) {
            toast.error("Preencha todos os campos.");
            return;
        }

        setSalvandoCupom(true);

        const { error } = await supabase
            .from('cupons')
            .insert([{
                nome: nomeCupom,
                valor: parseFloat(valorCupom),
                id_loja: donoData.loja.id
            }]);

        if (error) {
            console.error(error);
            toast.error("Erro ao salvar cupom.");
        } else {
            toast.success("Cupom salvo com sucesso!");
            setNomeCupom('');
            setValorCupom('');
            setOpenCupons(false);
        }

        setSalvandoCupom(false);
    }

    async function excluirCupom(id) {
        const confirmar = window.confirm('Tem certeza que deseja excluir este cupom?');

        if (!confirmar) return;

        const { error } = await supabase
            .from('cupons')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao excluir cupom:', error);
            toast.error('Erro ao excluir cupom.');
        } else {
            setCupons(cupons.filter(c => c.id !== id));
            toast.success('Cupom excluído com sucesso.');
        }
    }


    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-700 text-lg">Carregando...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h2>
                    <p className="text-gray-700 text-lg">{error}</p>
                    <button
                        onClick={() => router.push('/')} // Botão para voltar para a home ou outra página
                        className="mt-6 bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition"
                    >
                        Voltar para a Home
                    </button>
                </div>
            </div>
        );
    }

    if (!donoData || !donoData.empresa || !donoData.loja || !donoData.produtos) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-red-600 text-lg">Erro ao carregar os dados da empresa ou da loja. Por favor, tente novamente.</p>
            </div>
        );
    }

    return (
        <OwnerSidebar slug={donoData.loja.slug_loja}>
            <FloatingNotificationsTop />

            <h1 className="text-2xl font-bold text-gray-600 mb-6 text-center welcome-message">
                Bem-vindo(a) de volta, {donoData.empresa.nome}!
            </h1>

            <div className="mt-4 w-full max-w-3xl mx-auto mb-6 loja-link-card">
                <label className="block text-gray-800 text-sm mb-1 font-bold">Link da sua loja:</label>
                <div className="flex items-center bg-white rounded shadow p-2">
                    <input
                    type="text"
                    readOnly
                    value={baseUrl ? `${baseUrl}/loja/${donoData.loja.slug_loja}` : 'Carregando link...'}
                    className="flex-1 outline-none bg-transparent text-sm text-gray-600"
                    />
                    <button
                    onClick={() => {
                        if (baseUrl) {
                            // Abre o link em uma nova aba
                            window.open(`${baseUrl}/loja/${donoData.loja.slug_loja}`, '_blank');
                        }
                    }}
                    className="ml-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded copy-link-button"
                    >
                    Copiar
                    </button>
                </div>
            </div>

            <div className="bg-white rounded shadow p-6 w-full max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 resumo-geral-card">
                <div className="col-span-2 md:col-span-4">
                    <h2 className="text-lg font-semibold text-gray-600 mb-1">Resumo geral:</h2>
                </div>
                <InfoCard value={donoData.produtosAtivos} sub="produtos ativos" />
                <InfoCard value={metrics.novosPedidos} sub="novos pedidos" />
                <InfoCard value={metrics.pedidosFinalizados} sub="pedidos finalizados" />
                <InfoCard value="3" sub="notificações" />
                {/* NOVO: Usando o LiveActionCard para "Ver Pedidos em Tempo Real" */}
                <LiveActionCard
                    icon="/icons/ver-pedidos.svg"
                    label="Pedidos Agora" // Texto alterado
                    path={`/empresa/${donoData.loja.slug_loja}/pedidos-dono`}
                    className="view-realtime-orders-action-card"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
                <div className="grid grid-cols-2 gap-4">
                    <ActionCard icon="/icons/add2.svg" label="Adicionar Produtos" path={`/empresa/${donoData.loja.slug_loja}/AdicionarProduto`} className="add-products-action-card" />
                    <ActionCard icon="/icons/notification.svg" label="Notificações" path={`/empresa/${donoData.loja.slug_loja}/notificacoes`} className="notifications-action-card" />
                    <ActionCard icon="/icons/paint_gray.svg" label="Personalizar Loja" path={`/empresa/${donoData.loja.slug_loja}/personalizacao`} className="personalize-store-action-card" />
                    <ActionCard icon="/icons/store_gray.svg" label="Ver Loja" path={`${window.location.origin}/loja/${donoData.loja.slug_loja}`} className="view-store-action-card" />
                </div>
                <div className="bg-white rounded shadow p-4 flex flex-col gap-4">
                    <div className="text-sm font-semibold text-gray-600 border-b pb-1">Benefícios para Clientes</div>
                    <ActionCard icon="/icons/loyalty.svg" label="Configurar Fidelidade" onClick={() => setOpen(true)} className="loyalty-config-action-card" />
                    <ActionCard icon="/icons/coupon.svg" label="Meus Cupons" onClick={() =>{setOpenCupons(true); buscarCupons();}} className="loyalty-config-action-card" />
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-[#3681b6] text-white">
                    <DialogHeader>
                        <DialogTitle>Configurar Programa de Fidelidade</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mt-2">
                        <div className="flex items-center justify-between">
                            <span>Ativar Programa</span>
                            <Switch className="bg-white data-[state=checked]:bg-white" checked={ativo} onCheckedChange={setAtivo} />
                        </div>
                        <div>
                            <label className="flex items-center justify-between">Valor do Ponto</label>
                            <label className="block text-sm font-medium text-gray-700">A cada R$20,00 adquire 1 ponto</label>
                            <Input
                                type="number"
                                value={valorPonto}
                                onChange={(e) => setValorPonto(e.target.value)}
                                className="text-white bg-[#3681b6] border-white focus-visible:ring-white"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)}
                            className="bg-white text-[#3681b6] hover:bg-gray-200"
                            >Cancelar</Button>
                        <Button onClick={salvarConfiguracao} disabled={saving}
                            className="bg-white text-[#3681b6] hover:bg-gray-200">
                            {saving ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={openCupons} onOpenChange={setOpenCupons}>
                <DialogContent className="bg-white text-black max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Cupons da Loja</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 max-h-80 overflow-y-auto">
                        {loadingCupons ? (
                            <p>Carregando cupons...</p>
                        ) : cupons.length === 0 ? (
                            <p className="text-gray-600">Nenhum cupom cadastrado.</p>
                        ) : (
                            cupons.map((cupom) => (
                                <div
                                    key={cupom.id}
                                    className="flex justify-between items-center border rounded p-2"
                                >
                                    <div>
                                        <span className="font-medium">{cupom.nome}</span>
                                        <span className="ml-4 text-blue-600 font-semibold">
                                            R$ {cupom.valor.toFixed(2)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => excluirCupom(cupom.id)}
                                        className="text-red-500 hover:text-red-700"
                                        title="Excluir cupom"
                                    >
                                        <FaTrashAlt size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>


                    <DialogFooter className="flex justify-between">
                        <Button
                            onClick={() => setOpenCadastrarCupom(true)}
                            className="bg-[#3681b6] text-white hover:bg-blue-700"
                        >
                            Cadastrar Cupom
                        </Button>
                        <Button
                            onClick={() => setOpenCupons(false)} // Adicionado botão para fechar a lista de cupons
                            className="bg-gray-300 text-black hover:bg-gray-400"
                        >
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={openCadastrarCupom} onOpenChange={setOpenCadastrarCupom}>
                <DialogContent className="bg-white text-black max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Cadastrar Cupom</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mt-2">
                        <div>
                            <label className="block text-sm mb-1">Nome do Cupom</label>
                            <Input
                                type="text"
                                value={nomeCupom}
                                onChange={(e) => setNomeCupom(e.target.value)}
                                placeholder="Ex: desconto10"
                                className="ml-4 text-blue-600 font-semibold"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Valor do Cupom (%)</label>
                            <Input
                                type="number"
                                value={valorCupom}
                                onChange={(e) => setValorCupom(e.target.value)}
                                placeholder="Ex: 10"
                                className="ml-4 text-blue-600 font-semibold"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={salvarCupom}
                            disabled={salvandoCupom}
                            className="bg-[#3681b6] text-white hover:bg-blue-700"
                        >
                            {salvandoCupom ? "Salvando..." : "Salvar"}
                        </Button>
                        <Button
                            onClick={() => setOpenCadastrarCupom(false)}
                            className="bg-gray-300 text-black hover:bg-gray-400"
                        >
                            Cancelar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <ProductTour steps={donoAreaTourSteps} tourKey="DonoArea" />

        </OwnerSidebar>
    );

}

// COMPONENTE: LiveActionCard (Modificado)
function LiveActionCard({ icon, label, path, onClick, className }) {
    const router = useRouter();

    // Adiciona classes para o destaque e a animação do "ao vivo"
    const classes = `
        bg-red-600 text-white p-4 rounded shadow flex items-center gap-4 cursor-pointer
        hover:bg-red-700 transition-colors duration-200 relative
        ${className || ''}
    `;

    return (
        <div
            onClick={() => {
                if (onClick) return onClick();
                if (path) router.push(path);
            }}
            className={classes}
        >
            {/* O ícone é renderizado sem o quadrado, diretamente pela imagem */}
            <Image src={icon} alt={label} width={24} height={24} className="filter invert brightness-0 saturate-100 hue-rotate-180" />
            <span className="text-lg font-semibold">{label}</span>
            {/* Bolinha de "ao vivo" - Ajustada para ser mais perceptível */}
            <span className="absolute top-2 right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span> {/* Cor mais clara para o "ping" */}
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-400"></span> {/* Cor um pouco mais clara para a bolinha */}
            </span>
        </div>
    );
}


function InfoCard({ value, sub }) {
    return (
        <div className="bg-gray-100 p-4 rounded shadow text-center">
            <div className="text-3xl font-bold text-gray-800">
                {value === null || value === undefined ? '-' : value}
            </div>
            <div className="text-sm text-gray-500">{sub}</div>
        </div>
    );
}

function ActionCard({ icon, label, path, onClick, noBg = false, className }) {
    const router = useRouter();
    const classes = `
        ${noBg ? 'bg-white' : 'bg-white'}
        p-4 rounded shadow flex items-center gap-4 hover:bg-gray-100 cursor-pointer text-gray-500
        ${className || ''}
    `;
    return (
        <div
            onClick={() => {
                if (onClick) return onClick();
                if (path) router.push(path);
            }}
            className={classes}
        >
            <Image src={icon} alt={label} width={24} height={24} />
            <span className="text-lg font-semibold">{label}</span>
        </div>
    );
}

function NavItem({ icon, label, path, currentSlug, onClick, className }) {
    const router = useRouter();
    // Verifica se path é uma URL completa ou uma rota relativa
    const isFullPath = path.startsWith('http://') || path.startsWith('https://');
    const targetPath = isFullPath ? path : (currentSlug ? `/empresa/${currentSlug}${path}` : path);

    // Determina a classe ativa para o item de navegação
    // Use router.asPath para verificar se a rota atual começa com o fullPath, para sub-rotas
    const isActive = router.asPath.startsWith(targetPath);

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className={`flex items-center gap-2 p-2 w-full text-left hover:bg-blue-700 cursor-pointer rounded
                    ${isActive ? 'bg-blue-700' : ''} ${className || ''}`
                }
            >
                <Image src={icon} alt={label} width={20} height={20} className="flex-shrink-0" />
                <span>{label}</span>
            </button>
        );
    }

    return (
        <Link
            href={targetPath}
            className={`flex items-center gap-2 p-2 hover:bg-blue-700 cursor-pointer rounded
                ${isActive ? 'bg-blue-700' : ''} ${className || ''}`
            }
        >
            <Image src={icon} alt={label} width={20} height={20} className="flex-shrink-0" />
            <span>{label}</span>
        </Link>
    );
}