// orderCancellationController.js

import OrderCancellationModel from '../models/OrderCancellationModel.js';
import { atualizarStatusPedido, buscarPedidoPorId } from '../models/PedidoModel.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const orderCancellationController = {
  // Criar pedido de cancelamento (cliente)
  async criar(req, res) {
    try {
      const { order_id } = req.body;
      const pedido = await buscarPedidoPorId(order_id);

      if (!pedido) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      const statusNum = Number(pedido.status);
      const statusPermitidos = [0, 1];
      if (!statusPermitidos.includes(statusNum)) {
        return res.status(400).json({ error: "Pedido não pode ser cancelado nesse status." });
      }
      
      // A função criar do seu Model já define o status como 'pendente'.
      const data = await OrderCancellationModel.criar(req.body);

      // A alteração de status do pedido foi removida daqui.
      res.status(201).json(data);
    } catch (err) {
      // Adicionado tratamento para erro de solicitação duplicada
      if (err.code === '23505') { // Código de violação de unicidade do PostgreSQL
          return res.status(400).json({ error: "Já existe uma solicitação de cancelamento para este pedido." });
      }
      console.error("Erro ao criar cancelamento:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // Listar todas as solicitações (admin)
  async listar(req, res) {
    // Sem alterações
    try {
      const data = await OrderCancellationModel.listar();
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, motivo_rejeicao } = req.body; 

      if (!['aprovado', 'rejeitado'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido.' });
      }

      // MUDANÇA 2: Passa o 'motivo_rejeicao' para a função do Model
      const updatedCancellationRequest = await OrderCancellationModel.atualizarStatus(id, status, motivo_rejeicao);
      
      if (!updatedCancellationRequest) {
          return res.status(404).json({ error: 'Solicitação de cancelamento não encontrada.' });
      }

      if (status === 'aprovado') {
        const order_id = updatedCancellationRequest.order_id; 
        await atualizarStatusPedido(order_id, 5);
      }

      res.status(200).json(updatedCancellationRequest);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async listarPendentesPorLoja(req, res) {
      try {
          const { slug } = req.params;

          const { data, error } = await supabase
              .from('order_cancellations')
              .select(`
                  *,
                  pedidos:order_id!inner (
                      *,
                      Loja:id_loja!inner (
                          slug_loja
                      )
                  )
              `)
              .eq('status', 'pendente')
              .eq('pedidos.Loja.slug_loja', slug); // FILTRO CORRETO

          if (error) {
              console.error('Erro na consulta de JOIN do Supabase:', error);
              throw error;
          }
          console.log('DADOS BRUTOS RECEBIDOS DO SUPABASE:', JSON.stringify(data, null, 2));


          // Formata os dados para garantir que o frontend receba um array limpo
          const formattedData = data.map(item => ({
              id: item.id,
              created_at: item.created_at,
              motivo: item.motivo,
              status: item.status,
              order_id: item.pedidos.id,
          }));

          res.status(200).json(formattedData);

      } catch (err) {
          console.error("Erro ao listar cancelamentos pendentes por loja:", err.message);
          res.status(500).json({ error: "Erro interno ao buscar solicitações." });
      }
  },
};

export default orderCancellationController;