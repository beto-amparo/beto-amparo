// pages/empresa/[slug]/produtos/inativos.js

// ... (seus imports existentes - NÃO MUDAR)
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast'; 

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import OwnerSidebar from '@/components/OwnerSidebar';
import AdminProductCard from '@/components/AdminProductCard'; // Seu componente AdminProductCard
import ConfirmationModal from '@/components/ConfirmationModal'; // Seu componente ConfirmationModal

export default function ProdutosInativosPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [produtosInativos, setProdutosInativos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToHandle, setProductToHandle] = useState(null);
  const [actionType, setActionType] = useState(''); // Estado para 'ativar' ou 'excluirPermanentemente'
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);

  // --- FUNÇÕES EXISTENTES PARA ATIVAR (ONDE O SEU Antigo 'onDelete' CHAMA) ---
  const handleOpenConfirmActivateModal = (product) => {
    setProductToHandle(product);
    setActionType('ativar'); // Define o tipo de ação para 'ativar'
    setIsModalOpen(true);
  };

  const handleConfirmActivate = async () => {
    if (!productToHandle || actionType !== 'ativar') return;

    setIsConfirmingAction(true);
    setError(null);

    const endpoint = `${process.env.NEXT_PUBLIC_EMPRESA_API}/produtos/ativar/${productToHandle.id}`;

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        credentials: 'include',
      });

      if (response.status === 401) {
        const errorData = await response.json();
        const targetUrl = errorData.redirectTo || `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
        router.push(targetUrl);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensagem || `Erro HTTP ${response.status} ao ativar produto.`);
      }

      setProdutosInativos(prevProdutos => prevProdutos.filter(p => p.id !== productToHandle.id));
      handleCloseConfirmModal();

    } catch (err) {
      console.error(`Erro ao ativar produto:`, err);
      setError(err.message || `Não foi possível ativar o produto. Verifique o console do backend.`);
      setIsConfirmingAction(false);
    }
  };

  // --- NOVAS FUNÇÕES PARA EXCLUIR PERMANENTEMENTE ---
  const handleOpenConfirmDeletePermanentModal = (product) => {
    setProductToHandle(product);
    setActionType('excluirPermanentemente'); // Define o tipo de ação para 'excluirPermanentemente'
    setIsModalOpen(true);
  };

  const handleConfirmDeletePermanent = async () => {
    if (!productToHandle || actionType !== 'excluirPermanentemente') return;

    setIsConfirmingAction(true);
    setError(null);

    // O endpoint DEVE ser ajustado para o seu backend para exclusão permanente
    // Ex: DELETE /api/produtos/excluir/:id
    const endpoint = `${process.env.NEXT_PUBLIC_EMPRESA_API}/produtos/excluir/${productToHandle.id}`;

    try {
      const response = await fetch(endpoint, {
        method: 'DELETE', // Método HTTP DELETE para exclusão
        credentials: 'include',
      });

      if (response.status === 401) {
        const errorData = await response.json();
        const targetUrl = errorData.redirectTo || `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
        router.push(targetUrl);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensagem || `Erro HTTP ${response.status} ao excluir produto permanentemente.`);
      }

      // Se a exclusão foi bem-sucedida (status 200, 204), remove o produto da lista inativos
      setProdutosInativos(prevProdutos => prevProdutos.filter(p => p.id !== productToHandle.id));
     // alert('Produto excluído permanentemente com sucesso!');
      handleCloseConfirmModal();

    } catch (err) {
      console.error(`Erro ao excluir produto permanentemente:`, err);
      setError(err.message || `Não foi possível excluir o produto. Verifique o console do backend.`);
      setIsConfirmingAction(false);
    }
  };

  // --- FUNÇÃO ÚNICA PARA FECHAR O MODAL ---
  const handleCloseConfirmModal = () => {
    setIsModalOpen(false);
    setProductToHandle(null);
    setActionType('');
    setIsConfirmingAction(false);
  };

  // --- FUNÇÃO UNIFICADA PARA CONFIRMAR AÇÃO DO MODAL ---
  const handleConfirmAction = () => {
    if (actionType === 'ativar') {
      handleConfirmActivate();
    } else if (actionType === 'excluirPermanentemente') {
      handleConfirmDeletePermanent();
    }
    // Adicione mais tipos de ação aqui se precisar no futuro
  };

  // ... (SEU useEffect existente - NÃO MUDAR)
  useEffect(() => {
    if (!router.isReady || !slug) {
      return;
    }

    const fetchProdutosInativos = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produtos/loja/${slug}?ativo=false`, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.status === 401) {
          const errorData = await response.json();
          const targetUrl = errorData.redirectTo || `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
          router.push(targetUrl);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.mensagem || `Erro HTTP ${response.status} ao carregar produtos inativos.`);
        }

        const data = await response.json();
        setProdutosInativos(data.filter(p => p.hasOwnProperty('ativo') ? p.ativo === false : false));
        console.log("Frontend: Produtos inativos recebidos com sucesso:", data);

      } catch (err) {
        console.error("Frontend: Erro ao buscar produtos inativos:", err);
        setError(err.message || 'Não foi possível carregar os produtos inativos. Verifique o console do backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchProdutosInativos();
  }, [slug, router.isReady, router]);

  // ... (SUA função getImagemProduto existente - NÃO MUDAR)
  const getImagemProduto = (imagePathOrFullUrl) => {
    if (imagePathOrFullUrl && (imagePathOrFullUrl.startsWith('http://') || imagePathOrFullUrl.startsWith('https://'))) {
      return imagePathOrFullUrl;
    }
    if (imagePathOrFullUrl) {
      // Use produto.imagem_url ou produto.image? Adapte aqui se necessário.
      // No seu AdminProductCard.js, está usando 'produto.image'.
      // Vamos manter a consistência com o AdminProductCard para evitar quebra.
      return `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/uploads/produtos/${imagePathOrFullUrl}`;
    }
    return '/placeholder.png';
  };

  // ... (SUA lógica de produtosPorCategoria existente - NÃO MUDAR)
  const produtosPorCategoria = useMemo(() => {
    const grouped = {};
    produtosInativos.forEach(produto => {
      const categoria = produto.categoria || 'Outros';
      if (!grouped[categoria]) {
        grouped[categoria] = [];
      }
      grouped[categoria].push(produto);
    });
    return grouped;
  }, [produtosInativos]);

  const pageContent = (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded-lg shadow-md min-h-[600px]">
      <h1 className="text-3xl font-bold text-[#3681B6] mb-6">Produtos Inativos</h1>

      <div className="mb-6 flex justify-between items-center">
        {slug && (
          <Link href={`/empresa/${slug}/produtos`} className="bg-gray-600 text-white py-2 px-5 rounded-lg shadow-md hover:bg-gray-700 transition duration-200 text-lg">
            Voltar para Produtos Ativos
          </Link>
        )}
        {!slug && (
          <span className="text-gray-500">Aguardando detalhes da empresa...</span>
        )}
      </div>

      {loading ? (
        <div className="text-center p-8 text-xl text-gray-700">Carregando produtos inativos...</div>
      ) : error ? (
        <div className="text-center p-8 text-red-600 font-semibold">
          Erro: {error}
          <p className="mt-2 text-sm text-gray-500">Verifique os logs do terminal do seu backend para mais detalhes.</p>
        </div>
      ) : Object.keys(produtosPorCategoria).length > 0 ? (
        <div>
          {Object.entries(produtosPorCategoria).map(([categoria, produtosDaCategoria]) => (
            <div key={categoria} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                {categoria}
              </h2>
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={20}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                breakpoints={{
                  640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                  },
                  1024: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                  },
                }}
                className="mySwiper"
              >
              {produtosDaCategoria.map((produto) => (
                <SwiperSlide key={produto.id}>
                  <div className="w-full flex justify-center">
                    <AdminProductCard
                      produto={produto}
                      getImagemProduto={getImagemProduto}
                      onEdit={null} // Mantido como null se não quiser edição de inativos
                      // *** ESTA LINHA É A CHAVE PARA O BOTÃO DE ATIVAR/INATIVAR ***
                      onStatusChange={() => handleOpenConfirmActivateModal(produto)} // Use onStatusChange AQUI
                      buttonLabel="Ativar" // Este label controla o texto e o ícone do botão de status
                      // *** ESTA LINHA É PARA A LIXEIRA DE EXCLUSÃO PERMANENTE ***
                      onPermanentDelete={() => handleOpenConfirmDeletePermanentModal(produto)}
                    />
                  </div>
                </SwiperSlide>
              ))}
              </Swiper>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 text-gray-600">
          <p>Nenhum produto inativo para esta empresa.</p>
        </div>
      )}
    </div>
  );

  return (
    <OwnerSidebar slug={slug}>
      {pageContent}
      {/* Mantenha o seu ConfirmationModal dinâmico para 'ativar' ou 'excluirPermanentemente' */}
      <ConfirmationModal
        isOpen={isModalOpen}
        title={
          actionType === 'ativar'
            ? 'Confirmar Ativação'
            : actionType === 'excluirPermanentemente'
              ? 'Confirmar Exclusão Permanente'
              : 'Ação Desconhecida'
        }
        message={
          actionType === 'ativar'
            ? `Tem certeza que deseja ativar o produto "${productToHandle?.nome || ''}"? Ele voltará a aparecer na loja.`
            : actionType === 'excluirPermanentemente'
              ? `Tem certeza que deseja EXCLUIR PERMANENTEMENTE o produto "${productToHandle?.nome || ''}"? Esta ação não pode ser desfeita.`
              : 'Confirma esta ação?'
        }
        onConfirm={handleConfirmAction}
        onCancel={handleCloseConfirmModal}
        isConfirming={isConfirmingAction}
        actionLabel={
          actionType === 'ativar'
            ? 'Ativar'
            : actionType === 'excluirPermanentemente'
              ? 'Excluir'
              : 'Confirmar'
        }
      />
    </OwnerSidebar>
  );
}