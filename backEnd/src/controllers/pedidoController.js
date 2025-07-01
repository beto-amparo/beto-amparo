import * as PedidoModel from '../models/ProdutoModel.js';
import supabase from '../config/SupaBase.js';
import jwt from 'jsonwebtoken'; // Para decodificar o token
import * as lojaModel from '../models/Loja.js';
import { trackMissionProgress } from '../../services/missionTrackerService.js';
import { decrementarEstoque } from '../controllers/produto/ProdutoController.js';
console.log('DEBUG: pedidoController.js carregado.');

// Função auxiliar para obter ID da empresa do token
async function getEmpresaIdFromToken(req) {
  const token = req.cookies?.token_empresa;
  if (!token) return { error: { message: 'Token não fornecido no cookie' } };
  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return { empresaId: decoded.id }; // Retorna o ID da empresa do token
  } catch (err) {
      return { error: { message: 'Token inválido ou expirado' } };
  }
}

export const listarTodosPedidosDaLoja = async (req, res) => {
  const { slugLoja } = req.params;

  try {
      const { empresaId: empresaIdDoToken, error: tokenError } = await getEmpresaIdFromToken(req);
      if (tokenError) {
          return res.status(401).json({ error: tokenError.message });
      }

      const { data: lojaDetalhes, error: lojaError } = await lojaModel.buscarLojaPorSlugCompleta(slugLoja);
      if (lojaError || !lojaDetalhes) {
          return res.status(404).json({ mensagem: 'Loja não encontrada com o identificador fornecido.' });
      }

      if (lojaDetalhes.id_empresa !== empresaIdDoToken) {
          return res.status(403).json({ mensagem: 'Acesso negado: Você não tem permissão para acessar pedidos desta loja.' });
      }

      const lojaIdParaPedidos = lojaDetalhes.id;

      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select(`
            *,
            cliente:id_cliente ( id, nome, email, telefone ),
            pedido_itens:pedido_itens ( 
                *,
                produto:produto_id ( id, nome, preco, image, descricao ) 
            )
        `)
        .eq('id_loja', lojaIdParaPedidos)
        .order('data', { ascending: false })

      if (pedidosError) {
          console.error('Erro ao buscar pedidos no Supabase:', pedidosError.message);
          return res.status(500).json({ mensagem: 'Erro ao carregar pedidos da loja.' });
      }

      const pedidosComDadosClienteTratados = pedidos.map(pedido => ({
          ...pedido,
          nome_cliente: pedido.cliente?.nome || pedido.nome || 'Cliente Desconhecido', 
          cliente_email: pedido.cliente?.email || pedido.email || 'N/A',
          cliente_telefone: pedido.cliente?.telefone || pedido.telefone || 'N/A'
      }));

      return res.status(200).json(pedidosComDadosClienteTratados);

  } catch (error) {
      console.error('Erro em listarTodosPedidosDaLoja:', error.name, error.message, error.stack);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token inválido ou expirado.' });
      }
      return res.status(500).json({ mensagem: 'Erro interno do servidor.', detalhes: error.message });
  }
};

