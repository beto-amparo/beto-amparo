import { createClient } from '@supabase/supabase-js';
import supabaseConfig from '../config/SupaBase.js'; // se esse arquivo exporta config
import dotenv from 'dotenv';

dotenv.config(); // carrega variáveis de ambiente

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const OrderCancellationModel = {
  async criar({ order_id, cliente_id, motivo }) {
    console.log("Inserindo cancelamento:", { order_id, cliente_id, motivo });
    const { data, error } = await supabase
      .from('order_cancellations')
      .insert([{ order_id, cliente_id, motivo, status: 'pendente' }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async listar() {
    const { data, error } = await supabase
      .from('order_cancellations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async atualizarStatus(id, status, motivo_rejeicao = null) { // Adicionamos o novo parâmetro
    const updateData = { status };

    if (motivo_rejeicao) {
        updateData.motivo_rejeicao = motivo_rejeicao;
    }

    const { data, error } = await supabase
      .from('order_cancellations')
      .update(updateData) // Usa o objeto de atualização dinâmico
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getOrdens(ids){
    try {
       const { data, error } = await supabase
      .from('order_cancellations')
      .select('*')
      .in('order_id', ids);
      if (error) {
        console.error('Erro ao buscar pedido_itens:', error.message);
        return [];
      }
  
      return data ?? [];
    } catch (e) {
      console.error('Erro inesperado em getPedido_itens:', e);
      return [];
    }

  }
  
};

export default OrderCancellationModel;
