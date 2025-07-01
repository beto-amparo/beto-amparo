// C:\Users\Dallyla\OneDrive\Área de Trabalho\beto-amparo\beto-amparo\backend\routes\carrinhoRoutes.js
import express from 'express';
import supabase from '../config/SupaBase.js'; // Certifique-se de que o caminho está correto
import { clientePrivate } from '../middleware/protectRouterClient.js';

const router = express.Router();

// Middleware para buscar o ID da loja a partir do slug
async function getLojaIdBySlug(req, res, next) {
    const { slug } = req.params;
    console.log("DEBUG: Middleware 'getLojaIdBySlug' acionado.");
    console.log("DEBUG: Slug recebido:", slug);
    
    if (!slug) {
        console.log("DEBUG: Slug não fornecido.");
        return res.status(400).json({ erro: 'Slug da loja é obrigatório.' });
    }
    try {
        // Consulta a tabela 'loja' para obter o ID da loja pelo slug
        const { data: loja, error } = await supabase
            .from('loja') // AQUI ESTAVA 'empresas' mas o código usava 'loja', corrigi o comentário
            .select('id')
            .eq('slug_loja', slug)
            .single();

        if (error) {
            console.error('DEBUG: Erro do Supabase ao buscar loja pelo slug:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ erro: 'Loja não encontrada.' });
            }
            return res.status(500).json({ erro: 'Erro no banco de dados ao buscar loja.' });
        }

        if (!loja) {
            console.log("DEBUG: Nenhuma loja encontrada com o slug:", slug);
            return res.status(404).json({ erro: 'Loja não encontrada.' });
        }

        req.lojaId = loja.id;
        console.log("DEBUG: Loja encontrada! ID:", req.lojaId);
        next();
    } catch (err) {
        console.error('DEBUG: Erro inesperado no middleware getLojaIdBySlug:', err);
        res.status(500).json({ erro: 'Erro interno no servidor ao buscar loja.' });
    }
}

// Rota para adicionar produto ao carrinho (ou atualizar se já existe)
router.post('/:slug/carrinho',clientePrivate, async (req, res) => {
    const { produtoId, quantidade  , lojaId} = req.body;
   
    const id_cliente = req.ClientId

    if (!produtoId || !quantidade || !id_cliente || !lojaId) {
        return res.status(400).json({ erro: 'Produto ID, quantidade, Cliente Id e ID da loja são obrigatórios.' });
    }

    try {
        console.log(`Recebido para loja ${lojaId}: produtoId=${produtoId}, id_cliente=${id_cliente} quantidade=${quantidade}`);

        const { data: existingItem, error: fetchError } = await supabase
            .from('carrinho')
            .select('*')
            .eq('produto_id', produtoId)
            .eq('id_cliente', id_cliente)
            .eq('loja_id', lojaId)
            .single();

        let data;
        let updateError;

        if (existingItem) {
            const newQuantity = existingItem.quantidade + quantidade;
            ({ data, error: updateError } = await supabase
                .from('carrinho')
                .update({ quantidade: newQuantity })
                .eq('id', existingItem.id));
            if (updateError) throw updateError;
            res.status(200).json({ mensagem: 'Quantidade do produto atualizada no carrinho.' });
        } else {
            ({ data, error: updateError } = await supabase
                .from('carrinho')
                .insert([
                    {
                        produto_id: produtoId,
                        quantidade,
                        id_cliente,
                        loja_id: lojaId
                    },
                ]));
            if (updateError) throw updateError;
            res.status(201).json({ mensagem: 'Produto adicionado ao carrinho com sucesso.' });
        }

    } catch (err) {
        console.error('Erro no Supabase ao adicionar/atualizar carrinho:', err);
        if (err.code === '23503') {
            return res.status(404).json({ erro: 'Produto ou Loja associados não encontrados.' });
        }
        res.status(500).json({ erro: 'Erro interno ao adicionar/atualizar ao carrinho.' });
    }
});

