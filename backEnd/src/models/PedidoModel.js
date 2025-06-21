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
      .from('loja') // <--- CONFIRMADO: Nome da tabela é 'loja'
      .select('id')
      .eq('slug_loja', slug) // <--- CONFIRMADO: Coluna do slug na tabela 'loja' é 'slug_loja'
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
      .select(`
        id,
        status,
        total,      // <--- CONFIRMADO: Nome da coluna é 'total' (VARCHAR)
        data,       // <--- CONFIRMADO: Nome da coluna é 'data' (VARCHAR)
        observacoes,
        cliente:id_cliente ( // <--- CONFIRMADO: FK é 'id_cliente' na tabela 'pedidos'
          id,
          nome,      // Assumindo que a tabela 'clientes' tem coluna 'nome'
          telefone   // Assumindo que a tabela 'clientes' tem coluna 'telefone'
          // Adicione outras colunas do cliente que você precise
        ),
        itens_pedido:pedido_itens ( // <--- CONFIRMADO: Tabela 'pedido_itens' e FK 'pedido_id' (para pedidos)
          id,
          quantidade,
          preco_unitario, // CONFIRMADO: preco_unitario em pedido_itens
          produto:produto_id ( // <--- CONFIRMADO: FK 'produto_id' na tabela 'pedido_itens' para 'produtos'
            id,
            nome,
            preco // Assumindo que a tabela 'produtos' tem coluna 'preco'
          )
        )
      `)
      .eq('id_loja', loja.id) // <--- CONFIRMADO: FK na tabela 'pedidos' é 'id_loja'
      .order('data', { ascending: false }); // <--- Ordena pela coluna 'data' (VARCHAR)

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
  
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id,
      data,
      total,
      status,
      observacoes,
      clientes ( nome ),
      pedido_itens (
        quantidade,
        preco_unitario,
        produto ( nome )
      )
    `)
    .eq('id_loja', idLoja)
    .order('data', { ascending: false });

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
      .not('status', 'eq', 'cancelado'); // Assume que 'status' é preenchido e que 'cancelado' não deve ser contado

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
      for (let i = 0; i < 30; i++) {
          const dataLoop = new Date(hoje);
          dataLoop.setDate(hoje.getDate() - i);
          const dataFormatada = dataLoop.toLocaleDateString('pt-BR'); // Ex: 07/06
          const dataKey = dataLoop.toISOString().split('T')[0];
          dadosGrafico[dataKey] = { label: dataFormatada, total: 0 };
      }
  }

  pedidos.forEach(pedido => {
    const pedidoData = new Date(pedido.data); // 'data' já é um objeto Date se o tipo for timestamp
    pedidoData.setHours(0, 0, 0, 0);
    const dataKey = pedidoData.toISOString().split('T')[0];

    if (dadosGrafico[dataKey]) {
        dadosGrafico[dataKey].total += parseFloat(pedido.total); // <--- GARANTA ISSO!
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