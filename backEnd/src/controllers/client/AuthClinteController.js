import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import supabase from '../../config/SupaBase.js';
import Login from '../../models/loginModel.js';
import Cliente from '../../models/ClienteModel.js';

dotenv.config();

// FUNÇÃO DE LOGIN
export const login = async (req, res) => {
  try {
    console.log('Dados recebidos no login:', req.body);
    const loginData = req.body;

    if (!loginData) {
      return res.status(400).json({ error: 'Dados de login não fornecidos' });
    }

    const login = new Login(loginData);
    const erros = login.validar();

    if (erros.length > 0) {
      return res.status(400).json({ erros });
    }

    const { data: cliente, error: erroBusca } = await supabase
      .from('clientes')
      .select('*')
      .eq('email', login.email.toLowerCase().trim())
      .single();

    if (erroBusca || !cliente) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const senhaValida = await bcrypt.compare(login.senha, cliente.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: cliente.id, tipo: 'cliente' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const { senha, ...clienteSemSenha } = cliente;

    res.cookie('token_cliente', token, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    console.log('Cookie definido:', token);

    return res.status(200).json({ token, cliente: clienteSemSenha });
  } catch (error) {
    console.error('Erro no processo de login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const cadastrar = async (req, res) => {
  try {
    console.log('Dados recebidos:', req.body);
    const clienteData = req.body;

    if (!clienteData) {
      return res.status(400).json({ error: 'Dados do cliente não fornecidos' });
    }

    const cliente = new Cliente(clienteData);
    const erros = cliente.validar();

    if (erros.length > 0) {
      return res.status(400).json({ erros });
    }

    const { data: existente, error: erroBusca } = await supabase
      .from('clientes')
      .select('*')
      .or(`email.eq.${cliente.email},cpf.eq.${cliente.cpf}`);

    if (erroBusca) throw erroBusca;
    if (existente.length > 0) {
      return res.status(400).json({ error: 'E-mail ou CPF já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(cliente.senha, 10);

    const { data, error } = await supabase
      .from('clientes')
      .insert([{
        nome: cliente.nome,
        email: cliente.email.toLowerCase().trim(),
        telefone: cliente.telefone,
        endereco: cliente.endereco,
        cidade: cliente.cidade,
        uf: cliente.uf,
        cpf: cliente.cpf.replace(/\D/g, ''),
        senha: senhaHash,
        data_nascimento: cliente.data_nascimento || null
      }])
      .select();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Cliente cadastrado com sucesso',
      cliente: data[0]
    });

  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const logout = (req, res) => {
  
    res.clearCookie('token_cliente', {
      httpOnly: false,
      secure: true, 
      sameSite: 'none',
      path: '/',
    });

    res.status(200).send('Logout realizado com sucesso');
  
};
