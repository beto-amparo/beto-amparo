// pages/empresa/[slug]/donoarea.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

import FloatingNotificationsTop from '@/components/notification'; 
import OwnerSidebar from '@/components/OwnerSidebar';
export default function OwnerDono() {
    const router = useRouter();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [donoData, setDonoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [metrics, setMetrics] = useState({
        novosPedidos: null,
        pedidosFinalizados: null,
        notificacoes: null,
    });

    useEffect(() => {
        async function fetchDonoArea() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/dono`, {
                    credentials: 'include',
                });

                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        router.push('/loginEmpresa');
                        return;
                    }
                    const errorData = await res.json();
                    throw new Error(`Erro ao carregar dados do dashboard: ${errorData.error || res.statusText}`);
                }

                const data = await res.json();
                setDonoData(data);
                setMetrics({
                    novosPedidos: data?.novosPedidos ?? 0, 
                    pedidosFinalizados: data?.pedidosFinalizados ?? 0,
                    notificacoes: data?.notificacoes ?? 0,
                });
            } catch (err) {
                console.error("Erro na requisição fetchDonoArea:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchDonoArea();
    }, [router]); 

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-700 text-lg">Carregando...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-red-600 text-lg">{error}</p>
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
        <div className="min-h-screen flex flex-col md:flex-row">
            <div className="bg-[#3681B6] text-white flex items-center justify-start p-4 md:hidden gap-4">
                <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Logo" width={32} height={32} />
                    <span className="font-bold text-lg">BETO Amparo</span>
                </div>
            </div>
            <OwnerSidebar>

            </OwnerSidebar>

            <main className="flex-1 bg-gray-100 p-6 md:p-8">

                <FloatingNotificationsTop/>

                <h1 className="text-2xl font-bold text-gray-600 mb-6 text-center">
                    Bem-vindo(a) de volta, {donoData.empresa.nome}!
                </h1>

                <div className="mt-4 w-full max-w-3xl mx-auto mb-6">
                    <label className="block text-gray-800 text-sm mb-1 font-bold">Link da sua loja:</label>
                    <div className="flex items-center bg-white rounded shadow p-2">
                        <input
                            type="text"
                            readOnly
                            value={`${window.location.origin}/loja/${donoData.loja.slug_loja}`}
                            className="flex-1 outline-none bg-transparent text-sm text-gray-600"
                        />
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/loja/${donoData.loja.slug_loja}`);
                            }}
                            className="ml-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded"
                        >
                            Copiar
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded shadow p-6 w-full max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="col-span-2 md:col-span-4">
                        <h2 className="text-lg font-semibold text-gray-600 mb-1">Resumo geral:</h2>
                    </div>
                    <InfoCard value={donoData.produtos ? donoData.produtos.length : 0} sub="produtos ativos" />
                    <InfoCard value={metrics.novosPedidos} sub="novos pedidos" />
                    <InfoCard value={metrics.pedidosFinalizados} sub="pedidos finalizados" />
                    <InfoCard value={metrics.notificacoes} sub="notificações" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <ActionCard icon="/icons/add2.svg" label="Adicionar Produtos" path={`/empresa/${donoData.loja.slug_loja}/AdicionarProduto`} />
                        <ActionCard icon="/icons/notification.svg" label="Notificações" path={`/empresa/${donoData.loja.slug_loja}/notificacoes`} />
                        <ActionCard icon="/icons/paint_gray.svg" label="Personalizar Loja" path={`/empresa/${donoData.loja.slug_loja}/personalizacao-loja`} />
                        <ActionCard icon="/icons/store_gray.svg" label="Ver Loja" path={`${window.location.origin}/loja/${donoData.loja.slug_loja}`} />
                    </div>
                    <div className="bg-white rounded shadow p-4 flex flex-col gap-4">
                        <div className="text-sm font-semibold text-gray-600 border-b pb-1">Promoções</div>
                        <ActionCard icon="/icons/sale.svg" label="Adicionar Promoção" noBg />
                        <ActionCard icon="/icons/check.svg" label="Promoções Ativas" noBg />
                    </div>
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, path }) {
    const router = useRouter();
    return (
        <div
            onClick={() => router.push(path)}
            className="flex items-center gap-2 p-2 hover:bg-blue-700 cursor-pointer rounded"
        >
            <Image src={icon} alt={label} width={20} height={20} />
            <span>{label}</span>
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

function ActionCard({ icon, label, path, noBg = false }) {
    const router = useRouter();
    const classes = `
        ${noBg ? 'bg-white' : 'bg-white'}
        p-4 rounded shadow flex items-center gap-4 hover:bg-gray-100 cursor-pointer text-gray-500
    `;
    return (
        <div onClick={() => path && router.push(path)} className={classes}>
            <Image src={icon} alt={label} width={24} height={24} />
            <span className="text-lg font-semibold">{label}</span>
        </div>
    );
}