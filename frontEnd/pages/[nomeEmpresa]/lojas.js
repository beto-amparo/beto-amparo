import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import OwnerSidebar from '@/components/OwnerSidebar';

export default function ListaLojasEmpresa() {
    const [lojas, setLojas] = useState([]);
    const [empresa, setEmpresa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const router = useRouter();
    const { nomeEmpresa } = router.query;

    const getImagemLoja = (loja) => {
        if (!loja) return "/icons/store_gray.svg";

        const caminhoImagem = loja?.foto_loja || loja?.imagem_url || loja?.logo || loja?.foto;

        if (!caminhoImagem) return "/icons/store_gray.svg";

        if (caminhoImagem.startsWith('http')) return caminhoImagem;

        const baseUrl = 'https://qkiyyvnyvjqsjnobfyqn.supabase.co/storage/v1/object/public';
        const cleanedPath = caminhoImagem.replace(/^\/+/, ''); // remove barras iniciais
        return `${baseUrl}/lojas/${encodeURIComponent(cleanedPath)}?v=${Date.now()}`;
    };



    useEffect(() => {
        if (!nomeEmpresa) return;

        async function fetchLojas() {
            try {
                console.log('Validando acesso para:', nomeEmpresa);

                // 1. Adicione logs para verificar a chamada da API
                console.log('Chamando endpoint:', `${process.env.NEXT_PUBLIC_EMPRESA_API}/${nomeEmpresa}/validate`);

                const validation = await fetch(
                    `${process.env.NEXT_PUBLIC_EMPRESA_API}/${nomeEmpresa}/validate`,
                    {
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                    }
                );

                if (validation.status === 401 || validation.status === 403) {
                    console.log('Redirecionando para login');
                    window.location.href = `/${nomeEmpresa}/LoginEmpresa?returnTo=/${nomeEmpresa}/lojas`;
                    return;
                }

                if (!validation.ok) {
                    throw new Error('Falha na validação');
                }

                // 2. Adicione log para verificar a chamada das lojas
                console.log('Buscando lojas em:', `${process.env.NEXT_PUBLIC_EMPRESA_API}/${nomeEmpresa}/lojas`);

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_EMPRESA_API}/${nomeEmpresa}/lojas`,
                    { credentials: 'include' }
                );

                if (!res.ok) throw new Error('Erro ao buscar lojas');

                const data = await res.json();

                // Adicione isso logo após o const data = await res.json();
                console.log('--- DADOS RECEBIDOS DA API ---');
                console.log('Dados completos da empresa:', data.empresa);
                console.log('Dados das lojas (primeira loja como exemplo):', {
                    ...data.lojas[0],  // Mostra a primeira loja como exemplo
                    camposImagem: {
                        foto_loja: data.lojas[0]?.foto_loja,
                        imagem_url: data.lojas[0]?.imagem_url,
                        logo: data.lojas[0]?.logo,
                        foto: data.lojas[0]?.foto
                    }
                });

                // 3. Log completo dos dados recebidos
                console.log('Dados recebidos da API:', {
                    lojas: data.lojas,
                    camposImagem: data.lojas?.map(loja => ({
                        id: loja.id,
                        temImagem: !!loja.foto_loja,
                        valorImagem: loja.foto_loja
                    }))
                });

                setLojas(data.lojas || []);
                console.log("Lojas recebidas para exibir na tela:", data.lojas);

                setEmpresa(data.empresa);

            } catch (err) {
                console.error('Erro ao carregar lojas:', err);
                setError('Não foi possível carregar as lojas. Tente novamente mais tarde.');
            } finally {
                setLoading(false);
            }
        }

        fetchLojas();
    }, [nomeEmpresa]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-8">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
                                    <div className="h-48 bg-gray-200"></div>
                                    <div className="p-4 space-y-3">
                                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md text-center">
                    <div className="text-red-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Ocorreu um erro</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Lojas {empresa?.nome}</h1>
                </div>

                {lojas.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma loja cadastrada</h3>
                        <p className="text-gray-500 mb-6">Comece adicionando sua primeira loja</p>
                        <button
                            onClick={() => router.push(`/empresa/personalizacao-loja?idEmpresa=${empresa.id}`)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                        >
                            Adicionar loja
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {lojas.map((loja) => {

                            const imgUrl = getImagemLoja(loja);
                            console.log('Imagem da loja:', imgUrl);


                            console.log(`Loja ${loja.id} - ${loja.nome_fantasia}:`, {
                                ...loja,
                                urlImagemGerada: getImagemLoja(loja)
                            });

                            // Log para verificar cada loja individualmente
                            console.log(`Dados da loja ${loja.id}:`, {
                                ...loja,
                                urlImagem: getImagemLoja(loja.foto_loja)
                            });

                            return (
                                <div
                                    key={loja.id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                                    onClick={() => router.push(`/empresa/${loja.slug_loja}/donoarea`)}
                                >
                                    <div className="relative h-48 w-full bg-gray-100">
                                        <img
                                            src={getImagemLoja(loja)}
                                            alt={`${loja.nome_fantasia} - Foto da loja`}
                                            className="object-cover w-full h-full"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/icons/store_gray.svg';
                                            }}
                                        />
                                    </div>

                                    <div className="p-5">
                                        <h2 className="text-xl font-semibold text-gray-900 mb-1">{loja.nome_fantasia}</h2>
                                        {loja.slogan && (
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{loja.slogan}</p>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <button
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/empresa/${loja.slug_loja}/donoarea`);
                                                }}
                                            >
                                                Ver detalhes →
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}

                <button
                    onClick={() => router.push(`/empresa/personalizacao-loja?idEmpresa=${empresa.id}`)}
                    className="fixed bottom-8 right-8 inline-flex items-center p-3 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </button>
            </div>
        </div>
    );
}