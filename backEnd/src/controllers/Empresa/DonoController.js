import supabase from '../../config/SupaBase.js';
import jwt from 'jsonwebtoken';

class DonoController {

  /**
   * Obtém todos os dados do painel de uma loja específica para o dono autenticado.
   * Requer um slug de loja nos parâmetros da URL e um token JWT de empresa nos cookies.
   */
  async getDonoData(req, res) {
    try {
      // --- PASSO 1: AUTENTICAÇÃO E VALIDAÇÃO INICIAL ---
      const token = req.cookies?.token_empresa;
      if (!token) {
        return res.status(401).json({ error: 'Acesso não autorizado. Faça o login.' });
      }

      let empresaId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        empresaId = decoded.id;
      } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
      }

      const { slug } = req.params;
      if (!slug) {
        return res.status(400).json({ error: 'O slug da loja não foi fornecido.' });
      }

      // --- PASSO 2: BUSCAR A LOJA E VALIDAR A PROPRIEDADE ---
      const { data: loja, error: lojaError } = await supabase
        .from('loja')
        .select('*, empresas(*)') // Busca a loja e a empresa relacionada
        .eq('slug_loja', slug)
        .single();

      if (lojaError || !loja) {
        return res.status(404).json({ error: 'Loja não encontrada.' });
      }

      // Validação de segurança: A loja buscada pertence à empresa do token?
      if (loja.empresas?.id !== empresaId) {
        return res.status(403).json({
          status: 'forbidden',
          title: 'Acesso negado',
          detail: 'Você não tem permissão para acessar os dados desta loja.',
        });
      }

      // --- PASSO 3: BUSCAR DADOS DO PAINEL EM PARALELO ---
      const { empresas: empresa, ...lojaData } = loja;

      const [
        produtosResult,
        novosPedidosResult,
        pedidosFinalizadosResult,
        produtosAtivosResult
      ] = await Promise.all([
        // Busca a lista completa de produtos da loja
        supabase.from('produto').select('*').eq('id_loja', lojaData.id),

        // Conta os pedidos com status 'Novo' (ex: status = 1)
        supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('id_loja', lojaData.id).eq('status', 1),

        // Conta os pedidos com status 'Finalizado' (ex: status = 4)
        supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('id_loja', lojaData.id).eq('status', 4),

        // Conta os produtos com status 'ativo'
        supabase.from('produto').select('id', { count: 'exact', head: true }).eq('id_loja', lojaData.id).eq('ativo', true)
      ]);

      // Extrai os dados e os erros de cada consulta paralela
      const { data: produtos, error: produtosError } = produtosResult;
      const { count: novosPedidosCount, error: novosPedidosError } = novosPedidosResult;
      const { count: pedidosFinalizadosCount, error: pedidosFinalizadosError } = pedidosFinalizadosResult;
      const { count: produtosAtivosCount, error: produtosAtivosError } = produtosAtivosResult;

      // Verifica se houve erro em qualquer uma das consultas
      if (produtosError || novosPedidosError || pedidosFinalizadosError || produtosAtivosError) {
        console.error('Erro ao buscar dados do painel:', produtosError || novosPedidosError || pedidosFinalizadosError || produtosAtivosError);
        return res.status(500).json({ error: 'Erro ao buscar os dados do painel.' });
      }

      // --- PASSO 4: RETORNAR A RESPOSTA COMPLETA ---
      return res.status(200).json({
        empresa,
        loja: lojaData,
        produtos: produtos ?? [],
        novosPedidos: novosPedidosCount ?? 0,
        pedidosFinalizados: pedidosFinalizadosCount ?? 0,
        produtosAtivos: produtosAtivosCount ?? 0,
      });

    } catch (error) {
      console.error('Erro inesperado em getDonoData:', error);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  /**
   * (CONFLITO RESOLVIDO) Busca todas as lojas associadas a uma empresa pelo nome da empresa.
   * Este método é útil para páginas públicas ou de listagem.
   */
  async getLojaPorNomeEmpresa(req, res) {
    try {
      const { nomeEmpresa } = req.params;

      // Buscar a empresa pelo nome (ignora maiúsculas/minúsculas)
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('id, nome') // Seleciona apenas os campos necessários
        .ilike('nome', nomeEmpresa)
        .single();

      if (empresaError || !empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      // Buscar todas as lojas associadas ao id da empresa
      const { data: lojas, error: lojaError } = await supabase
        .from('loja')
        .select('*')
        .eq('id_empresa', empresa.id);

      if (lojaError) {
        return res.status(500).json({ error: 'Erro ao buscar lojas' });
      }

      return res.status(200).json({
        empresa,
        lojas: lojas ?? [],
      });

    } catch (err) {
      console.error('Erro inesperado em getLojaPorNomeEmpresa:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Endpoint auxiliar para obter o ID da empresa a partir do token.
   * Útil para o frontend verificar o ID logado antes de fazer outras requisições.
   */
  async getEmpresaIdFromTokenEndpoint(req, res) {
    console.log('DEBUG: DonoController: Chamando getEmpresaIdFromTokenEndpoint!');
    const token = req.cookies?.token_empresa;
    console.log('DEBUG: DonoController: Token recebido para empresa-id:', token ? 'Sim' : 'Não');

    if (!token) {
      console.warn('DEBUG: DonoController: Token não fornecido para /dono/empresa-id.');
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('DEBUG: DonoController: Token decodificado para empresa-id. ID:', decoded.id);
      return res.status(200).json({ empresaId: decoded.id });
    } catch (err) {
      console.error('DEBUG: DonoController: Erro ao verificar token para /dono/empresa-id:', err.message);
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
  }
}

export default new DonoController();