// Função para atualizar o status de um pedido
export const atualizarStatusPedido = async (req, res) => {
  const { idPedido } = req.params; // ID do pedido
  const { status } = req.body;     // Novo status (0, 1, 2, 3, 4, 5)

  console.log(`DEBUG: atualizarStatusPedido - Recebido para Pedido ID: ${idPedido}, Novo Status: ${status}`);

  // Validação básica
  if (!status || !['0', '1', '2', '3', '4', '5'].includes(String(status))) {
      return res.status(400).json({ mensagem: 'Status inválido fornecido.' });
  }

  try {
      const { empresaId: empresaIdDoToken, error: tokenError } = await getEmpresaIdFromToken(req);
      if (tokenError) {
          console.warn('DEBUG: atualizarStatusPedido - Token de empresa inválido:', tokenError.message);
          return res.status(401).json({ error: tokenError.message });
      }
      console.log('DEBUG: atualizarStatusPedido - Empresa ID do token:', empresaIdDoToken);

      // 1. Buscar o pedido para verificar a qual loja ele pertence
      const { data: pedidoExistente, error: pedidoError } = await supabase
          .from('pedidos')
          .select('id_loja')
          .eq('id', idPedido)
          .single();

      if (pedidoError || !pedidoExistente) {
          console.error('DEBUG: atualizarStatusPedido - Erro ao buscar pedido:', pedidoError?.message || 'Pedido não encontrado.');
          return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
      }
      console.log('DEBUG: atualizarStatusPedido - Pedido ID:', idPedido, 'pertence à Loja ID:', pedidoExistente.id_loja);

      // 2. Buscar detalhes da loja para verificar se a empresa logada é a dona
      const { data: lojaDetalhes, error: lojaError } = await lojaModel.buscarLojaPorId(pedidoExistente.id_loja);

      if (lojaError || !lojaDetalhes) {
          console.error('DEBUG: atualizarStatusPedido - Erro ao buscar loja para verificação de permissão:', lojaError?.message || 'Loja não encontrada.');
          return res.status(404).json({ mensagem: 'Loja associada ao pedido não encontrada.' });
      }
      console.log('DEBUG: atualizarStatusPedido - Loja ID:', lojaDetalhes.id, 'Dona Empresa ID:', lojaDetalhes.id_empresa);

      // 3. Autorização: Verificar se o ID da empresa do token corresponde ao dono da loja do pedido
      if (lojaDetalhes.id_empresa !== empresaIdDoToken) {
          console.warn('DEBUG: atualizarStatusPedido - Acesso negado. Empresa do token', empresaIdDoToken, 'não é dona da loja', lojaDetalhes.id, 'do pedido', idPedido);
          return res.status(403).json({ mensagem: 'Acesso negado: Você não tem permissão para alterar este pedido.' });
      }

      // 4. Se o status for '4' (Finalizado), executar a lógica de estoque e missões
      if (String(status) === '4') {
          console.log('DEBUG: atualizarStatusPedido - Status é 4 (Finalizado). Iniciando lógica de estoque e missões.');
          const { data: pedidoItens, error: itensError } = await supabase
              .from('pedido_itens')
              .select(`
                  *,
                  produto:produto_id ( id, nome, quantidade, controlar_estoque )
              `)
              .eq('pedido_id', idPedido);

          if (itensError) {
              console.error('DEBUG: atualizarStatusPedido - Erro ao buscar itens para decrementar estoque:', itensError.message);
              return res.status(500).json({ mensagem: 'Erro ao buscar itens do pedido para finalizar.' });
          }

          let itensInvalidos = [];
          for (const item of pedidoItens) {
              if (item.produto.controlar_estoque && item.produto.quantidade < item.quantidade) {
                  itensInvalidos.push({
                      produto: item.produto.nome,
                      disponivel: item.produto.quantidade,
                      solicitado: item.quantidade
                  });
              }
          }

          if (itensInvalidos.length > 0) {
              return res.status(400).json({
                  erro: 'Quantidade insuficiente no estoque para finalizar o pedido.',
                  itens: itensInvalidos,
                  sugestao: 'Verifique o estoque dos produtos antes de finalizar.'
              });
          }

          const decrementoPromises = pedidoItens.map(async (item) => {
              if (item.produto.controlar_estoque) {
                  const { success, newQuantity, error } = await decrementarEstoque(item.produto.id, item.quantidade);
                  if (!success) {
                      console.error(`Falha ao decrementar estoque para produto ${item.produto.id}:`, error);
                      throw new Error(`Falha crítica ao atualizar estoque do produto ${item.produto.nome}: ${error}`);
                  }
                  if (newQuantity === 0) {
                      console.log(`DEBUG_MISSAO: Produto ID ${item.produto.id} da loja ${lojaDetalhes.id} zerou o estoque. Chamando trackMissionProgress para 'product_sold_out'.`);
                      await trackMissionProgress(lojaDetalhes.id, 'product_sold_out', 1);
                  }
              }
          });
          await Promise.all(decrementoPromises);

          // Rastreamento de missão de venda (Primeira Venda, Vendedor Prata, Mestre de Vendas Diário)
          // Se 'Mestre de Vendas Diário' tem type: 'sale', então a chamada única para 'sale' já cobre.
          await trackMissionProgress(lojaDetalhes.id, 'sale', 1);
          console.log('DEBUG_MISSAO: Missão "sale" (Primeira Venda, Vendedor Prata, Mestre de Vendas Diário) rastreada para LOJA:', lojaDetalhes.id);
      }

      // 5. Atualizar o status do pedido no banco de dados
      const { data: pedidoAtualizado, error: updateError } = await supabase
          .from('pedidos')
          .update({
              status: status,
              // Se o status for '4' (Finalizado), adicione a data de finalização
              data_finalizacao: (String(status) === '4') ? new Date().toISOString() : null // Use ISO string para Supabase
          })
          .eq('id', idPedido)
          .select()
          .single();

      if (updateError) {
          console.error('DEBUG: atualizarStatusPedido - Erro ao atualizar status no DB:', updateError);
          return res.status(500).json({ mensagem: 'Erro ao atualizar status do pedido.' });
      }

      console.log(`DEBUG: Pedido ${idPedido} atualizado para status ${status} com sucesso.`);
      res.status(200).json({ mensagem: 'Status do pedido atualizado com sucesso!', pedido: pedidoAtualizado });

  } catch (error) {
      console.error('DEBUG: atualizarStatusPedido - ERRO CAPTURADO NO CATCH:', error.name, error.message, error.stack);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token inválido ou expirado.' });
      }
      res.status(500).json({ mensagem: 'Erro interno do servidor.', detalhes: error.message });
  }
};

