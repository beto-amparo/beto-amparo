import express from 'express';
import supabase from '../config/SupaBase.js';

const router = express.Router();

// Adicionar item ao carrinho
router.post('/:slug/carrinho', async (req, res) => {
  const { produtoId, quantidade, id_cliente, id_empresa } = req.body;

  if (!produtoId || !quantidade || !id_cliente || !id_empresa) {
    return res.status(400).json({ erro: 'Campos obrigatórios: produtoId, quantidade, id_cliente, id_empresa.' });
  }

  try {
    const { error } = await supabase
      .from('carrinho')
      .insert([{ produto_id: produtoId, quantidade, id_cliente, id_empresa, finalizado: 0 }]);

    if (error) return res.status(500).json({ erro: 'Erro ao salvar no carrinho.' });

    res.status(201).json({ mensagem: 'Produto adicionado ao carrinho com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao adicionar ao carrinho.' });
  }
});

// Listar itens do carrinho
router.get('/:slug/carrinho', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('carrinho')
      .select(`
        id,
        quantidade,
        produto:produto_id (
          id,
          nome,
          preco,
          image,
          id_empresa
        )
      `)
      .eq('finalizado', 0); // apenas itens não finalizados

    if (error) return res.status(500).json({ erro: 'Erro ao buscar o carrinho.' });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao buscar o carrinho.' });
  }
});

// Remover item do carrinho
router.delete('/:slug/carrinho/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ erro: 'ID do produto é obrigatório.' });

  try {
    const { error } = await supabase.from('carrinho').delete().eq('id', id);
    if (error) return res.status(500).json({ erro: 'Erro ao remover item do carrinho.' });

    res.status(200).json({ mensagem: 'Item removido do carrinho com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao remover item do carrinho.' });
  }
});

router.post('/:slug/finalizar-compra', async (req, res) => {
  const { slug } = req.params;

  try {
    // Buscar itens do carrinho para o usuário fixo (id_cliente = 2)
    const { data: itensCarrinho, error: erroCarrinho } = await supabase
      .from('carrinho')
      .select(`
        id,
        quantidade,
        produto:produto_id (
          id,
          preco,
          id_empresa
        )
      `)
      .eq('id_cliente', 2);  // gambiarra para usuário fixo

    if (erroCarrinho) {
      console.error("Erro ao buscar carrinho:", erroCarrinho);
      return res.status(500).json({ erro: 'Erro ao buscar carrinho.' });
    }

    if (!itensCarrinho || itensCarrinho.length === 0) {
      return res.status(400).json({ erro: 'Carrinho está vazio.' });
    }

    // Pegando id_empresa do primeiro item (assumindo que todos são da mesma empresa)
    const id_loja = itensCarrinho[0].produto.id_empresa;

    // Calcular o total dos itens do carrinho
const total = itensCarrinho.reduce((acc, item) => {
  return acc + item.produto.preco * item.quantidade;
}, 0);

// Criar novo pedido
const { data: pedidoCriado, error: erroPedido } = await supabase
  .from('pedidos')
  .insert([
    {
      id_cliente: 2,
      data: new Date().toLocaleDateString('pt-BR'), // formato "dd/mm/yyyy"
      total: total.toString(), // total como string, já que é varchar na tabela
      status: 1,
      observacoes: '',
      id_loja: id_loja
    }
  ])
  .select()
  .single();

if (erroPedido || !pedidoCriado) {
  console.error("Erro ao criar pedido:", erroPedido);
  return res.status(500).json({ erro: 'Erro ao criar pedido.' });
  
}

console.error("Erro ao criar pedido:", erroPedido?.message || erroPedido);

    const pedidoId = pedidoCriado.id;

    // Inserir itens na tabela pedido_itens
    const itensParaInserir = itensCarrinho.map(item => ({
      pedido_id: pedidoId,
      produto_id: item.produto.id,
      quantidade: item.quantidade,
      preco_unitario: item.produto.preco
    }));

    const { error: erroItens } = await supabase
      .from('pedido_itens')
      .insert(itensParaInserir);

    if (erroItens) {
      console.error("Erro ao inserir itens do pedido:", erroItens);
      return res.status(500).json({ erro: 'Erro ao adicionar itens ao pedido.' });
    }

    // Limpar carrinho do usuário 2 (só ele)
    const { error: erroLimpeza } = await supabase
      .from('carrinho')
      .delete()
      .eq('id_cliente', 2);

    if (erroLimpeza) {
      console.error("Erro ao limpar carrinho:", erroLimpeza);
      return res.status(500).json({ erro: 'Erro ao limpar carrinho.' });
    }

    return res.status(200).json({ mensagem: 'Pedido finalizado com sucesso.' });

  } catch (err) {
    console.error("Erro inesperado:", err);
    return res.status(500).json({ erro: 'Erro ao finalizar compra.' });
  }
});


export default router;
