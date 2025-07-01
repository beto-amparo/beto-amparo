// frontEnd/pages/empresa/[slug]/configuracoes/index.js 

import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import OwnerSidebar from '@/components/OwnerSidebar'; 

export default function ConfiguracoesPage() {
    const router = useRouter();
    const { slug } = router.query;

    return (
        <OwnerSidebar slug={slug}>
            <div className="w-full h-full flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-5 w-full sm:max-w-xl relative">
                    <Link href={`/empresa/${slug}/donoarea`}>
                        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold p-1 leading-none">
                            &times;
                        </button>
                    </Link>

                    <div className="flex justify-between items-center mb-3 mt-3">
                        <div className="h-12 object-contain">
                            <Image src="/logo.png" width={80} height={70} alt="Logo da Marca" />
                        </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-semibold mb-6" style={{ color: '#3681B6' }}>
                        Configurações da Loja
                    </h1>

                    <nav className="space-y-4">
                        {/* Opção "Minhas Categorias" */}
                        <Link
                            href={`/empresa/${slug}/configuracoes/minhas-categorias`}
                            className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl shadow-sm transition-colors cursor-pointer text-gray-800"
                        >
                            <Image src="/icons/category_black.svg" alt="Ícone Categorias" width={24} height={24} />
                            <span className="font-medium text-lg">Minhas Categorias</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-auto">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </Link>

                        {/* NOVO: Opção "Horário de Funcionamento" */}
                        <Link
                            href={`/empresa/${slug}/configuracoes/horario-funcionamento`}
                            className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl shadow-sm transition-colors cursor-pointer text-gray-800"
                        >
                            <Image src="/icons/clock_black.svg" alt="Ícone Horário" width={24} height={24} />
                            <span className="font-medium text-lg">Horário de Funcionamento</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-auto">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </Link>

                        {/* NOVO: Opção "Visibilidade de Lojas" */}
                        <Link
                            href={`/empresa/${slug}/configuracoes/visibilidade-lojas`}
                            className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl shadow-sm transition-colors cursor-pointer text-gray-800"
                        >
                            <Image src="/icons/storefront_black.svg" alt="Ícone Lojas" width={24} height={24} /> {/* Escolha um ícone apropriado */}
                            <span className="font-medium text-lg">Visibilidade de Outras Lojas</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-auto">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </Link>

                        {/* Opção "Encerrar Conta da Loja" */}
                        <Link
                            href={`/empresa/${slug}/configuracoes/encerrar-conta`}
                            className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl shadow-sm transition-colors cursor-pointer text-red-600"
                        >
                            <Image src="/icons/delete_red.svg" alt="Ícone Encerrar Conta" width={24} height={24} />
                            <span className="font-medium text-lg">Encerrar Conta da Loja</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-auto">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </Link>
                    </nav>
                </div>
            </div>
        </OwnerSidebar>
    );
}