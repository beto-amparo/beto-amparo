// backend/models/pedidoModel.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function buscarPedidosPorSlug(slug) {
  if (!slug) {
    throw new Error("Slug é obrigatório para buscar os pedidos da loja.");
  }

  console.log('DEBUG(Model): Buscando loja com slug:', slug);
  try {
    // 1. Busca o ID da loja pelo slug_loja na tabela 'loja'
    const { data: loja, error: lojaError } = await supabase
      .from('loja') // CONFIRMADO: Nome da tabela é 'loja'
      .select('id')
      .eq('slug_loja', slug) // CONFIRMADO: Coluna do slug na tabela 'loja' é 'slug_loja'
      .single();

    if (lojaError) {
      console.error("DEBUG(Model): Erro Supabase ao buscar loja por slug_loja:", lojaError);
      if (lojaError.code === 'PGRST116') {
        throw new Error('Loja não encontrada para este slug.');
      }
      throw new Error(`Erro no banco de dados ao buscar loja: ${lojaError.message}`);
    }
    if (!loja) {
      throw new Error('Loja não encontrada.');
    }

    console.log('DEBUG(Model): Loja encontrada, ID:', loja.id);

    // 2. Busca os pedidos associados a este id da loja
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id_loja', loja.id) // CONFIRMADO: FK na tabela 'pedidos' é 'id_loja'
      .order('data', { ascending: false }); 
  
    if (pedidosError) {
      console.error("DEBUG(Model): Erro Supabase ao buscar pedidos:", pedidosError);
      throw new Error(`Erro no banco de dados ao buscar pedidos: ${pedidosError.message}`);
    }
    console.log('DEBUG(Model): Pedidos encontrados:', pedidos.length);

    return pedidos;
  } catch (err) {
    console.error("DEBUG(Model): Erro inesperado em buscarPedidosPorSlug:", err);
    throw err;
  }
}

// Função para atualizar o status de um pedido
export async function atualizarStatusPedido(pedidoId, newStatus) {
  if (!pedidoId || newStatus === undefined || newStatus === null) { // Checagem mais robusta para status
    throw new Error("ID do pedido e novo status são obrigatórios para atualização.");
  }
  console.log(`DEBUG(Model): Atualizando status do pedido ${pedidoId} para ${newStatus}`);
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ status: newStatus })
      .eq('id', pedidoId)
      .select();

    if (error) {
      console.error("DEBUG(Model): Erro Supabase ao atualizar status do pedido:", error);
      throw new Error(`Erro no banco de dados ao atualizar status: ${error.message}`);
    }
    console.log("DEBUG(Model): Status atualizado com sucesso:", data);
    return data;
  } catch (err) {
    console.error("DEBUG(Model): Erro inesperado em atualizarStatusPedido:", err);
    throw err;
  }
}
export async function listarPedidosDaLoja(idLoja) {
  console.log('DEBUG: PedidoModel: Listando pedidos para loja ID:', idLoja);
  // O `select` foi ajustado para trazer todos os campos necessários, incluindo JOINs
  let query = supabase
      .from('pedidos')
      .select(`
          *, // Seleciona todos os campos da tabela 'pedidos'
          cliente:id_cliente ( id, nome, email, telefone ), // JOIN com a tabela 'clientes'
          pedido_itens:pedido_itens ( // JOIN com a tabela 'pedido_itens'
              *,
              produto:produto_id ( id, nome, preco, image, descricao ) // JOIN com a tabela 'produto'
          )
      `)
      .eq('id_loja', idLoja)
      .order('data', { ascending: false });

  const { data, error } = await query;

  if (error) {
      console.error('DEBUG: PedidoModel: Erro ao listar pedidos da loja:', error.message);
      return { data: null, error };
  }
  console.log('DEBUG: PedidoModel: Pedidos listados com sucesso:', data.length, 'pedidos.');
  return { data, error: null };
}

