// src/models/clienteModel.js
import supabase from '../config/SupaBase.js';
class Cliente {
  constructor({
    nome,
    email,
    telefone,
    endereco,
    cidade,
    uf,
    cpf,
    senha,
    data_nascimento
  }) {
    this.nome = nome;
    this.email = email;
    this.telefone = telefone;
    this.endereco = endereco;
    this.cidade = cidade;
    this.uf = uf;
    this.cpf = cpf;
    this.senha = senha;
    this.data_nascimento = data_nascimento;
  }

  validar() {
    const erros = [];

    if (!this.nome || this.nome.length < 3) {
      erros.push('Nome deve ter pelo menos 3 caracteres');
    }

    if (!this.email || !this.email.includes('@')) {
      erros.push('E-mail inválido');
    }
    
    if (!this.cpf || this.cpf.replace(/\D/g, '').length !== 11) {
      erros.push('CPF deve ter 11 dígitos');
    }

    if (!this.senha || this.senha.length < 6) {
      erros.push('Senha deve ter pelo menos 6 caracteres');
    }

    if (this.uf && this.uf.length !== 2) {
      erros.push('UF deve ter 2 caracteres');
    }

    return erros;
  }
}

export default Cliente;

export async function buscarClientePorId(id) {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};
