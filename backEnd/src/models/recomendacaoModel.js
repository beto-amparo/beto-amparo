import supabase from '../config/SupaBase.js';
export async function getRecomendacoes(slug, clienteId) {
    const { data: loja, error: lojaError } = await supabase
        .from('loja')
        .select('id')
        .eq('slug_loja', slug)
        .single();

    if (lojaError || !loja) {
        throw new Error('Loja não encontrada.');
    }
    const lojaId = loja.id;

    let recommendedProductIds = [];
    let purchasedProductIds = new Set();

    if (clienteId) {
        const { data: pedidosDoCliente } = await supabase.from('pedidos').select('id').eq('id_cliente', clienteId).eq('id_loja', lojaId);
        if (pedidosDoCliente && pedidosDoCliente.length > 0) {
            const pedidoIds = pedidosDoCliente.map(p => p.id);
            const { data: itensComprados } = await supabase.from('pedido_itens').select('produto_id').in('pedido_id', pedidoIds);
            itensComprados.forEach(item => purchasedProductIds.add(item.produto_id));
            const { data: produtosComprados } = await supabase.from('produto').select('categoria_id').in('id', Array.from(purchasedProductIds));
            const categoriasDeInteresse = [...new Set(produtosComprados.map(p => p.categoria_id).filter(Boolean))];
            if (categoriasDeInteresse.length > 0) {
                const { data: produtosSugeridos } = await supabase.from('produto').select('id').eq('id_loja', lojaId).in('categoria_id', categoriasDeInteresse);
                recommendedProductIds = produtosSugeridos.map(p => p.id);
            }
        }
    }

    if (recommendedProductIds.length === 0) {
        try {
            const { data: todosPedidosDaLoja, error: pedidosError } = await supabase.from('pedidos').select('id').eq('id_loja', lojaId).eq('status', 4); // Correção para status 4
            if (pedidosError) throw new Error(`Erro ao buscar pedidos: ${pedidosError.message}`);

            if (todosPedidosDaLoja && todosPedidosDaLoja.length > 0) {
                const todosPedidoIds = todosPedidosDaLoja.map(p => p.id);
                const { data: todosItensVendidos, error: itensError } = await supabase.from('pedido_itens').select('produto_id, quantidade').in('pedido_id', todosPedidoIds);
                if (itensError) throw new Error(`Erro ao buscar itens de pedido: ${itensError.message}`);

                if (todosItensVendidos && todosItensVendidos.length > 0) {
                    const salesCount = {};
                    for (const item of todosItensVendidos) {
                        // VERIFICAÇÃO DE SEGURANÇA: Só processa se o item for válido
                        if (item && item.produto_id != null && item.quantidade != null) {
                            salesCount[item.produto_id] = (salesCount[item.produto_id] || 0) + item.quantidade;
                        }
                    }

                    // VERIFICAÇÃO DE SEGURANÇA: Só continua se houver algo para ordenar
                    if (Object.keys(salesCount).length > 0) {
                        const sortedProducts = Object.entries(salesCount).sort((a, b) => b[1] - a[1]);
                        
                        // Lógica de map/filter mais segura
                        recommendedProductIds = sortedProducts
                            .map(p => parseInt(p[0], 10)) // Usa radix 10 para segurança
                            .filter(id => !isNaN(id) && !purchasedProductIds.has(id)); // Remove NaN e IDs já comprados
                    }
                }
            }
        } catch (err) {
            console.error("ERRO CRÍTICO DENTRO DA LÓGICA DE RECOMENDAÇÕES GENÉRICAS:", err);
            // Não relance o erro para o controller, em vez disso, retorne uma lista vazia para o frontend não quebrar.
            // O console.error no servidor já te avisou do problema.
            return [];
        }
    }


    const finalProductIds = recommendedProductIds.slice(0, 6);
    if (finalProductIds.length === 0) return [];

    const { data: finalProducts, error: finalProductsError } = await supabase.from('produto').select('*').in('id', finalProductIds).eq('ativo', true);
    if (finalProductsError) throw new Error('Erro ao buscar detalhes dos produtos.');

    const availableProducts = finalProducts.filter(p => p.controlar_estoque ? p.quantidade > 0 : true);
    
    // O model retorna os dados puros.
    return availableProducts;
}