export async function getDadosVendasAgregados(idLoja, periodo = 'semana') {
  const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('data, total') // Agora 'data' é TIMESTAMP e 'total' é NUMERIC
      .eq('id_loja', idLoja)
      .not('status', 'eq', 5); // O número 5 é o que representa 'Cancelado'

  if (error) return { data: null, error };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dadosGrafico = {};
  // Lógica para 'semana' (últimos 7 dias)
  if (periodo === 'semana') {
      for (let i = 0; i < 7; i++) {
          const dataLoop = new Date(hoje);
          dataLoop.setDate(hoje.getDate() - i);
          const diaSemana = dataLoop.toLocaleDateString('pt-BR', { weekday: 'short' });
          const dataKey = dataLoop.toISOString().split('T')[0]; // Formato YYYY-MM-DD
          dadosGrafico[dataKey] = { label: diaSemana, total: 0 };
      }
  } else if (periodo === 'mes') {
      // Últimos 30 dias (ou por mês do ano)
      for (let i = 0; i < 30; i++) {
          const dataLoop = new Date(hoje);
          dataLoop.setDate(hoje.getDate() - i);
          const dataFormatada = dataLoop.toLocaleDateString('pt-BR'); // Ex: 07/06
          const dataKey = dataLoop.toISOString().split('T')[0];
          dadosGrafico[dataKey] = { label: dataFormatada, total: 0 };
      }
  }
  // Você pode expandir para 'ano' ou outros períodos

  pedidos.forEach(pedido => {
    const pedidoData = new Date(pedido.data); // 'data' já é um objeto Date se o tipo for timestamp
    pedidoData.setHours(0, 0, 0, 0);
    const dataKey = pedidoData.toISOString().split('T')[0];

    if (dadosGrafico[dataKey]) {
        dadosGrafico[dataKey].total += parseFloat(pedido.total); 
    }
});

  // Ordena os labels e totais para que o gráfico fique em ordem cronológica
  const sortedKeys = Object.keys(dadosGrafico).sort();
  const labels = sortedKeys.map(key => dadosGrafico[key].label);
  const totals = sortedKeys.map(key => dadosGrafico[key].total);


  return { data: { labels, totals }, error: null };
}
export async function buscarPedidoPorId(pedidoId) {
  if (!pedidoId) throw new Error("ID do pedido é obrigatório");
  
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', pedidoId)
    .single();

  if (error) throw error;
  return data;
}

export const getPedido_itens = async (ids) => {
  try {
    const { data, error } = await supabase
      .from('pedido_itens')
      .select('*')
      .in('pedido_id', ids);

    if (error) {
      console.error('Erro ao buscar pedido_itens:', error.message);
      return [];
    }

    return data ?? [];
  } catch (e) {
    console.error('Erro inesperado em getPedido_itens:', e);
    return [];
  }
};


export async function buscarPedidosPorSlugAndData(slug , start , end) {
  if (!slug) {
    throw new Error("Slug é obrigatório para buscar os pedidos da loja.");
  }

  console.log('DEBUG(Model): Buscando loja com slug:', slug);
  try {
    // 1. Busca o ID da loja pelo slug_loja na tabela 'loja'
    const { data: loja, error: lojaError } = await supabase
      .from('loja') // CONFIRMADO: Nome da tabela é 'loja'
      .select('id')
      .eq('slug_loja', slug)
      .single()
      

    if (lojaError) {
      console.error("DEBUG(Model): Erro Supabase ao buscar loja por slug_loja:", lojaError);
      if (lojaError.code === 'PGRST116') {
        throw new Error('Loja não encontrada para este slug.');
      }
      throw new Error(`Erro no banco de dados ao buscar loja: ${lojaError.message}`);
    }
    if (!loja) {
      throw new Error('Loja não encontrada.');
    }

    console.log('DEBUG(Model): Loja encontrada, ID:', loja.id);

    // 2. Busca os pedidos associados a este id da loja
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id_loja', loja.id)
      .eq('status','4') 
      .order('data', { ascending: false }) 
      .gte('data', start)
      .lte('data', end); 
  
    if (pedidosError) {
      console.error("DEBUG(Model): Erro Supabase ao buscar pedidos:", pedidosError);
      throw new Error(`Erro no banco de dados ao buscar pedidos: ${pedidosError.message}`);
    }
    console.log('DEBUG(Model): Pedidos encontrados:', pedidos.length);

    return pedidos;
  } catch (err) {
    console.error("DEBUG(Model): Erro inesperado em buscarPedidosPorSlug:", err);
    throw err;
  }
}