export const listarPedidosPorCliente = async (req, res) => {
      const { slug, clienteId } = req.params; // ID do cliente vindo da URL como 'clienteId'
  
      try {
          // Busca o ID da loja pelo slug
          const { data: loja, error: lojaError } = await supabase
              .from('loja') 
              .select('id')
              .eq('slug_loja', slug)
              .single();
  
          if (lojaError || !loja) {
              return res.status(404).json({ erro: 'Loja não encontrada' });
          }
  
          const lojaId = loja.id;
  
          let query = supabase
              .from('pedidos')
              .select(`
                  *,
                  order_cancellations!left ( status, motivo_rejeicao )
              `)
              .eq('id_loja', lojaId)
              .order('data', { ascending: false }); 
  
          // --- MUDANÇA AQUI ---
          if (clienteId) { // Use 'clienteId' em vez de 'cliente_id'
              query = query.eq('id_cliente', clienteId); 
          }
  
          const { data: pedidos, error } = await query;
  
          if (error) {
              console.error('Erro ao buscar pedidos:', error);
              return res.status(500).json({ erro: 'Erro ao buscar pedidos' });
          }
          
          const pedidosFormatados = pedidos.map(pedido => {
            const cancellation_data = (Array.isArray(pedido.order_cancellations) && pedido.order_cancellations.length > 0)
                ? pedido.order_cancellations[0]
                : {};
  
            delete pedido.order_cancellations;
            return {
                ...pedido,
                cancellation_status: cancellation_data.status || null,
                rejection_reason: cancellation_data.motivo_rejeicao || null, 
            };
        });
  
  
          res.status(200).json(pedidosFormatados);
  
      } catch (error) {
          console.error("Erro interno no servidor em listarPedidosPorCliente:", error);
          res.status(500).json({ erro: 'Erro interno no servidor' });
      }
  };

export const getItensDoPedido = async (req, res) => {
  const { idPedido } = req.params;

  // Busca os itens do pedido
  const { data: itens, error: itensError } = await supabase
    .from('pedido_itens')
    .select('*')
    .eq('pedido_id', idPedido);

  if (itensError) {
    console.error(itensError);
    return res.status(500).json({ erro: 'Erro ao buscar itens do pedido.' });
  }

  // Para cada item, busca o nome do produto correspondente
  const itensComNome = await Promise.all(itens.map(async (item) => {
    const { data: produto, error: produtoError } = await supabase
      .from('produto')
      .select('nome')
      .eq('id', item.produto_id)
      .single();

    return {
      ...item,
      nome_produto: produto ? produto.nome : 'Produto não encontrado'
    };
  }));

  res.json(itensComNome);
};

