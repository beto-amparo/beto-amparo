// pages/empresa/[slug]/donoarea.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import OwnerSidebar from '@/components/OwnerSidebar';

import FloatingNotificationsTop from '@/components/notification'; 
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY);


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
    const [valorPonto, setValorPonto] = useState('');
    const [ativo, setAtivo] = useState(false);
    const [saving, setSaving] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!router.isReady) return;

        const { slug } = router.query;

        async function fetchDonoArea() {
            try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/dono/${slug}`, {
                credentials: 'include',
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                router.push('/loginEmpresa');
                return;
                }
                const errorData = await res.json();
                throw new Error(errorData.error || 'Erro ao carregar dados do dashboard');
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
        }, [router.isReady]);


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
        alert("Erro ao salvar configuração.");
        } else {
        alert("Configuração salva com sucesso!");
        setOpen(false);
        }
        setSaving(false);
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
        <OwnerSidebar slug={donoData.loja.slug_loja}>
            <FloatingNotificationsTop />

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
            <InfoCard value="3" sub="notificações" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
            <div className="grid grid-cols-2 gap-4">
                <ActionCard icon="/icons/add2.svg" label="Adicionar Produtos" path={`/empresa/${donoData.loja.slug_loja}/AdicionarProduto`} />
                <ActionCard icon="/icons/notification.svg" label="Notificações" path={`/empresa/${donoData.loja.slug_loja}/notificacoes`} />
                <ActionCard icon="/icons/paint_gray.svg" label="Personalizar Loja" path={`/empresa/${donoData.loja.slug_loja}/personalizacao`} />
                <ActionCard icon="/icons/store_gray.svg" label="Ver Loja" path={`${window.location.origin}/loja/${donoData.loja.slug_loja}`} />
                < ActionCard icon="/icons/pontos.svg" label="Configurar Fidelidade" onClick={() => setOpen(true)} />

            </div>
            <div className="bg-white rounded shadow p-4 flex flex-col gap-4">
                <div className="text-sm font-semibold text-gray-600 border-b pb-1">Promoções</div>
                <ActionCard icon="/icons/sale.svg" label="Adicionar Promoção" noBg />
                <ActionCard icon="/icons/check.svg" label="Promoções Ativas" noBg />
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
                        <label className="block text-sm font-medium text-gray-700">"A cada R$20,00 adquire 1 ponto"</label>
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

        </OwnerSidebar>
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

function ActionCard({ icon, label, path, onClick, noBg = false }) {
    const router = useRouter();
    const classes = `
        ${noBg ? 'bg-white' : 'bg-white'}
        p-4 rounded shadow flex items-center gap-4 hover:bg-gray-100 cursor-pointer text-gray-500
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