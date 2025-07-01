import supabase from '../config/SupaBase.js';

export async function buscarClientePorId(id) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();
  
    if (error) throw error;
    return data;
  };
// Busca um cliente pelo e-mail
export async function buscarClientePorEmail(email) {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('email', email)
    .single(); // garante que retorna apenas um registro

  return { data, error };
}

// Atualiza o token de recuperação e a expiração para um cliente
export async function atualizarTokenCliente(email, token, expiracao) {
  const { data, error } = await supabase
    .from('clientes')
    .update({
      token_recuperacao: token,
      token_expira_em: expiracao,
    })
    .eq('email', email);

  if (error) {
    console.error('Erro ao atualizar token do cliente:', error.message);
    throw new Error('Erro ao salvar o token de recuperação do cliente.');
  }

  return data;
}

// Busca cliente pelo token de recuperação
export async function buscarTokenRecuperacaoCliente(token) {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('token_recuperacao', token)
    .single();

  if (error || !data) return null;
  return data;
}

// Remove o token de recuperação de um cliente (após redefinir a senha)
export async function deletarTokenRecuperacaoCliente(token) {
  const { error } = await supabase
    .from('clientes')
    .update({
      token_recuperacao: null,
      token_expira_em: null,
    })
    .eq('token_recuperacao', token);

  if (error) throw error;
}

// Atualiza a senha (hash) de um cliente
export async function atualizarSenhaCliente(id, senhaHash) {
  const { error } = await supabase
    .from('clientes')
    .update({ senha: senhaHash })
    .eq('id', id);

  if (error) throw error;
}