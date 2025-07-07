import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

import OwnerSidebar from '@/components/OwnerSidebar';
import HistoricoVendasTable from '@/components/HistoricoVendasTable';
import DashboardMetrics from "@/components/DashboardMetrics";
import DashboardAtendimento from "@/components/atendimentodashbord";
import ControleEstoqueTable from '@/components/ControleEstoqueTable';
import { verificarTipoDeLoja } from '../../../hooks/verificarTipoLoja';

export default function DashboardPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [mostrarResumo, setMostrarResumo] = useState(false);

  const [historicoPedidos, setHistoricoPedidos] = useState([]);
  const [produtosEstoque, setProdutosEstoque] = useState([]);
  const [cancelamentos, setCancelamentos] = useState([]);

  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [loadingEstoque, setLoadingEstoque] = useState(true);
  const [loadingCancelamentos, setLoadingCancelamentos] = useState(true);

  const [errorPedidos, setErrorPedidos] = useState(null);
  const [errorEstoque, setErrorEstoque] = useState(null);
  const [errorCancelamentos, setErrorCancelamentos] = useState(null);

  const [tipoLoja, setTipoLoja] = useState(null);
  const [autenticatedEmpresaId, setAutenticatedEmpresaId] = useState(null);

  const redirectToLogin = useCallback((errorData) => {
    const targetUrl = errorData.redirectTo || `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
    router.push(targetUrl);
  }, [router]);

  const fetchEmpresaIdFromToken = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/dono/empresa-id`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        const errorData = await response.json();
        redirectToLogin(errorData);
        return null;
      }

      if (!response.ok) throw new Error('Falha ao obter ID da empresa do token.');

      const data = await response.json();
      setAutenticatedEmpresaId(data.empresaId);
      return data.empresaId;
    } catch (err) {
      console.error('Erro ao obter ID da empresa:', err.message);
      redirectToLogin({});
      return null;
    }
  }, [redirectToLogin]);

  useEffect(() => {
    if (!router.isReady || !slug) return;

    const fetchAllDashboardData = async () => {
      try {
        const [empresaId, tipo] = await Promise.all([
          fetchEmpresaIdFromToken(),
          verificarTipoDeLoja(slug)
        ]);

        if (!empresaId) return;
        console.log('Empresa ID autenticada:', tipo);
        setTipoLoja(tipo);

        // Histórico de pedidos
        setLoadingPedidos(true);
        const resPedidos = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/pedidos/historico/loja/${slug}`, {
          credentials: 'include'
        });
        if (!resPedidos.ok) {
          const errorData = await resPedidos.json();
          if (resPedidos.status === 401) return redirectToLogin(errorData);
          throw new Error(errorData.mensagem || 'Erro no histórico de pedidos.');
        }
        const pedidos = await resPedidos.json();
        setHistoricoPedidos(pedidos);
      } catch (err) {
        setErrorPedidos(err.message);
      } finally {
        setLoadingPedidos(false);
      }

      try {
        setLoadingEstoque(true);
        const resEstoque = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produtos/loja/${slug}`, {
          credentials: 'include'
        });
        if (!resEstoque.ok) {
          const errorData = await resEstoque.json();
          if (resEstoque.status === 401) return redirectToLogin(errorData);
          throw new Error(errorData.mensagem || 'Erro ao buscar estoque.');
        }
        const produtos = await resEstoque.json();
        setProdutosEstoque(produtos);
      } catch (err) {
        setErrorEstoque(err.message);
      } finally {
        setLoadingEstoque(false);
      }

      try {
        setLoadingCancelamentos(true);
        const resCancel = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/order-cancellations/loja/${slug}/pendentes`, {
          credentials: 'include'
        });
        if (!resCancel.ok) throw new Error('Erro ao buscar cancelamentos.');
        const data = await resCancel.json();
        setCancelamentos(data);
      } catch (err) {
        setErrorCancelamentos(err.message);
      } finally {
        setLoadingCancelamentos(false);
      }
    };

    fetchAllDashboardData();
  }, [router.isReady, slug, fetchEmpresaIdFromToken, redirectToLogin]);


  }, [router.isReady, slug, router , tipoLoja]); 

  // Função para obter a URL da imagem do produto (para ControleEstoqueTable se ela for usar imagens)
  // Se essa função já existe em outro lugar ou é um helper, pode importá-la.

  const getImagemProduto = (imagePathOrFullUrl) => {
    if (!imagePathOrFullUrl) return '/placeholder.png';
    if (imagePathOrFullUrl.startsWith('http')) return imagePathOrFullUrl;
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, '') || '';
    return `${baseUrl}/uploads/produtos/${imagePathOrFullUrl}`;
  };

  if (!tipoLoja) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-white">
            <p className="text-gray-700 text-lg">Carregando...</p>
        </div>
    );
}


  return (
    <OwnerSidebar slug={slug}>
      <div className="p-8 max-w-6xl mx-auto bg-white rounded-lg shadow-md min-h-[600px]">
        <h1 className="text-3xl font-bold text-[#3681B6] mb-6">Dashboard Overview</h1>

        <button
          onClick={() => setMostrarResumo((prev) => !prev)}
          className="w-full bg-blue-100 text-blue-800 border border-blue-300 px-4 py-3 rounded-lg text-left hover:bg-blue-200 transition-colors mb-6"
        >
          📊 {tipoLoja === "atendimento" ? "Ver Resumo de Atendimentos" : "Ver Resumo Financeiro da Loja"}
        </button>

        {mostrarResumo && (
          tipoLoja === "atendimento"
            ? <DashboardAtendimento slug={slug} />
            : <DashboardMetrics slug={slug} />
        )}

        {tipoLoja !== "atendimento" && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Histórico de Pedidos</h2>
              {loadingPedidos
                ? <p>Carregando histórico de pedidos...</p>
                : errorPedidos
                  ? <p className="text-red-500">Erro: {errorPedidos}</p>
                  : historicoPedidos.length === 0
                    ? <p>Nenhum pedido encontrado.</p>
                    : <HistoricoVendasTable pedidos={historicoPedidos} />}
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Controle de Estoque</h2>
              {loadingEstoque
                ? <p>Carregando estoque...</p>
                : errorEstoque
                  ? <p className="text-red-500">Erro: {errorEstoque}</p>
                  : produtosEstoque.length === 0
                    ? <p>Nenhum produto encontrado.</p>
                    : <ControleEstoqueTable
                        produtos={produtosEstoque}
                        slugLoja={slug}
                        getImagemProduto={getImagemProduto}
                      />}
            </div>
          </>
        )}
      </div>
    </OwnerSidebar>
  );
}
