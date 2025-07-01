// pages/empresa/[slug]/configuracoes/encerrar-conta.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import OwnerSidebar from '@/components/OwnerSidebar'; // Supondo que você usa OwnerSidebar
import Aviso from '@/components/Aviso'; // Para mensagens de sucesso/erro
import ConfirmacaoModal from '@/components/ConfirmacaoModal'; // Para a confirmação final

export default function EncerrarContaPage() {
    const router = useRouter();
    const { slug } = router.query;

    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Para o estado de envio do formulário
    const [error, setError] = useState(null); // Para erros persistentes na tela
    const [lojaId, setLojaId] = useState(null); // Precisaremos do ID da loja para a exclusão
    const [isAuthChecking, setIsAuthChecking] = useState(true); // Para verificação inicial de autenticação

    // Estados para o componente de aviso
    const [notification, setNotification] = useState(null); // { message: '...', type: 'success' | 'error' }

    // Estados para o modal de confirmação
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_EMPRESA_API || 'http://localhost:4000';

    // Funções para mostrar/fechar aviso
    const showNotification = (message, type) => {
        setNotification({ message, type });
    };

    const handleCloseNotification = () => {
        setNotification(null);
    };

    // --- Efeito para verificar autenticação e buscar ID da loja ---
    useEffect(() => {
        const checkAuthAndFetchLojaId = async () => {
            if (!router.isReady || !slug) return;

            setIsAuthChecking(true);
            try {
                // 1. Verificar autenticação
                const authResponse = await fetch(`${API_BASE_URL}/verifyAuthStatus`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (authResponse.status === 401) {
                    const errorData = await authResponse.json();
                    showNotification(errorData.mensagem || 'Sessão expirada. Faça login novamente.', 'error');
                    router.push(errorData.redirectTo || `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`);
                    return;
                }

                // 2. Buscar ID da loja pelo slug
                const lojaResponse = await fetch(`${API_BASE_URL}/loja/slug/${slug}`);
                if (!lojaResponse.ok) {
                    throw new Error(`Erro ao carregar ID da loja: ${lojaResponse.statusText}`);
                }
                const lojaData = await lojaResponse.json();
                setLojaId(lojaData.id);

            } catch (err) {
                console.error('EncerrarContaPage: Erro na autenticação ou ao buscar ID da loja:', err);
                setError(err.message || 'Erro ao carregar dados da loja.');
                showNotification(err.message || 'Erro ao carregar dados iniciais da loja.', 'error');
            } finally {
                setIsAuthChecking(false);
            }
        };

        checkAuthAndFetchLojaId();
    }, [router, slug, API_BASE_URL]);

    const handleChangePassword = (e) => {
        setPassword(e.target.value);
        setError(null); // Limpa erros ao digitar
        handleCloseNotification(); // Fecha aviso ao digitar
    };

    // --- Handlers para o Modal de Confirmação ---
    const handleOpenConfirmModal = () => {
        if (!password.trim()) {
            setError('Por favor, digite sua senha para confirmar.');
            showNotification('Por favor, digite sua senha para confirmar.', 'error');
            return;
        }
        setShowConfirmModal(true);
    };

    const handleCancelDelete = () => {
        setShowConfirmModal(false);
    };

    const handleConfirmDelete = async () => {
        setShowConfirmModal(false); // Fecha o modal imediatamente
        setIsLoading(true);
        setError(null);
        handleCloseNotification();

        try {
            if (!lojaId) {
                throw new Error('Erro: ID da loja não disponível. Tente recarregar a página.');
            }

            // Envia a solicitação de exclusão para o backend
            const response = await fetch(`${API_BASE_URL}/loja/${lojaId}/deletar`, { // Novo endpoint no backend
                method: 'POST', // Ou DELETE, se preferir
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ password }), // Envia a senha para validação no backend
            });

            const data = await response.json();

            if (!response.ok) {
                // Se a senha estiver errada ou outro erro do backend
                throw new Error(data.mensagem || 'Falha ao encerrar a conta da loja.');
            }

            // Sucesso na exclusão
            showNotification('Sua loja foi excluída com sucesso.', 'success');
            // Redireciona para uma página de confirmação ou para o login principal
            router.push('/empresa/LoginEmpresa'); // Ou '/confirmacao-exclusao'

        } catch (err) {
            console.error('EncerrarContaPage: Erro ao encerrar conta:', err);
            setError(err.message || 'Erro ao tentar encerrar a conta da loja.');
            showNotification(err.message || 'Erro ao tentar encerrar a conta da loja.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Renderização ---
    if (isAuthChecking || isLoading) { // Adicionado isLoading aqui para mostrar feedback durante o envio
        return (
            <OwnerSidebar slug={slug}>
                <div className="w-full h-full flex items-center justify-center">
                    <p className="text-xl text-[#3681B6]">{isLoading ? 'Encerrando conta...' : 'Carregando...'}</p>
                </div>
            </OwnerSidebar>
        );
    }

    if (error && !notification) { // Mostra erro persistente se não há notificação temporária
        return (
            <OwnerSidebar slug={slug}>
                <div className="w-full h-full text-center p-8 text-xl text-red-700">
                    Erro: {error}
                    <p className="mt-4">
                        Por favor, <button onClick={() => window.location.reload()} className="text-[#3681B6] hover:underline">tente recarregar a página</button>.
                    </p>
                </div>
            </OwnerSidebar>
        );
    }

    return (
        <OwnerSidebar slug={slug}>
            <div className="w-full h-full flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-5 w-full sm:max-w-xl relative">
                    {/* Botão de fechar/voltar */}
                    <Link href={`/empresa/${slug}/configuracoes`}>
                        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold p-1 leading-none cursor-pointer">
                            &times;
                        </button>
                    </Link>

                    <div className="flex justify-between items-center mb-3 mt-3">
                        <div className="h-12 object-contain">
                            <Image src="/logo.png" width={80} height={70} alt="Logo da Marca" />
                        </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-red-600"> {/* Título em vermelho para indicar ação crítica */}
                        Encerrar Conta da Loja
                    </h1>

                    <p className="text-gray-700 mb-6">
                        Ao encerrar sua conta, todos os dados da sua loja, incluindo produtos, categorias, pedidos e informações da loja, serão permanentemente excluídos. Esta ação não pode ser desfeita.
                    </p>
                    <p className="text-gray-700 mb-6 font-semibold">
                        Para confirmar, por favor, digite sua senha:
                    </p>

                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={handleChangePassword}
                            placeholder="Sua senha atual"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 text-black placeholder:text-gray-400"
                            required
                        />
                    </div>

                    {error && ( // Exibe erro persistente abaixo do campo de senha
                        <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleOpenConfirmModal}
                        className="w-full p-3 rounded-xl text-white font-medium bg-red-600 hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
                        disabled={isLoading || !password.trim()} // Desabilita se estiver carregando ou senha vazia
                    >
                        {isLoading ? 'Encerrando...' : 'Encerrar Minha Conta da Loja'}
                    </button>
                </div>
            </div>

            {/* Renderiza o componente de Aviso se houver uma notificação ativa */}
            {notification && (
                <Aviso
                    message={notification.message}
                    type={notification.type}
                    onClose={handleCloseNotification}
                />
            )}

            {/* Renderiza o modal de confirmação */}
            {showConfirmModal && (
                <ConfirmacaoModal
                    title="Confirmação de Exclusão da Loja"
                    // MENSAGEM AJUSTADA AQUI:
                    message="Ah, que pena que vai nos deixar! Ao encerrar sua conta, todos os dados da sua loja, incluindo produtos, categorias e pedidos, serão permanentemente excluídos. Esta ação não pode ser desfeita."
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                />
            )}
        </OwnerSidebar>
    );
}