// FUNÇÃO: getHistoricoPedidos
export const getHistoricoPedidos = async (req, res) => {
      console.log('DEBUG: PedidoController.js: Chamando getHistoricoPedidos!'); 
      try {
          console.log('DEBUG: getHistoricoPedidos - Iniciando bloco TRY.'); 
  
          const { slugLoja } = req.params;
          console.log('DEBUG: getHistoricoPedidos - Slug da loja recebido:', slugLoja);
    
          const { empresaId: empresaIdDoToken, error: tokenError } = await getEmpresaIdFromToken(req);
          if (tokenError) {
              console.warn('DEBUG: getHistoricoPedidos - Token de empresa inválido:', tokenError.message);
              return res.status(401).json({ error: tokenError.message });
          }
          console.log('DEBUG: getHistoricoPedidos - Empresa ID do token:', empresaIdDoToken);
    
          const { data: lojaDetalhes, error: lojaError } = await lojaModel.buscarLojaPorSlugCompleta(slugLoja);
          if (lojaError || !lojaDetalhes) {
              console.error('DEBUG: getHistoricoPedidos - Erro ao buscar loja por slug:', lojaError?.message || 'Loja não encontrada para o slug:', slugLoja);
              return res.status(404).json({ mensagem: 'Loja não encontrada com o identificador fornecido.' });
          }
          console.log('DEBUG: getHistoricoPedidos - Loja encontrada para slug:', slugLoja, 'ID:', lojaDetalhes.id, 'Empresa ID:', lojaDetalhes.id_empresa);
    
          if (lojaDetalhes.id_empresa !== empresaIdDoToken) {
              console.warn('DEBUG: getHistoricoPedidos - Acesso negado. Loja', slugLoja, 'não pertence à empresa', empresaIdDoToken);
              return res.status(403).json({ mensagem: 'Acesso negado: Você não tem permissão para acessar pedidos desta loja.' });
          }
          
          const lojaIdParaPedidos = lojaDetalhes.id;
          console.log('DEBUG: getHistoricoPedidos - Buscando histórico para loja ID:', lojaIdParaPedidos);
    
          const { data: pedidos, error: pedidosError } = await PedidoModel.listarPedidosDaLoja(lojaIdParaPedidos);
    
          if (pedidosError) {
              console.error('DEBUG: getHistoricoPedidos - Erro ao buscar histórico de pedidos no modelo:', pedidosError.message);
              return res.status(500).json({ mensagem: 'Erro ao carregar histórico de pedidos.' });
          }
          console.log('DEBUG: getHistoricoPedidos - Histórico de pedidos carregado com sucesso:', pedidos.length, 'pedidos.');
          return res.status(200).json(pedidos);
      } catch (error) {
          console.error('DEBUG: getHistoricoPedidos - ERRO CAPTURADO NO CATCH:', error.name, error.message, error.stack);
          if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
              return res.status(401).json({ error: 'Token inválido ou expirado.' });
          }
          return res.status(500).json({ mensagem: 'Erro interno do servidor.', detalhes: error.message });
      }
  };

