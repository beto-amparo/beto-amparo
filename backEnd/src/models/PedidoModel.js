import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function buscarPedidosPorSlug(slug) {
  // Busca a loja com base no slug_loja
  const { data: loja, error: lojaError } = await supabase
    .from('loja')
    .select('id')
    .eq('slug_loja', slug)
    .single();

  if (lojaError) throw lojaError;
  if (!loja) throw new Error('Loja não encontrada');

  // Busca os pedidos da loja
  const { data: pedidos, error: pedidosError } = await supabase
    .from('pedidos')
    .select('id, data, total, status, observacoes')
    .eq('id_loja', loja.id);

  if (pedidosError) throw pedidosError;

  // Para cada pedido, buscar os produtos associados
  const pedidosComProdutos = await Promise.all(pedidos.map(async (pedido) => {
    const { data: itens, error: itensError } = await supabase
      .from('pedido_itens')
      .select(`
        quantidade,
        preco_unitario,
        produto:produto_id ( id, nome )
      `)
      .eq('pedido_id', pedido.id);

    if (itensError) throw itensError;

    return {
      ...pedido,
      produtos: itens.map((item) => ({
        nome: item.produto.nome,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
      }))
    };
  }));

  return pedidosComProdutos;
}
