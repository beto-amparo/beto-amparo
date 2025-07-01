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
            if (error.code === 'PGRST116') {
                return { data: null, error: null };
            }
            return { data: null, error: error.message };
        }
        if (!data) {
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
            // ADICIONE 'horarios_funcionamento' AQUI também, se esta função for usada para retornar dados completos da loja
            .select('id,id_empresa, slug_loja, nome_fantasia, is_closed_for_orders, horarios_funcionamento')
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
            .single(); // Mantendo .single() para buscar um único ID de loja

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

        return { data: { id: data.id }, error: null }; // Retorna um objeto com o ID único
    } catch (err) {
        console.error('LojaModel: Erro inesperado em buscarIdLoja:', err.message);
        return { data: null, error: err.message };
    }
}

// FUNÇÃO ATUALIZADA: Agora seleciona 'horarios_funcionamento'
export async function buscarLojaPorSlugCompleta(slug) {
    console.log('DEBUG: LojaModel: Buscando loja com slug:', slug);
    try {
        const { data, error } = await supabase
            .from('loja')
            .select('id, nome_fantasia, slug_loja, id_empresa, foto_loja, cor_primaria, cor_secundaria, slogan, banner, ativarFidelidade, valorPonto, is_closed_for_orders, level_tier, horarios_funcionamento,mostrar_outras_lojas') // ADICIONADO: horarios_funcionamento
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

        // Criar um novo objeto com os dados existentes e adiciona o campo 'aberta'
        // Mantenha este bloco se você usa a propriedade 'aberta' no frontend
        const formattedData = {
            ...data,
            aberta: !data.is_closed_for_orders
        };

        console.log('DEBUG: LojaModel: DADOS RECEBIDOS DO SUPABASE para slug completo:', formattedData);
        return { data: formattedData, error: null };
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
            .select('id, slug_loja, nome_fantasia, id_empresa')
            .eq('id_empresa', empresaId);

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
            .select('is_closed_for_orders, slug_loja')
            .single();

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

// NOVA FUNÇÃO: Atualizar Horários de Funcionamento da Loja
export async function updateHorariosLoja(slug, horarios) {
    try {
        const { data, error } = await supabase
            .from('loja')
            .update({ horarios_funcionamento: horarios })
            .eq('slug_loja', slug)
            .select('horarios_funcionamento') // Retorna os horários atualizados
            .single(); // Espera um único registro

        if (error) {
            console.error('LojaModel: Erro no Supabase ao atualizar horários da loja:', error.message);
            return { data: null, error: error.message };
        }
        if (!data) {
            return { data: null, error: 'Loja não encontrada para o slug fornecido.' };
        }
        return { data, error: null };
    } catch (err) {
        console.error('LojaModel: Erro inesperado em updateHorariosLoja:', err.message);
        return { data: null, error: err.message };
    }
}

export const buscarTipoLoja = async(slug)=>{
    
    const { data, error } = await supabase
    .from('loja')
    .select("tipoLoja")
    .eq("slug_loja" , slug)
    if (error) throw new Error(error.message);
    return data;
}
