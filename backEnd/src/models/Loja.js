// backend/models/Loja.js

import supabase from '../config/SupaBase.js';
import dotenv from 'dotenv';

dotenv.config();

export async function buscarIdLojaPorSlug(slug) {
    try {
        const { data, error } = await supabase
            .from('loja')
            .select('id')
            .eq('slug_loja', slug)
            .single();

        if (error) {
            console.error('LojaModel: Erro no Supabase ao buscar ID da loja por slug:', error.message);
            // Se o erro for "não encontrado", retorne null para data e null para error para ser tratado como "não encontrado"
            if (error.code === 'PGRST116') { // PGRST116 é o código do Supabase para "nenhum resultado" (no-rows found)
                return { data: null, error: null }; // Retorna null para data e error, indicando que não encontrou, mas não é um erro fatal
            }
            return { data: null, error: error.message }; // Outros erros do Supabase
        }
        // Se data é null, significa que single() não encontrou nenhum registro e não gerou um erro de código PGRST116
        if (!data) { // Isso é uma redundância se o erro.code === 'PGRST116' for tratado acima, mas é seguro manter
            return { data: null, error: null };
        }

        return { data: { id: data.id }, error: null };
    } catch (err) {
        console.error('LojaModel: Erro inesperado em buscarIdLojaPorSlug:', err.message);
        return { data: null, error: err.message };
    }
}

export async function findNomeFantasiaBySlug(slug) {
    if (!slug) {
        return { data: null, error: "Slug é obrigatório para buscar a empresa." };
    }
    try {
        const { data: empresa, error } = await supabase
            .from('loja')
            .select('nome_fantasia')
            .eq('slug_loja', slug)
            .single();

        if (error) {
            console.error("LojaModel: Erro no Supabase ao buscar nome fantasia por slug:", error);
            if (error.code === 'PGRST116') {
                return { data: null, error: null };
            }
            return { data: null, error: `Erro no banco de dados: ${error.message}` };
        }
        return { data: empresa, error: null };
    } catch (err) {
        console.error("LojaModel: Erro inesperado em findNomeFantasiaBySlug:", err);
        return { data: null, error: err.message };
    }
}

export async function buscarLojaPorId(id) {
    try {
        const { data, error } = await supabase
            .from('loja')
            .select('id,id_empresa, slug_loja, nome_fantasia') 
            .eq('id', id)
            .single();

        if (error) {
            console.error('LojaModel: Erro no Supabase ao buscar loja por ID:', error.message);
            if (error.code === 'PGRST116') {
                return { data: null, error: null };
            }
            return { data: null, error: error.message };
        }
        if (!data) {
            return { data: null, error: null };
        }

        return { data: data, error: null };
    } catch (err) {
        console.error('LojaModel: Erro inesperado em buscarLojaPorId:', err.message);
        return { data: null, error: err.message };
    }
}

export async function buscarIdLoja(idEmpresa) {
    try {
        const { data, error } = await supabase
            .from('loja')
            .select('id')
            .eq('id_empresa', idEmpresa)
            .single();

        if (error) {
            console.error('LojaModel: Erro no Supabase ao buscar ID da loja por ID da empresa:', error.message);
            if (error.code === 'PGRST116') {
                return { data: null, error: null };
            }
            return { data: null, error: error.message };
        }
        if (!data) {
            return { data: null, error: 'Loja não encontrada para a empresa fornecida.' };
        }

        return { data: { id: data.id }, error: null };
    } catch (err) {
        console.error('LojaModel: Erro inesperado em buscarIdLoja:', err.message);
        return { data: null, error: err.message };
    }
}

export async function buscarLojaPorSlugCompleta(slug) {
    try {
        console.log('LojaModel: Buscando loja com slug:', slug);
        // Garanta que você está selecionando todos os campos que precisa no retorno para o frontend
        console.log('LojaModel: Colunas selecionadas para busca:', 'id, nome_fantasia, slug_loja, id_empresa, foto_loja, cor_primaria, cor_secundaria, slogan');

        const { data, error } = await supabase
            .from('loja')
            .select('id, nome_fantasia, slug_loja, id_empresa, foto_loja, cor_primaria, cor_secundaria, slogan, banner') // <-- VERIFIQUE SE TODOS ESSES CAMPOS EXISTEM NA SUA TABELA DO SUPABASE
            .eq('slug_loja', slug)
            .single();

        if (error) {
            console.error('LojaModel: ERRO DO SUPABASE na busca por slug completo:', error.message, 'Código:', error.code, 'Detalhes:', error.details);
            if (error.code === 'PGRST116') { // Nenhum resultado encontrado
                return { data: null, error: null }; // Não encontrado, mas não é um erro fatal, é uma condição de "sem dados"
            }
            return { data: null, error: error.message }; // Outro erro do Supabase
        }

        console.log('LojaModel: DADOS RECEBIDOS DO SUPABASE para slug completo:', data); // <--- ESTE LOG É MUITO IMPORTANTE!

        return { data, error: null }; // Retorna o objeto da loja ou null se não encontrou
    } catch (err) {
        console.error('LojaModel: ERRO INESPERADO em buscarLojaPorSlugCompleta:', err.message);
        return { data: null, error: err.message };
    }
}