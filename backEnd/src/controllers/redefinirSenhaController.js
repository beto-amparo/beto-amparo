import bcrypt from 'bcrypt';
import {
  buscarTokenRecuperacao as buscarTokenRecuperacaoEmpresa,
  deletarTokenRecuperacao as deletarTokenRecuperacaoEmpresa,
  buscarEmpresaPorId,
  atualizarSenhaEmpresa
} from '../models/EmpresaModel.js';

import {
  buscarTokenRecuperacaoCliente,
  deletarTokenRecuperacaoCliente,
  buscarClientePorEmail,
  atualizarSenhaCliente
} from '../models/ClientModel.js';

export const definirNovaSenha = async (req, res) => {
  const { token, senha } = req.body;

  if (!token || !senha) {
    return res.status(400).json({ mensagem: 'Token e nova senha são obrigatórios.' });
  }

  try {
    let usuario = null;
    let tipo = null;

    // Tenta encontrar o token na tabela de empresas
    const tokenEmpresa = await buscarTokenRecuperacaoEmpresa(token);
    if (tokenEmpresa) {
      if (new Date() > new Date(tokenEmpresa.token_expira_em)) {
        return res.status(400).json({ mensagem: 'Token expirado.' });
      }

      const empresaResult = await buscarEmpresaPorId(tokenEmpresa.id);
      if (!empresaResult?.data) {
        return res.status(404).json({ mensagem: 'Empresa não encontrada.' });
      }

      usuario = empresaResult.data;
      tipo = 'empresa';
    } else {
      // Se não encontrou na empresa, tenta buscar como cliente
      const tokenCliente = await buscarTokenRecuperacaoCliente(token);
      if (!tokenCliente) {
        return res.status(400).json({ mensagem: 'Token inválido ou expirado.' });
      }

      if (new Date() > new Date(tokenCliente.token_expira_em)) {
        return res.status(400).json({ mensagem: 'Token expirado.' });
      }

      const clienteResult = await buscarClientePorEmail(tokenCliente.email);
      if (!clienteResult?.data) {
        return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
      }

      usuario = clienteResult.data;
      tipo = 'cliente';
    }

    // Atualiza senha
    const senhaHash = await bcrypt.hash(senha, 10);

    if (tipo === 'empresa') {
      await atualizarSenhaEmpresa(usuario.id, senhaHash);
      await deletarTokenRecuperacaoEmpresa(token);
    } else {
      await atualizarSenhaCliente(usuario.id, senhaHash);
      await deletarTokenRecuperacaoCliente(token);
    }
    console.log('Token:', token);
    console.log('Tipo:', tipo);
    console.log('Usuário encontrado:', usuario?.email || usuario?.id);

    return res.status(200).json({ mensagem: 'Senha redefinida com sucesso.' });
  } catch (error) {
    console.error('Erro ao redefinir a senha:', error);
    return res.status(500).json({ mensagem: 'Erro interno no servidor.' });
  }
  
};