// FUNÇÃO: getDadosGraficoVendas
export const getDadosGraficoVendas = async (req, res) => {
  console.log('DEBUG: PedidoController.js: Chamando getDadosGraficoVendas!');
  try {
      const { slugLoja } = req.params; // Pega o slug da loja da URL
      console.log('DEBUG: getDadosGraficoVendas - Slug da loja recebido:', slugLoja);

      const { empresaId: empresaIdDoToken, error: tokenError } = await getEmpresaIdFromToken(req);
      if (tokenError) {
          console.warn('DEBUG: getDadosGraficoVendas - Token de empresa inválido:', tokenError.message);
          return res.status(401).json({ error: tokenError.message });
      }
      console.log('DEBUG: getDadosGraficoVendas - Empresa ID do token:', empresaIdDoToken);

      // 1. Buscar a loja pelo slug para obter o ID e o ID da empresa associada
      const { data: lojaDetalhes, error: lojaError } = await lojaModel.buscarLojaPorSlugCompleta(slugLoja);
      if (lojaError || !lojaDetalhes) {
          console.error('DEBUG: getDadosGraficoVendas - Erro ao buscar loja por slug:', lojaError?.message || 'Loja não encontrada para o slug:', slugLoja);
          return res.status(404).json({ mensagem: 'Loja não encontrada com o identificador fornecido.' });
      }
      console.log('DEBUG: getDadosGraficoVendas - Loja encontrada para slug:', slugLoja, 'ID:', lojaDetalhes.id, 'Empresa ID:', lojaDetalhes.id_empresa);

      // 2. Verificar se a loja pertence à empresa do token (Autorização)
      if (lojaDetalhes.id_empresa !== empresaIdDoToken) {
          console.warn('DEBUG: getDadosGraficoVendas - Acesso negado. Loja', slugLoja, 'não pertence à empresa', empresaIdDoToken);
          return res.status(403).json({ mensagem: 'Acesso negado: Você não tem permissão para acessar dados desta loja.' });
      }

      const { periodo } = req.query;
      const lojaIdParaGrafico = lojaDetalhes.id; // ID da loja para buscar dados do gráfico
      console.log('DEBUG: getDadosGraficoVendas - Buscando dados do gráfico para loja ID:', lojaIdParaGrafico, 'Período:', periodo);

      const { data: dadosGrafico, error: graficoError } = await PedidoModel.getDadosVendasAgregados(lojaIdParaGrafico, periodo);

      if (graficoError) {
          console.error('DEBUG: getDadosGraficoVendas - Erro ao buscar dados para gráfico de vendas no modelo:', graficoError.message);
          return res.status(500).json({ mensagem: 'Erro ao carregar dados do gráfico.' });
      }
      console.log('DEBUG: getDadosGraficoVendas - Dados do gráfico carregados com sucesso.');
      return res.status(200).json(dadosGrafico);
  } catch (error) {
      console.error('DEBUG: getDadosGraficoVendas - Erro inesperado no controlador:', error);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token inválido ou expirado.' });
      }
      return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

export async function listarPedidosPorEmpresa(req, res) {
  const { slug } = req.params;
  const { cliente_id } = req.query; 

  try {
    const { data: loja, error: lojaError } = await supabase
      .from('loja')
      .select('id')
      .eq('slug_loja', slug)
      .single();

    if (lojaError || !loja) {
      console.error('Erro ao buscar loja:', lojaError);
      return res.status(404).json({ erro: 'Loja não encontrada' });
    }

    const lojaId = loja.id;

    let query = supabase
      .from('pedidos')
      .select('*')
      .eq('id_loja', lojaId);

    if (cliente_id) {
      query = query.eq('id_cliente', cliente_id); 
    }

    const { data: pedidos, error } = await query;

    if (error) {
      console.error('Erro ao buscar pedidos:', error);
      return res.status(500).json({ erro: 'Erro ao buscar pedidos' });
    }

    res.json(pedidos);
  } catch (error) {
    console.error('Erro inesperado:', error);
    res.status(500).json({ erro: 'Erro ao buscar pedidos' });
  }
}

export const getPedidoPorId = async (req, res) => {
  const { slug, pedidoId } = req.params;

  try {
    // 1. Buscar loja pelo slug
    const { data: loja, error: lojaError } = await supabase
      .from('loja')
      .select('id')
      .eq('slug_loja', slug)
      .single();

    if (lojaError || !loja) {
      return res.status(404).json({ erro: 'Loja não encontrada' });
    }

    // 2. Buscar o pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .eq('id_loja', loja.id)
      .single();

    if (pedidoError || !pedido) {
      return res.status(404).json({ erro: 'Pedido não encontrado' });
    }

    // 3. Buscar os itens do pedido com os dados do produto
    const { data: itens, error: itensError } = await supabase
      .from('pedido_itens')
      .select(`
        *,
        produto:produto_id ( nome, preco, image, descricao )
      `)
      .eq('pedido_id', pedidoId);

    if (itensError) {
      return res.status(500).json({ erro: 'Erro ao buscar itens do pedido' });
    }

    // 4. Retornar dados completos
    res.json({
      ...pedido,
      itens: itens || []
    });

  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ erro: 'Erro interno ao buscar pedido' });
  }
};