// Rota para ATUALIZAR a quantidade de um item ESPECÍFICO no carrinho (usando PUT)
// Esta é a rota que faltava e causava o 404!
router.put('/:slug/carrinho/:id', getLojaIdBySlug, async (req, res) => {
    const { id } = req.params; // ID do item do carrinho (do registro na tabela 'carrinho')
    const { quantidade } = req.body; // Nova quantidade a ser definida
    const lojaId = req.lojaId; // ID da loja obtido do middleware

    if (!id || typeof quantidade === 'undefined' || !lojaId) {
        return res.status(400).json({ erro: 'ID do item do carrinho, quantidade e ID da loja são obrigatórios.' });
    }

    if (quantidade < 1) {
        return res.status(400).json({ erro: 'A quantidade deve ser pelo menos 1. Use DELETE para remover o item.' });
    }

    try {
        console.log(`[PUT /carrinho/:id] Tentando atualizar item ${id} para quantidade ${quantidade} na loja ${lojaId}`);

        const { data, error } = await supabase
            .from('carrinho')
            .update({ quantidade: quantidade })
            .eq('id', id)
            .eq('loja_id', lojaId) // Garante que você só atualiza itens do carrinho da loja correta
            .select('*') // Retorna o item atualizado
            .single(); // Espera que apenas um item seja atualizado

        if (error) {
            console.error('Erro do Supabase ao atualizar item do carrinho:', error);
            // PGRST116 é o código de erro do PostgREST para "no rows found" (se o ID não existe ou não pertence à loja)
            if (error.code === 'PGRST116') {
                return res.status(404).json({ erro: 'Item do carrinho não encontrado para esta loja.' });
            }
            return res.status(500).json({ erro: 'Erro no banco de dados ao atualizar item do carrinho.' });
        }

        if (!data) { // Confirma que um item foi de fato atualizado
            return res.status(404).json({ erro: 'Item do carrinho não encontrado ou não pertence a esta loja.' });
        }

        console.log('Item do carrinho atualizado com sucesso:', data);
        res.status(200).json({ mensagem: 'Quantidade do item atualizada com sucesso.', item: data });

    } catch (err) {
        console.error('Erro inesperado ao atualizar item do carrinho:', err);
        res.status(500).json({ erro: 'Erro interno ao atualizar item do carrinho.' });
    }
});


// Rota para buscar os itens do carrinho para uma loja específica
router.get('/:slug/carrinho', getLojaIdBySlug, async (req, res) => {
    const lojaId = req.lojaId;

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
                    image
                )
            `)
            .eq('loja_id', lojaId);

        if (error) {
            console.error('Erro ao buscar carrinho:', error);
            return res.status(500).json({ erro: 'Erro ao buscar o carrinho.' });
        }

        if (!data || data.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Erro inesperado ao buscar carrinho:', err);
        res.status(500).json({ erro: 'Erro interno ao buscar o carrinho.' });
    }
});

// Rota para remover item do carrinho
router.delete('/:slug/carrinho/:id', getLojaIdBySlug, async (req, res) => {
    const { id } = req.params;
    const lojaId = req.lojaId;

    if (!id || !lojaId) {
        return res.status(400).json({ erro: 'ID do item do carrinho e ID da loja são obrigatórios.' });
    }

    try {
        console.log(`Removendo item com id ${id} para loja ${lojaId}`);

        const { data, error } = await supabase
            .from('carrinho')
            .delete()
            .eq('id', id)
            .eq('loja_id', lojaId)
            .select('*');

        if (error) {
            console.error('Erro ao remover item do carrinho:', error);
            return res.status(500).json({ erro: 'Erro ao remover item do carrinho.' });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ mensagem: 'Item não encontrado ou não pertence a esta loja no carrinho.' });
        }

        console.log('Item removido:', data);
        res.status(200).json({ mensagem: 'Item removido do carrinho com sucesso.' });
    } catch (err) {
        console.error('Erro inesperado ao remover item do carrinho:', err);
        res.status(500).json({ erro: 'Erro interno ao remover item do carrinho.' });
    }
});

// Rota para validar cupom
router.get('/:slug/validar-cupom', getLojaIdBySlug, async (req, res) => {
    const { nome } = req.query;
    const lojaId = req.lojaId;

    if (!nome) {
        return res.status(400).json({ erro: 'O nome (código) do cupom não foi informado.' });
    }

    try {
        const { data: cupom, error } = await supabase
            .from('cupons')
            .select('*')
            .eq('nome', nome)
            .eq('id_loja', lojaId)
            .single();

        if (!cupom) {
            return res.status(404).json({ erro: 'Cupom não encontrado para esta loja.' });
        }

        return res.status(200).json({
            id: cupom.id,
            nome: cupom.nome,
            valor: cupom.valor, // valor fixo do desconto (em reais)
        });
    } catch (err) {
        console.error('Erro inesperado ao validar cupom:', err);
        res.status(500).json({ erro: 'Erro interno ao validar cupom.' });
    }
});


export default router;