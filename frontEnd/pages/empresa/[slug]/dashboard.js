// frontEnd/pages/empresa/[slug]/dashboard.js

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';

// Importe seus componentes
import OwnerSidebar from '@/components/OwnerSidebar';
import HistoricoVendasTable from '@/components/HistoricoVendasTable';

import DashboardMetrics from "@/components/DashboardMetrics"
import DashboardAtendimento from "@/components/atendimentodashbord"
import {verificarTipoDeLoja} from '../../../hooks/verificarTipoLoja'

import ControleEstoqueTable from '@/components/ControleEstoqueTable';


export default function DashboardPage() {
  const router = useRouter();
  const { slug } = router.query; // Este é o SLUG DA LOJA (ex: 'ben-burguer')

  const [mostrarResumo, setMostrarResumo] = useState(false);
  // Estados de dados
  const [historicoPedidos, setHistoricoPedidos] = useState([]);
  
  const [produtosEstoque, setProdutosEstoque] = useState([]);

  // Estados de loading
  const [loadingPedidos, setLoadingPedidos] = useState(true);

  const [loadingEstoque, setLoadingEstoque] = useState(true);

  // Estados de erro
  const [errorPedidos, setErrorPedidos] = useState(null);

  const [errorEstoque, setErrorEstoque] = useState(null);

  //Estados para as solicitações de cancelamento
  const [cancelamentos, setCancelamentos] = useState([]);
  const [loadingCancelamentos, setLoadingCancelamentos] = useState(true);
  const [errorCancelamentos, setErrorCancelamentos] = useState(null);
        
  const [tipoLoja , setTipoLoja] = useState("")

  // NOVO: Adicione um estado para o ID da empresa (virá do token)
  const [autenticatedEmpresaId, setAutenticatedEmpresaId] = useState(null);


  useEffect(() => {
    console.log('DEBUG: DashboardPage - useEffect disparado. Router pronto:', router.isReady, 'Slug da loja:', slug);
    if (!router.isReady || !slug) return;

    const redirectToLogin = (errorData) => {
      const targetUrl = errorData.redirectTo || `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
      router.push(targetUrl);
    };

    // Função para obter o ID da empresa a partir do token (precisa de um endpoint no backend)
    const fetchEmpresaIdFromToken = async () => {
        try {
            // Este endpoint deve retornar o ID da empresa do token logado
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/dono/empresa-id`, { credentials: 'include' });
            if (response.status === 401) {
                const errorData = await response.json();
                redirectToLogin(errorData);
                return null;
            }
            if (!response.ok) {
                throw new Error('Falha ao obter ID da empresa do token.');
            }
            const data = await response.json();
            console.log('DEBUG: DashboardPage - ID da empresa do token recebido:', data.empresaId);
            setAutenticatedEmpresaId(data.empresaId); // Define o estado
            return data.empresaId;
        } catch (err) {
            console.error('DEBUG: DashboardPage - Erro ao obter ID da empresa do token:', err.message);
            // setError aqui se quiser mostrar erro na UI
            redirectToLogin({}); // Força redirect em caso de erro grave
            return null;
        }
    };

    // Ações de fetch para o dashboard
    const fetchAllDashboardData = async () => {
        const currentAuthenticatedEmpresaId = await fetchEmpresaIdFromToken();
        if (!currentAuthenticatedEmpresaId) return; // Se falhou em obter o ID, para por aqui
  
        setTipoLoja( await verificarTipoDeLoja(slug))

        // Agora, passe o SLUG para as APIs de histórico e gráfico
        // E o ID da empresa do token para a autorização no backend.

        // Fetch Histórico de Pedidos
        setLoadingPedidos(true);
        setErrorPedidos(null);
        try {
            console.log('DEBUG: DashboardPage - Fetching histórico de pedidos para slug:', slug);
            // A API do backend agora precisa aceitar o slug da loja
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/pedidos/historico/loja/${slug}`, { credentials: 'include' }); // MUDADO: /loja/:slug
            
            if (!response.ok) {
              const errorData = await response.json();
              if (response.status === 401) { redirectToLogin(errorData); return; }
              throw new Error(errorData.mensagem || `Falha ao carregar histórico de pedidos: ${response.status}`);
            }
            const data = await response.json();
            console.log('DEBUG: DashboardPage - Histórico de pedidos recebido:', data);
            setHistoricoPedidos(data);
        } catch (err) {
            setErrorPedidos(err.message);
            console.error('DEBUG: DashboardPage - Erro ao buscar histórico de pedidos:', err);
        } finally {
            setLoadingPedidos(false);
        }

        setLoadingEstoque(true);
        setErrorEstoque(null);
        try {
            console.log('DEBUG: DashboardPage - Fetching produtos para estoque para slug:', slug);
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produtos/loja/${slug}`, { credentials: 'include' });
            if (!response.ok) {
                 const errorData = await response.json();
                 if (response.status === 401) { redirectToLogin(errorData); return; }
                 throw new Error(errorData.mensagem || `Falha ao carregar produtos para estoque: ${response.status}`);
            }
            const data = await response.json();
            console.log('DEBUG: DashboardPage - Produtos para estoque recebidos:', data);
            setProdutosEstoque(data);
        } catch (err) {
            setErrorEstoque(err.message);
            console.error('DEBUG: DashboardPage - Erro ao buscar produtos para estoque:', err);
        } finally {
            setLoadingEstoque(false);
        }
        setLoadingCancelamentos(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/order-cancellations/loja/${slug}/pendentes`, { credentials: 'include' });
                if (!response.ok) throw new Error('Falha ao buscar solicitações');
                const data = await response.json();
                setCancelamentos(data);
            } catch (err) {
                setErrorCancelamentos(err.message);
            } finally {
                setLoadingCancelamentos(false);
            }
    };

    fetchAllDashboardData();

  }, [router.isReady, slug, router]); 

  // Função para obter a URL da imagem do produto (para ControleEstoqueTable se ela for usar imagens)
  // Se essa função já existe em outro lugar ou é um helper, pode importá-la.
  const getImagemProduto = (imagePathOrFullUrl) => {
    if (imagePathOrFullUrl && (imagePathOrFullUrl.startsWith('http://') || imagePathOrFullUrl.startsWith('https://'))) {
      return imagePathOrFullUrl;
    }
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/+$/, '') : '';
    if (imagePathOrFullUrl) {
      return `${baseUrl}/uploads/produtos/${imagePathOrFullUrl}`;
    }
    return '/placeholder.png';
  };


  return (
    <OwnerSidebar slug={slug}>
      <div className="p-8 max-w-6xl mx-auto bg-white rounded-lg shadow-md min-h-[600px]">
        <h1 className="text-3xl font-bold text-[#3681B6] mb-6">Dashboard Overview</h1>

       
        <button
  onClick={async () => {
    setMostrarResumo((prev) => !prev)
  }}
  
  className="w-full bg-blue-100 text-blue-800 border border-blue-300 px-4 py-3 rounded-lg text-left hover:bg-blue-200 transition-colors mb-6"
>
  📊 {tipoLoja === "atendimento"? "Ver Resumo de Atendimentos"  :"Ver Resumo Financeiro da Loja" }
</button>
    
     {/* DasborardMetricas de Pedidos */}
{ tipoLoja !== "atendimento" &&  mostrarResumo && <DashboardMetrics slug ={slug} />}
      {tipoLoja === "atendimento" &&  mostrarResumo &&<DashboardAtendimento  slug ={slug}/>}
        {/* Histórico de Pedidos */}
        {tipoLoja !== "atendimento" && <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Histórico de Pedidos</h2>
          {loadingPedidos ? (
            <p>Carregando histórico de pedidos...</p>
          ) : errorPedidos ? (
            <p className="text-red-500">Erro ao carregar pedidos: {errorPedidos}</p>
          ) : historicoPedidos.length === 0 ? (
            <p>Nenhum pedido encontrado para esta loja.</p>
          ) : (
            <HistoricoVendasTable pedidos={historicoPedidos} />
          )}
        </div>}

        {/* Controle de Estoque */}
       {tipoLoja !== "atendimento" && <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Controle de Estoque</h2>
          {loadingEstoque ? (
            <p>Carregando produtos para estoque...</p>
          ) : errorEstoque ? (
            <p className="text-red-500">Erro ao carregar estoque: {errorEstoque}</p>
          ) : produtosEstoque.length === 0 ? (
            <p>Nenhum produto encontrado para controle de estoque.</p>
          ) : (
            // Passe os produtos e a função getImagemProduto para a tabela de estoque
            <ControleEstoqueTable produtos={produtosEstoque} slugLoja={slug} getImagemProduto={getImagemProduto} /* Adicione a função para ajustar estoque aqui */ />
          )}
        </div>}
      </div>
    </OwnerSidebar>
  );
}