export async function criarPedido(req, res) {
  try {
      // Remova 'data' e 'status' do desestruturamento se não forem vir do frontend para o rascunho
      const { id_cliente, id_loja, total, observacoes, desconto } = req.body; 

      if (!id_cliente || !id_loja || !total || observacoes === undefined || desconto === undefined) {
          return res.status(400).json({ erro: 'Campos obrigatórios ausentes: id_cliente, id_loja, total, observacoes, desconto.' });
      }

      // Gerar a data e hora ATUAIS no backend em formato ISO (UTC)
      const dataPedidoComHora = new Date().toISOString(); 

      const { data: loja, error: lojaError } = await lojaModel.buscarLojaPorId(id_loja);
      if (lojaError) {
          console.error('Erro ao buscar status da loja:', lojaError);
          return res.status(500).json({ erro: 'Erro interno ao verificar status da loja.' });
      }
      if (!loja) {
          return res.status(404).json({ erro: 'Loja não encontrada para o ID fornecido.' });
      }
      if (loja.is_closed_for_orders) {
          return res.status(403).json({ erro: 'Esta loja está fechada para pedidos no momento.' });
      }
      
      const { data: novoPedido, error } = await supabase
          .from('pedidos')
          .insert([
              {
                  id_cliente,
                  id_loja,
                  data: dataPedidoComHora, 
                  total,
                  status: -1, // Status -1 para "carrinho aberto / rascunho"
                  observacoes,
                  desconto
              }
          ])
          .select()
          .single();

      if (error) {
          console.error('Erro ao criar pedido:', error);
          return res.status(500).json({ erro: 'Erro interno ao criar pedido' });
      }

      // As chamadas para trackMissionProgress (e seus console.log de DEBUG_MISSAO)
      // devem ocorrer na função 'finalizarPedido', quando a compra é de fato concluída.

      res.status(201).json(novoPedido); // Retorna o pedido criado (rascunho)

  } catch (error) {
      console.error('Erro ao criar pedido:', error);
      res.status(500).json({ erro: 'Erro interno ao criar pedido', detalhes: error.message });
  }
}

export async function adicionarItemPedido(req, res) {
  try {
    const { pedido_id, produto_id, quantidade, preco_unitario } = req.body;

    if (!pedido_id || !produto_id || !quantidade || !preco_unitario) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
    }

    const { data: itemInserido, error } = await supabase
      .from('pedido_itens')
      .insert([
        {
          pedido_id,
          produto_id,
          quantidade,
          preco_unitario
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar item ao pedido:', error);
      return res.status(500).json({ erro: 'Erro interno ao adicionar item' });
    }

    res.status(201).json(itemInserido);

  } catch (error) {
    console.error('Erro ao adicionar item ao pedido:', error);
    res.status(500).json({ erro: 'Erro interno ao adicionar item' });
  }
}

export async function obterPedidoPorId(req, res) {
  const { pedidoId } = req.params;

  try {
    // Buscar o pedido pelo ID
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !pedido) {
      return res.status(404).json({ erro: 'Pedido não encontrado' });
    }

    // Buscar os itens relacionados a esse pedido
    const { data: itens, error: itensError } = await supabase
      .from('pedido_itens')
      .select(`
        *,
        produto:produto_id ( nome, image, descricao, preco )
      `)
      .eq('pedido_id', pedidoId);

    if (itensError) {
      return res.status(500).json({ erro: 'Erro ao buscar itens do pedido' });
    }

    res.json({
      ...pedido,
      itens: itens || []
    });
  } catch (error) {
    console.error('Erro ao obter pedido por ID:', error);
    res.status(500).json({ erro: 'Erro interno ao obter pedido' });
  }
}

