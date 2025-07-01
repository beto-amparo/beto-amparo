// backend/src/controllers/categoria/CategoriaController.js

// Importe o supabase do seu arquivo de configuração centralizado
// ATENÇÃO: Ajuste o caminho conforme a localização do seu CategoriaController.js e SupaBase.js
import supabase from '../config/SupaBase.js';

// Importe o modelo de loja, caso precise dele aqui para algo (como buscar ID da loja por slug)
// import { buscarLojaPorSlugCompleta } from '../../models/Loja.js'; // Exemplo, pode não ser necessário para as rotas abaixo

/**
 * Lista todas as categorias de uma loja específica.
 * Rota: GET /categorias/loja/:idLoja
 */
export const listarCategoriasPorLoja = async (req, res) => {
    try {
        const { idLoja } = req.params; // Captura o ID da loja da URL

        if (!idLoja) {
            return res.status(400).json({ mensagem: 'ID da loja não fornecido.' });
        }

        // Converte idLoja para número, pois ele virá como string da URL
        const idLojaNum = parseInt(idLoja, 10);
        if (isNaN(idLojaNum)) {
            return res.status(400).json({ mensagem: 'ID da loja inválido.' });
        }

        // Busca as categorias na tabela 'categorias' associadas ao loja_id
        const { data: categorias, error } = await supabase
            .from('categorias')
            .select('*') // Seleciona apenas o ID e o nome da categoria
            .eq('loja_id', idLojaNum)
            .order('nome', { ascending: true }); // Ordena por nome, opcional

        if (error) {
            console.error('CategoriaController: Erro no Supabase ao listar categorias:', error.message);
            // PGRST116 (no rows found) não deve ser um erro fatal aqui, apenas retorna array vazio.
            if (error.code === 'PGRST116') {
                 return res.status(200).json([]); // Retorna array vazio se não houver categorias
            }
            return res.status(500).json({ mensagem: 'Erro ao buscar categorias.', erro: error.message });
        }

        // Retorna um array vazio se 'data' for null ou vazio
        if (!categorias || categorias.length === 0) {
            return res.status(200).json([]);
        }

        return res.status(200).json(categorias);

    } catch (err) {
        console.error('CategoriaController: Erro inesperado ao listar categorias por loja:', err.message);
        return res.status(500).json({ mensagem: 'Erro interno do servidor ao listar categorias.', erro: err.message });
    }
};

/**
 * Cria uma nova categoria para uma loja específica.
 * Rota: POST /categorias
 */
