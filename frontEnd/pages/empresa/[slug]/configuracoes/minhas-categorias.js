// pages/empresa/[slug]/configuracoes/minhas-categorias.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import OwnerSidebar from '@/components/OwnerSidebar';
import Aviso from '@/components/Aviso';
import ConfirmacaoModal from '@/components/ConfirmacaoModal'; // <-- Importe o novo componente de modal

export default function MinhasCategoriasPage() {
    const router = useRouter();
    const { slug } = router.query;

    const [categorias, setCategorias] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lojaId, setLojaId] = useState(null);
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    // Estados para edição
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Estados para o componente de aviso
    const [notification, setNotification] = useState(null);

    // NOVO: Estados para o modal de confirmação
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null); // Armazena a categoria a ser deletada temporariamente

    const API_BASE_URL = process.env.NEXT_PUBLIC_EMPRESA_API || 'http://localhost:4000';

    const showNotification = (message, type) => {
        setNotification({ message, type });
    };

    const handleCloseNotification = () => {
        setNotification(null);
    };

    // --- Efeito para verificar autenticação e buscar ID da loja (mantido) ---
    useEffect(() => {
        const checkAuthAndFetchLojaId = async () => {
            if (!router.isReady || !slug) return;

            setIsAuthChecking(true);
            try {
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

                const lojaResponse = await fetch(`${API_BASE_URL}/loja/slug/${slug}`);
                if (!lojaResponse.ok) {
                    throw new Error(`Erro ao carregar ID da loja: ${lojaResponse.statusText}`);
                }
                const lojaData = await lojaResponse.json();
                setLojaId(lojaData.id);

            } catch (err) {
                console.error('MinhasCategorias: Erro na autenticação ou ao buscar ID da loja:', err);
                setError(err.message || 'Erro ao carregar dados da loja.');
                showNotification(err.message || 'Erro ao carregar dados iniciais da loja.', 'error');
            } finally {
                setIsAuthChecking(false);
            }
        };

        checkAuthAndFetchLojaId();
    }, [router, slug, API_BASE_URL]);

    // --- Efeito para buscar categorias (depende do lojaId) (mantido) ---
    useEffect(() => {
        if (!lojaId) return;

        const fetchCategorias = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/categorias/loja/${lojaId}`, {
                    credentials: 'include',
                });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.mensagem || 'Falha ao carregar categorias.');
                }
                const data = await response.json();
                setCategorias(data);
            } catch (err) {
                console.error('MinhasCategorias: Erro ao buscar categorias:', err);
                setError(err.message || 'Erro ao carregar categorias.');
                showNotification(err.message || 'Erro ao carregar categorias.', 'error');
                setCategorias([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategorias();
    }, [lojaId, API_BASE_URL]);

    // --- Handlers de Ação (mantidos e ajustados para o modal) ---

    const handleEditClick = (category) => {
        setEditingCategoryId(category.id);
        setEditingCategoryName(category.nome);
        setError(null);
        handleCloseNotification();
    };

    const handleCancelEdit = () => {
        setEditingCategoryId(null);
        setEditingCategoryName('');
        setError(null);
        handleCloseNotification();
    };

    const handleSaveEdit = async (categoryId) => {
        const trimmedName = editingCategoryName.trim();
        if (!trimmedName) {
            setError('O nome da categoria não pode ser vazio.');
            showNotification('O nome da categoria não pode ser vazio.', 'error');
            return;
        }
        if (categorias.some(cat =>
            cat.id !== categoryId &&
            cat.nome.toLowerCase() === trimmedName.toLowerCase()
        )) {
            setError('Já existe outra categoria com este nome.');
            showNotification('Já existe outra categoria com este nome.', 'error');
            return;
        }

        setIsSavingEdit(true);
        setError(null);
        handleCloseNotification();

        try {
            const response = await fetch(`${API_BASE_URL}/categorias/${categoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ nome: trimmedName, id_loja: lojaId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.mensagem || 'Falha ao atualizar categoria.');
            }

            setCategorias(prev =>
                prev.map(cat =>
                    cat.id === categoryId ? { ...cat, nome: data.nome } : cat
                )
            );
            handleCancelEdit();
            showNotification('Categoria atualizada com sucesso!', 'success');
        } catch (err) {
            console.error('MinhasCategorias: Erro ao salvar edição:', err);
            setError(err.message || 'Erro ao atualizar categoria.');
            showNotification(err.message || 'Erro ao atualizar categoria.', 'error');
        } finally {
            setIsSavingEdit(false);
        }
    };

    // NOVO: Função para abrir o modal de confirmação
    const handleOpenConfirmModal = (category) => {
        setCategoryToDelete(category);
        setShowConfirmModal(true);
        handleCloseNotification(); // Fecha qualquer aviso anterior
    };

    // NOVO: Função para cancelar a exclusão (fechar modal)
    const handleCancelDelete = () => {
        setCategoryToDelete(null);
        setShowConfirmModal(false);
    };

    // NOVO: Função para confirmar e proceder com a exclusão (chamada pelo modal)
    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return; // Garante que há uma categoria para deletar

        const { id, nome } = categoryToDelete;

        setShowConfirmModal(false); // Fecha o modal
        setIsLoading(true); // Reusa o loading geral
        setError(null);
        handleCloseNotification();

        try {
            const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.mensagem || 'Falha ao excluir categoria.');
            }

            setCategorias(prev => prev.filter(cat => cat.id !== id));
            showNotification('Categoria excluída com sucesso!', 'success');
        } catch (err) {
            console.error('MinhasCategorias: Erro ao excluir categoria:', err);
            showNotification(err.message || 'Erro ao excluir categoria.', 'error');
        } finally {
            setIsLoading(false);
            setCategoryToDelete(null); // Limpa a categoria a ser deletada
        }
    };


    // --- Renderização ---
    if (isAuthChecking || isLoading) {
        return (
            <OwnerSidebar slug={slug}>
                <div className="w-full h-full flex items-center justify-center">
                    <p className="text-xl text-[#3681B6]">Carregando categorias...</p>
                </div>
            </OwnerSidebar>
        );
    }

    if (error && !categorias.length) {
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
                <div className="bg-white rounded-2xl shadow-lg p-5 w-full sm:max-w-3xl relative">
                    {/* Link para voltar à página de configurações */}
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
                    <h1 className="text-2xl sm:text-3xl font-semibold mb-6" style={{ color: '#3681B6' }}>
                        Minhas Categorias
                    </h1>

                    {error && !notification && (
                        <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    {categorias.length === 0 ? (
                        <p className="text-gray-600 text-center text-lg">Nenhuma categoria encontrada para esta loja.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nome da Categoria
                                        </th>
                                        <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {categorias.map((categoria) => (
                                        <tr key={categoria.id} className="hover:bg-gray-50">
                                            <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {editingCategoryId === categoria.id ? (
                                                    <input
                                                        type="text"
                                                        value={editingCategoryName}
                                                        onChange={(e) => setEditingCategoryName(e.target.value)}
                                                        className="p-2 border border-gray-300 rounded-md w-full"
                                                        disabled={isSavingEdit}
                                                    />
                                                ) : (
                                                    categoria.nome
                                                )}
                                            </td>
                                            <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-medium">
                                                {editingCategoryId === categoria.id ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleSaveEdit(categoria.id)}
                                                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 cursor-pointer"
                                                            disabled={isSavingEdit}
                                                        >
                                                            {isSavingEdit ? 'Salvando...' : 'Salvar'}
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="px-3 py-1 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50 cursor-pointer"
                                                            disabled={isSavingEdit}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditClick(categoria)}
                                                            className="px-3 py-1 bg-[#3681B6] text-white rounded-md hover:opacity-90 cursor-pointer"
                                                            disabled={isLoading}
                                                        >
                                                            Editar
                                                        </button>
                                                        {/* ATENÇÃO: Agora chama handleOpenConfirmModal */}
                                                        <button
                                                            onClick={() => handleOpenConfirmModal(categoria)}
                                                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
                                                            disabled={isLoading}
                                                        >
                                                            Excluir
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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

            {/* Renderiza o modal de confirmação se showConfirmModal for true */}
            {showConfirmModal && categoryToDelete && (
                <ConfirmacaoModal
                    title="Excluir Categoria"
                    message={`Tem certeza que deseja excluir a categoria "${categoryToDelete.nome}"? Esta ação é irreversível. Se houver produtos associados a esta categoria, a exclusão será impedida para evitar perda de dados. Certifique-se de reatribuir ou remover os produtos primeiro.`}
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                />
            )}
        </OwnerSidebar>
    );
}