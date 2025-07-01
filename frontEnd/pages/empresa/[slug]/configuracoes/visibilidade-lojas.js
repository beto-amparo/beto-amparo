// frontEnd/pages/empresa/[slug]/configuracoes/visibilidade-lojas.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import OwnerSidebar from '@/components/OwnerSidebar';
import axios from 'axios';

export default function VisibilidadeLojasPage() {
    const router = useRouter();
    const { slug } = router.query; // Slug da loja atual
    const [mostrarOutrasLojas, setMostrarOutrasLojas] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [corMensagem, setCorMensagem] = useState('');

    useEffect(() => {
        if (!slug) return;
        
        async function fetchConfiguracao() {
            try {
                // Endpoint para buscar a configuração atual da loja
                const response = await axios.get(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug/${slug}`);
                if (response.data) {
                    setMostrarOutrasLojas(response.data.mostrar_outras_lojas || false);
                }
            } catch (error) {
                console.error("Erro ao buscar configuração de visibilidade:", error);
                setMensagem("Erro ao carregar configurações.");
                setCorMensagem("text-red-500");
            } finally {
                setLoading(false);
            }
        }
        fetchConfiguracao();
    }, [slug]);

    const handleSave = async () => {
        setSaving(true);
        setMensagem('');
        setCorMensagem('');
        try {
            const response = await axios.put(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/visibilidade-outras-lojas`, 
                { mostrar_outras_lojas: mostrarOutrasLojas },
                { withCredentials: true }
            );
            if (response.status === 200) {
                setMensagem("Configuração salva com sucesso!");
                setCorMensagem("text-green-500");
            } else {
                throw new Error(response.data?.mensagem || "Erro ao salvar configuração.");
            }
        } catch (error) {
            console.error("Erro ao salvar configuração de visibilidade:", error.response?.data || error.message);
            setMensagem(`Erro ao salvar: ${error.response?.data?.mensagem || error.message}`);
            setCorMensagem("text-red-500");
        } finally {
            setSaving(false);
            setTimeout(() => setMensagem(''), 5000);
        }
    };

    if (loading) {
        return (
            <OwnerSidebar slug={slug}>
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                    Carregando configurações...
                </div>
            </OwnerSidebar>
        );
    }

    return (
        <OwnerSidebar slug={slug}>
            <div className="w-full h-full flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-5 w-full sm:max-w-xl relative">
                    <Link href={`/empresa/${slug}/configuracoes`}>
                        {/* Botão 'X' de fechar - Adicionado cursor-pointer */}
                        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold p-1 leading-none cursor-pointer">
                            &times;
                        </button>
                    </Link>

                    <div className="flex justify-between items-center mb-3 mt-3">
                        <div className="h-12 object-contain">
                            <Image src="/logo.png" width={80} height={70} alt="Logo da Marca" />
                        </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-semibold mb-6" style={{ color: '#3681B6' }}>
                        Visibilidade de Lojas
                    </h1>

                    <div className="space-y-6">
                        <p className="text-gray-700">
                            Controle se outras lojas da mesma empresa devem ser exibidas como sugestão para seus clientes.
                        </p>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            {/* O label já tem cursor-pointer, o que é bom para acessibilidade */}
                            <label htmlFor="mostrarOutrasLojas" className="flex items-center cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="mostrarOutrasLojas"
                                        className="sr-only"
                                        checked={mostrarOutrasLojas}
                                        onChange={() => setMostrarOutrasLojas(!mostrarOutrasLojas)}
                                        disabled={saving}
                                    />
                                    <div
                                        className={`block w-14 h-8 rounded-full transition-colors ${
                                            mostrarOutrasLojas ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                    ></div>
                                    <div
                                        className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                                            mostrarOutrasLojas ? 'translate-x-full' : 'translate-x-0'
                                        }`}
                                    ></div>
                                </div>
                                <span className="ml-3 text-lg font-medium text-gray-900">
                                    Mostrar outras lojas da empresa
                                </span>
                            </label>
                        </div>

                        {mensagem && (
                            <p className={`text-center text-sm ${corMensagem}`}>{mensagem}</p>
                        )}

                        {/* Botão de salvar - Adicionado cursor-pointer */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`w-full py-3 rounded-xl font-semibold transition cursor-pointer ${ // Adicionado cursor-pointer aqui
                                saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#3681B6] to-[#2e6e99] text-white hover:from-[#2e6e99] hover:to-[#3681B6]'
                            }`}
                        >
                            {saving ? 'Salvando...' : 'Salvar Configuração'}
                        </button>
                    </div>
                </div>
            </div>
        </OwnerSidebar>
    );
}