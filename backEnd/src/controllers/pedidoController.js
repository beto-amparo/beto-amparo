import { buscarPedidosPorSlug } from '../models/PedidoModel.js';
import * as PedidoModel from '../models/PedidoModel.js';
import supabase from '../config/SupaBase.js';
import jwt from 'jsonwebtoken'; // Para decodificar o token
import * as lojaModel from '../models/Loja.js';
import { trackMissionProgress } from '../../services/missionTrackerService.js';

async function getEmpresaIdFromToken(req) {
  const token = req.cookies?.token_empresa;
  if (!token) return { error: { message: 'Token não fornecido no cookie' } };
  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return { empresaId: decoded.id };
  } catch (err) {
      return { error: { message: 'Token inválido ou expirado' } };
  }
}

// controllers/pedidoController.js

export const listarPedidosPorCliente = async (req, res) => {
    const { slug, clienteId } = req.params;

    try {
        // Busca o ID da loja pelo slug
        // A CORREÇÃO ESTÁ AQUI: Voltamos para 'loja' em minúsculo
        const { data: loja, error: lojaError } = await supabase
            .from('loja') 
            .select('id')
            .eq('slug_loja', slug)
            .single();

        if (lojaError || !loja) {
            // Este é o erro que você está recebendo
            return res.status(404).json({ erro: 'Loja não encontrada' });
        }

        // O resto da nossa lógica, que já está correta, continua
        const { data: pedidos, error } = await supabase
            .from('pedidos')
            .select(`
                *,
                order_cancellations!left ( status, motivo_rejeicao )
            `)
            .eq('id_loja', loja.id)
            .eq('id_cliente', clienteId)
            .order('data', { ascending: false });

        if (error) {
            console.error("Erro ao buscar pedidos do cliente:", error);
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
              rejection_reason: cancellation_data.motivo_rejeicao || null, // <--- NOVO CAMPO
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

// --- FUNÇÃO: getHistoricoPedidos ---
export const getHistoricoPedidos = async (req, res) => {
  console.log('DEBUG: PedidoController.js: Chamando getHistoricoPedidos!');
  try {
      const { slugLoja } = req.params; // NOVO: Pega o slug da loja da URL
      console.log('DEBUG: getHistoricoPedidos - Slug da loja recebido:', slugLoja);

      const { empresaId: empresaIdDoToken, error: tokenError } = await getEmpresaIdFromToken(req);
      if (tokenError) {
          console.warn('DEBUG: getHistoricoPedidos - Token de empresa inválido:', tokenError.message);
          return res.status(401).json({ error: tokenError.message });
      }
      console.log('DEBUG: getHistoricoPedidos - Empresa ID do token:', empresaIdDoToken);

      // 1. Buscar a loja pelo slug para obter o ID e o ID da empresa associada
      const { data: lojaDetalhes, error: lojaError } = await lojaModel.buscarLojaPorSlugCompleta(slugLoja);
      if (lojaError || !lojaDetalhes) {
          console.error('DEBUG: getHistoricoPedidos - Erro ao buscar loja por slug:', lojaError?.message || 'Loja não encontrada para o slug:', slugLoja);
          return res.status(404).json({ mensagem: 'Loja não encontrada com o identificador fornecido.' });
      }
      console.log('DEBUG: getHistoricoPedidos - Loja encontrada para slug:', slugLoja, 'ID:', lojaDetalhes.id, 'Empresa ID:', lojaDetalhes.id_empresa);


      // 2. Verificar se a loja pertence à empresa do token (Autorização)
      if (lojaDetalhes.id_empresa !== empresaIdDoToken) {
          console.warn('DEBUG: getHistoricoPedidos - Acesso negado. Loja', slugLoja, 'não pertence à empresa', empresaIdDoToken);
          return res.status(403).json({ mensagem: 'Acesso negado: Você não tem permissão para acessar pedidos desta loja.' });
      }

      // Agora que a loja é validada, use o ID da loja para buscar os pedidos
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
      console.error('DEBUG: getHistoricoPedidos - Erro inesperado no controlador:', error);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token inválido ou expirado.' });
      }
      return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

// --- FUNÇÃO: getDadosGraficoVendas ---
export const getDadosGraficoVendas = async (req, res) => {
  console.log('DEBUG: PedidoController.js: Chamando getDadosGraficoVendas!');
  try {
      const { slugLoja } = req.params; // NOVO: Pega o slug da loja da URL
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


export async function criarPedido(req, res) {
    try {
      const { id_cliente, id_loja, data, total, status, observacoes, desconto } = req.body;
  
      console.log('Dados recebidos:', { id_cliente, id_loja, data, total, observacoes, desconto });
  
      if (!id_cliente || !id_loja || !data || !total || status === undefined) {
        return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
      }
  
      // --- PONTO DE ATUALIZAÇÃO 1: Verificar o status "Fechado para Pedidos" ---
      // Corrija a chamada da função para usar 'lojaModel.buscarLojaPorId'
      const { data: loja, error: lojaError } = await lojaModel.buscarLojaPorId(id_loja); // <--- CORREÇÃO AQUI
      
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
      // --- FIM PONTO DE ATUALIZAÇÃO 1 ---
  
      const { data: novoPedido, error } = await supabase
        .from('pedidos')
        .insert([
          {
            id_cliente,
            id_loja,
            data,
            total,
            status,
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
  
      const ownerId = loja.id_empresa;
      if (ownerId) {
          await trackMissionProgress(ownerId, 'sale', 1);
      } else {
          console.warn('CriarPedido: Não foi possível rastrear missão de venda: ID da empresa (dono) não encontrado para a loja.');
      }
  
      res.status(201).json(novoPedido);
  
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      res.status(500).json({ erro: 'Erro interno ao criar pedido' });
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