export const criarCategoria = async (req, res) => {
    try {
        const { nome, id_loja } = req.body; // Recebe nome da categoria e ID da loja do corpo da requisição

        if (!nome || !id_loja) {
            return res.status(400).json({ mensagem: 'Nome da categoria e ID da loja são obrigatórios.' });
        }

        const idLojaNum = parseInt(id_loja, 10);
        if (isNaN(idLojaNum)) {
            return res.status(400).json({ mensagem: 'ID da loja inválido.' });
        }

        // Opcional: Verificar se a categoria já existe para esta loja
        const { data: existingCategory, error: checkError } = await supabase
            .from('categorias')
            .select('id')
            .eq('loja_id', idLojaNum)
            .eq('nome', nome)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('CategoriaController: Erro ao verificar categoria existente:', checkError.message);
            throw checkError;
        }
        if (existingCategory) {
            // Se já existe, retorna a categoria existente, em vez de criar uma duplicata
            return res.status(200).json({ id: existingCategory.id, nome: nome, mensagem: 'Categoria já existe.' });
        }

        // Cria a nova categoria na tabela 'categorias'
        const { data, error } = await supabase
            .from('categorias')
            .insert({
                nome: nome,
                loja_id: idLojaNum, // Associa ao ID da loja
                // slug: opcionalmente, você pode gerar um slug aqui (ex: nome.toLowerCase().replace(/\s/g, '-'))
            })
            .select('id, nome, loja_id'); // Retorna o ID e nome da categoria criada

        if (error) {
            console.error('CategoriaController: Erro no Supabase ao criar categoria:', error.message);
            return res.status(500).json({ mensagem: 'Erro ao criar categoria.', erro: error.message });
        }

        // Retorna a categoria criada (ou a primeira se for um array)
        return res.status(201).json(data[0]);

    } catch (err) {
        console.error('CategoriaController: Erro inesperado ao criar categoria:', err.message);
        return res.status(500).json({ mensagem: 'Erro interno do servidor ao criar categoria.', erro: err.message });
    }
};
export const atualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params; // ID da categoria a ser atualizada
        const { nome, id_loja } = req.body; // Novo nome e ID da loja para validação

        if (!nome || !id_loja) {
            return res.status(400).json({ mensagem: 'Nome da categoria e ID da loja são obrigatórios.' });
        }

        const categoriaIdNum = parseInt(id, 10);
        const idLojaNum = parseInt(id_loja, 10);

        if (isNaN(categoriaIdNum) || isNaN(idLojaNum)) {
            return res.status(400).json({ mensagem: 'IDs inválidos.' });
        }

        // 1. Opcional: Verificar se a categoria pertence a esta loja (segurança extra)
        const { data: categoriaExistente, error: checkOwnerError } = await supabase
            .from('categorias')
            .select('id, nome, loja_id')
            .eq('id', categoriaIdNum)
            .eq('loja_id', idLojaNum)
            .single();

        if (checkOwnerError || !categoriaExistente) {
             console.error('CategoriaController: Erro ao verificar categoria para atualização ou não pertence à loja:', checkOwnerError?.message);
             return res.status(404).json({ mensagem: 'Categoria não encontrada ou não pertence à sua loja.' });
        }

        // 2. Verificar se o novo nome já existe para outra categoria NESTA MESMA LOJA (evitar duplicatas)
        const { data: categoriaComMesmoNome, error: checkNameError } = await supabase
            .from('categorias')
            .select('id')
            .eq('loja_id', idLojaNum)
            .eq('nome', nome)
            .neq('id', categoriaIdNum) // Exclui a própria categoria que está sendo editada
            .single();

        if (checkNameError && checkNameError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('CategoriaController: Erro ao verificar duplicidade de nome:', checkNameError.message);
            throw checkNameError;
        }

        if (categoriaComMesmoNome) {
            return res.status(409).json({ mensagem: 'Já existe outra categoria com este nome para esta loja.' });
        }

        // 3. Atualizar a categoria no Supabase
        const { data, error } = await supabase
            .from('categorias')
            .update({ nome: nome })
            .eq('id', categoriaIdNum)
            .select('id, nome, loja_id'); // Retorna os dados atualizados

        if (error) {
            console.error('CategoriaController: Erro no Supabase ao atualizar categoria:', error.message);
            return res.status(500).json({ mensagem: 'Erro ao atualizar categoria.', erro: error.message });
        }

        // Retorna a categoria atualizada
        return res.status(200).json(data[0]);

    } catch (err) {
        console.error('CategoriaController: Erro inesperado ao atualizar categoria:', err.message);
        return res.status(500).json({ mensagem: 'Erro interno do servidor ao atualizar categoria.', erro: err.message });
    }
};

export const deletarCategoria = async (req, res) => {
    try {
        const { id } = req.params; // ID da categoria a ser deletada

        const categoriaIdNum = parseInt(id, 10);
        if (isNaN(categoriaIdNum)) {
            return res.status(400).json({ mensagem: 'ID da categoria inválido.' });
        }

        // --- Opção B: Impedir a exclusão se houver produtos vinculados ---
        // 1. Verifique se há produtos associados a esta categoria
        const { data: produtosVinculados, error: checkProductsError } = await supabase
            .from('produtos')
            .select('id') // Seleciona apenas o ID, pois só precisamos saber se existe um
            .eq('categoria_id', categoriaIdNum)
            .limit(1); // Otimiza a consulta para pegar apenas um resultado, se houver

        if (checkProductsError) {
            console.error('CategoriaController: Erro ao verificar produtos vinculados:', checkProductsError.message);
            return res.status(500).json({ mensagem: 'Erro ao verificar produtos vinculados à categoria.', erro: checkProductsError.message });
        }

        // Se encontrou algum produto vinculado, impede a exclusão
        if (produtosVinculados && produtosVinculados.length > 0) {
            return res.status(400).json({ mensagem: 'Não é possível excluir esta categoria porque há produtos vinculados a ela. Por favor, reatribua os produtos a outra categoria primeiro.' });
        }
        // --- Fim da Opção B ---

        // Se não há produtos vinculados, proceda com a exclusão da categoria
        const { error } = await supabase
            .from('categorias')
            .delete()
            .eq('id', categoriaIdNum);

        if (error) {
            console.error('CategoriaController: Erro no Supabase ao deletar categoria:', error.message);
            return res.status(500).json({ mensagem: 'Erro ao deletar categoria.', erro: error.message });
        }

        return res.status(200).json({ mensagem: 'Categoria excluída com sucesso.' });

    } catch (err) {
        console.error('CategoriaController: Erro inesperado ao deletar categoria:', err.message);
        return res.status(500).json({ mensagem: 'Erro interno do servidor ao deletar categoria.', erro: err.message });
    }
};