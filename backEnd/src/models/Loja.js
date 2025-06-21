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
            .select('id,id_empresa, slug_loja, nome_fantasia, is_closed_for_orders') 
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
    console.log('DEBUG: LojaModel: Buscando loja com slug:', slug);
    try {
        const { data, error } = await supabase
            .from('loja')
            .select('id, nome_fantasia, slug_loja, id_empresa, foto_loja, cor_primaria, cor_secundaria, slogan, banner, ativarFidelidade, valorPonto, is_closed_for_orders, tema_visual')
            .eq('slug_loja', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                console.warn('DEBUG: LojaModel: Nenhuma loja encontrada para o slug:', slug);
                return { data: null, error: null };
            }
            console.error('DEBUG: LojaModel: Erro do Supabase na busca por slug completo:', error.message, 'Código:', error.code, 'Detalhes:', error.details);
            return { data: null, error: { message: error.message, code: error.code } };
        }

        if (!data) {
            return { data: null, error: null };
        }

        // --- VOCÊ PRECISA ADICIONAR ESTE BLOCO AQUI ---
        // Cria um novo objeto com os dados existentes e adiciona o campo 'aberta'
        const formattedData = {
            ...data,
            aberta: !data.is_closed_for_orders // 'aberta' é o inverso de 'is_closed_for_orders'
        };
        // -------------------------------------------------

        console.log('DEBUG: LojaModel: DADOS RECEBIDOS DO SUPABASE para slug completo:', formattedData);
        return { data: formattedData, error: null }; // Retorne o 'formattedData' com o novo campo
    } catch (err) {
        console.error('DEBUG: LojaModel: ERRO INESPERADO na busca por slug completo:', err.message, err.stack);
        return { data: null, error: { message: `Erro inesperado: ${err.message}`, code: 'UNEXPECTED_ERROR' } };
    }
}
export async function buscarLojasPorEmpresaId(empresaId) {
    console.log('DEBUG: LojaModel: Buscando lojas para empresa ID:', empresaId);
    try {
        const { data, error } = await supabase
            .from('loja')
            .select('id, slug_loja, nome_fantasia, id_empresa') // Selecione os campos que você precisa da loja
            .eq('id_empresa', empresaId); // Filtra as lojas pelo ID da empresa

        if (error) {
            console.error('DEBUG: LojaModel: Erro ao buscar lojas por empresa ID no Supabase:', error.message);
            return { data: null, error };
        }
        console.log('DEBUG: LojaModel: Lojas encontradas para empresa ID:', empresaId, ':', data.length);
        return { data, error: null };
    } catch (err) {
        console.error('DEBUG: LojaModel: Erro inesperado em buscarLojasPorEmpresaId:', err);
        return { data: null, error: { message: `Erro inesperado: ${err.message}` } };
    }
}
export const getLojaByIdEmpresa = async (id_empresa) => {
    try {
        const { data, error } = await supabase
            .from('loja')
            .select('slug_loja')
            .eq('id_empresa', id_empresa)
            .single();

        if (error) {
            console.error('LojaModel: Erro ao buscar loja por ID da empresa:', error.message);
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (err) {
        console.error('LojaModel: Erro inesperado :', err.message);
        return { data: null, error: err.message };
    }
}
export async function toggleLojaStatus(slug, isClosed) {
    try {
        const { data, error } = await supabase
            .from('loja')
            .update({ is_closed_for_orders: isClosed })
            .eq('slug_loja', slug)
            .select('is_closed_for_orders, slug_loja') // Retorna o novo status e slug
            .single(); // Espera um único registro

        if (error) {
            console.error('LojaModel: Erro no Supabase ao alternar status da loja:', error.message);
            return { data: null, error: error.message };
        }
        if (!data) {
            return { data: null, error: 'Loja não encontrada para o slug fornecido.' };
        }
        return { data, error: null };
    } catch (err) {
        console.error('LojaModel: Erro inesperado em toggleLojaStatus:', err.message);
        return { data: null, error: err.message };
    }
}