export async function finalizarPedido(req, res) {
  console.log('--- FINALIZAR PEDIDO INICIADO NO CONTROLLER ---'); 
  console.log('finalizarPedido - req.params:', req.params);
  console.log('finalizarPedido - req.body:', req.body);

  const { slug } = req.params;
  const { metodoPagamento, enderecoEntrega, clienteId, itens } = req.body; // 'desconto' virá do pedido rascunho
  console.log("BODY recebido em finalizarPedido:", req.body);
  console.log("slug:", slug);

  if (!slug || !metodoPagamento || !enderecoEntrega || !clienteId || !Array.isArray(itens)) {
      return res.status(400).json({
          erro: 'Dados incompletos para finalizar pedido.'
      });
  }

  const pedidoId = itens?.[0]?.pedido_id;
  if (!pedidoId) {
      return res.status(400).json({
          erro: 'ID do pedido não fornecido nos itens.'
      });
  }

  try {
      const { data: loja, error: lojaError } = await supabase
          .from('loja')
          .select('id, id_empresa')
          .eq('slug_loja', slug)
          .single();

      if (lojaError || !loja) {
          console.error('Erro Supabase ao buscar loja:', lojaError);
          return res.status(404).json({ erro: 'Loja não encontrada.' });
      }

      const { data: pedido, error: pedidoError } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', pedidoId)
          .eq('id_cliente', clienteId)
          .eq('status', -1) // Garante que só finaliza rascunhos
          .single();

      if (pedidoError || !pedido) {
          console.error("Erro ao buscar pedido para finalizar:", pedidoError);
          return res.status(400).json({
              erro: 'Pedido não encontrado ou já foi processado/finalizado.',
              detalhes: { pedidoId, clienteId, lojaId: loja.id }
          });
      }
      
      const { data: pedido_itens, error: itensError } = await supabase
          .from('pedido_itens')
          .select(`
              *,
              produto:produto_id ( id, nome, preco, quantidade, controlar_estoque )
          `)
          .eq('pedido_id', pedidoId);

      if (itensError) {
          return res.status(500).json({ erro: 'Erro ao buscar itens do pedido para estoque.' });
      }
      pedido.pedido_itens = pedido_itens || [];

      let itensInvalidos = [];
      let subtotal = 0;
      for (const item of pedido.pedido_itens) {
          subtotal += item.quantidade * item.produto.preco;
          if (item.produto.controlar_estoque && item.produto.quantidade < item.quantidade) {
              itensInvalidos.push({
                  produto: item.produto.nome,
                  disponivel: item.produto.quantidade,
                  solicitado: item.quantidade
              });
          }
      }
      if (itensInvalidos.length > 0) {
          return res.status(400).json({
              erro: 'Quantidade insuficiente no estoque para finalizar o pedido.',
              itens: itensInvalidos
          });
      }

      const decrementoPromises = pedido.pedido_itens.map(async (item) => {
          if (item.produto.controlar_estoque) {
              const { success, newQuantity, error } = await decrementarEstoque(item.produto.id, item.quantidade);
              if (!success) {
                  console.error(`Falha ao decrementar estoque para produto ${item.produto.id}:`, error);
                  throw new Error(`Falha crítica ao atualizar estoque do produto ${item.produto.nome}: ${error}`);
              }
              if (newQuantity === 0) {
                  await trackMissionProgress(loja.id, 'product_sold_out', 1);
              }
          }
      });
      await Promise.all(decrementoPromises);

      const totalFinal = subtotal - (pedido.desconto || 0); // Usa o desconto que já está no pedido ou 0

      const { data: pedidoAtualizado, error: updateError } = await supabase
          .from('pedidos')
          .update({
              status: 0, // O pedido agora vai para "Aguardando confirmação" (status 0)
              metodo_pagamento: metodoPagamento,
              endereco_entrega: enderecoEntrega,
              desconto: pedido.desconto, // Mantém o desconto original do pedido rascunho
              total: totalFinal,
              data_finalizacao: null // Só é setado quando o status for 4 (Finalizado pela loja)
          })
          .eq('id', pedido.id)
          .eq('id_cliente', clienteId)
          .select()
          .single();

      if (updateError) {
          console.error('Erro ao atualizar pedido ao finalizar:', updateError);
          return res.status(500).json({ erro: 'Erro ao atualizar pedido' });
      }

      // CHAMADAS PARA trackMissionProgress
      const lojaIdParaMissao = loja.id;
      if (lojaIdParaMissao) {
          await trackMissionProgress(lojaIdParaMissao, 'sale', 1);
          console.log('DEBUG_MISSAO: Missão "sale" rastreada para LOJA:', lojaIdParaMissao); 
          await trackMissionProgress(lojaIdParaMissao, 'daily_sales', 1); // Exemplo, se ainda usa
          console.log('DEBUG_MISSAO: Missão "daily_sales" rastreada para LOJA:', lojaIdParaMissao); 
      } else {
          console.warn('finalizarPedido: Não foi possível rastrear missões de venda: ID da loja não encontrado.');
      }

      res.status(200).json({
          sucesso: true,
          pedido: { ...pedidoAtualizado, itens: pedido.pedido_itens },
          resumo: { subtotal, desconto: pedido.desconto, total: totalFinal }, 
          mensagem: 'Pedido finalizado pelo cliente e aguardando confirmação da loja.'
      });

  } catch (error) {
      console.error('Erro detalhado em finalizarPedido (catch geral):', error);
      res.status(500).json({
          erro: 'Erro interno no servidor ao finalizar pedido.',
          detalhes: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
  }
}
export const cancelarPedidoDireto = async (req, res) => {
  const pedidoId = req.params.idPedido; 
  const { clienteId } = req.body;     

  console.log(`[BACKEND DEBUG] Recebida requisição de cancelamento direto para Pedido ID: ${pedidoId} pelo Cliente ID: ${clienteId}`);

  try {
      // --- 1. BUSCAR O PEDIDO EXISTENTE NO SUPABASE ---
      const { data: pedido, error: fetchError } = await supabase
          .from('pedidos') // Confirme o NOME DA SUA TABELA DE PEDIDOS
          .select('*')
          .eq('id', pedidoId)
          .single();

      // Tratamento de erro para a busca do pedido
      if (fetchError) {
          if (fetchError.code === 'PGRST116') { 
              console.log(`[BACKEND DEBUG] Pedido ID ${pedidoId} não encontrado.`);
              return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
          } else {
              console.error(`[BACKEND ERROR] Erro ao buscar pedido ID ${pedidoId}:`, fetchError.message);
              throw new Error(`Erro ao buscar pedido: ${fetchError.message}`);
          }
      }

      if (!pedido) {
           console.log(`[BACKEND DEBUG] Pedido ID ${pedidoId} não encontrado (Supabase retornou null).`);
           return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
      }

      console.log(`[BACKEND DEBUG] Pedido encontrado. Status atual: ${pedido.status}`);
      console.log(`[BACKEND DEBUG] ID do cliente do pedido: ${pedido.id_cliente}. ID do cliente da requisição: ${clienteId}.`); // Confirme 'id_cliente'

      // --- 2. VALIDAÇÕES DE SEGURANÇA E LÓGICA DE NEGÓCIO ---
      if (pedido.id_cliente !== clienteId) { 
          console.log(`[BACKEND DEBUG] Tentativa de cancelamento não autorizada. Cliente do pedido (${pedido.id_cliente}) não corresponde ao cliente da requisição (${clienteId}).`);
          return res.status(403).json({ mensagem: 'Você não tem permissão para cancelar este pedido.' });
      }

      if (String(pedido.status) !== '0') {
          console.log(`[BACKEND DEBUG] Pedido ID ${pedidoId} não está no status '0'. Status atual: ${pedido.status}. Não permite cancelamento direto.`);
          return res.status(400).json({ mensagem: 'Este pedido não pode ser cancelado diretamente (somente pedidos em "Aguardando confirmação").' });
      }

      // --- 3. ATUALIZAR O PEDIDO NO SUPABASE ---
      // Agora, atualizamos APENAS o 'status' para 5 (Cancelado).
      // Não há referência a 'cancellation_status' aqui.
      const { data: updatedPedido, error: updateError } = await supabase
          .from('pedidos') // Confirme o NOME DA SUA TABELA DE PEDIDOS
          .update({
              status: 5               // Define o status do pedido como '5' (Cancelado)
          })
          .eq('id', pedidoId)
          .select() 
          .single();

      if (updateError) {
          console.error(`[BACKEND ERROR] Erro ao atualizar pedido ID ${pedidoId}:`, updateError.message);
          throw new Error(`Erro ao atualizar pedido: ${updateError.message}`);
      }

      console.log(`[BACKEND DEBUG] Pedido ID ${pedidoId} salvo no banco de dados. Novo Status: ${updatedPedido.status}.`);

      return res.status(200).json({ mensagem: 'Pedido cancelado com sucesso!', pedido: updatedPedido });

  } catch (error) {
      console.error(`[BACKEND ERROR] Erro geral no cancelamento direto para ID ${pedidoId}:`, error.message);
      return res.status(500).json({ mensagem: `Erro interno do servidor: ${error.message || 'Erro desconhecido'}` });
  }
};