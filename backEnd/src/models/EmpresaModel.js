import supabase from '../config/SupaBase.js';
import bcrypt from 'bcrypt';

export const inserirEmpresa = async ({
  nome,
  cnpj,
  responsavel,
  categoria,
  telefone,
  endereco,
  cidade,
  uf,
  site,
  email,
  senha,
}) => {
  try {
    // --- ALTERAÇÃO AQUI: Adicione .select() para retornar os dados inseridos ---
    const { data, error } = await supabase
      .from('empresas')
      .insert([{
        nome,
        cnpj,
        responsavel,
        categoria,
        telefone,
        endereco,
        cidade,
        uf,
        site,
        email,
        senha,
        primeiro_login_feito: false,
      }])
      .select(); 

    if (error) {
      console.error("Erro Supabase ao inserir empresa:", error.message);
      return { data: null, error: error.message }; 
    }

    return { data, error: null }; 
  } catch (err) {
    console.error("Erro inesperado em inserirEmpresa:", err.message);
    return { data: null, error: err.message }; 
  }
};

export async function buscarEmpresaPorId(id) {
  const { data, error } = await supabase
    .from('empresas')
    .select('*') // O '*' já incluirá o campo 'primeiro_login_feito' se ele existir
    .eq('id', id)
    .single();

  if (error) {
    // É uma boa prática não "throw" diretamente aqui para permitir que o controller lide com o erro
    // Por exemplo, se single() não encontrar nada, ele retorna um erro.
    if (error.code === 'PGRST116') { // Código para "Row not found" no Supabase (PostgREST)
      return { data: null, error: 'Empresa não encontrada.' };
    }
    return { data: null, error: error.message };
  }
  return { data }; // Retorna como objeto { data: ..., error: ... } para consistência
}

export async function buscarEmpresaPorEmail(email) {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: 'Empresa não encontrada.' };
      }
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

export async function atualizarTokenEmpresa(email, token, expiracao) {
  const { data, error } = await supabase
    .from('empresas')
    .update({
      token_recuperacao: token,
      token_expira_em: expiracao,  // campo datetime/timestamp
    })
    .eq('email', email);

  if (error) {
    console.error('Erro ao atualizar token:', error.message);
    throw new Error('Erro ao salvar o token de recuperação.');
  }

  return data;
}

export async function buscarTokenRecuperacao(token) {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('token_recuperacao', token)
    .single();

  if (error || !data) return null;
  return data;
}

export async function deletarTokenRecuperacao(token) {
  const { error } = await supabase
    .from('empresas')
    .update({
      token_recuperacao: null,
      token_expira_em: null,
    })
    .eq('token_recuperacao', token);

  if (error) throw error;
}


export async function atualizarSenhaEmpresa(id, senhaHash) {
  const { error } = await supabase
    .from('empresas')
    .update({ senha: senhaHash })
    .eq('id', id);

  if (error) throw error;
}

export async function LoginEmpresa(email, senha) {
  // Primeiro, busca a empresa pelo email
  const { data: empresaDataArray, error: selectError } = await supabase
    .from('empresas')
    .select('*')
    .eq('email', email);

  if (selectError) {
    // Trata erros de consulta ao Supabase
    return { error: `Erro ao buscar empresa: ${selectError.message}`, data: null };
  }

  if (!empresaDataArray || empresaDataArray.length === 0) {
    return { error: 'Email ou senha inválidos', data: null }; // Mensagem genérica por segurança
  }

  if (empresaDataArray.length > 1) {
    return { error: 'Erro de duplicidade de email. Contate o suporte.', data: null };
  }

  const empresa = empresaDataArray[0]; // Pega o primeiro (e único) resultado

  // Compara a senha
  const senhaCorreta = await bcrypt.compare(senha, empresa.senha);
  if (!senhaCorreta) {
    return { error: 'Email ou senha inválidos', data: null }; // Mensagem genérica por segurança
  }

  // Se tudo estiver correto, retorna os dados da empresa (que incluirá 'primeiro_login_feito')
  return { data: empresa, error: null };
}

// NOVO: Função para marcar o primeiro login como feito
export const marcarPrimeiroLoginFeito = async (idEmpresa) => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .update({ primeiro_login_feito: true })
      .eq('id', idEmpresa);

    if (error) {
      console.error("Erro no Supabase ao marcar primeiro login feito:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data: data }; // data aqui pode ser nula dependendo da config do Supabase
  } catch (err) {
    console.error("Erro inesperado ao marcar primeiro login feito:", err);
    return { success: false, error: err.message };
  }
};


// Sua função findNomeFantasiaBySlug (mantida como está)
export async function findNomeFantasiaBySlug(slug) {
  if (!slug) {
    throw new Error("Slug é obrigatório para buscar a empresa.");
  }
  try {
    const { data: empresa, error } = await supabase
      .from('loja')
      .select('nome_fantasia')
      .eq('slug_loja', slug)
      .single();

    if (error) {
      console.error("Model Error: Supabase ao buscar empresa por slug:", error);
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Erro no banco de dados: ${error.message}`);
    }
    return empresa;
  } catch (err) {
    console.error("Model Error: Erro inesperado em findEmpresaBySlug:", err);
    throw err;
  }
}