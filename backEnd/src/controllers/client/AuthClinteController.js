import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import supabase from '../../config/SupaBase.js';
import Login from '../../models/loginModel.js';
import Cliente from '../../models/ClienteModel.js';
import { OAuth2Client } from 'google-auth-library';
import { buscarClientePorEmail } from '../../models/ClientModel.js';

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

// ==========================================
// ========== LOGIN COM GOOGLE ==============
// ==========================================

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export const redirecionarGoogleLogin = (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'consent'
  });
  res.redirect(authUrl);
};

export const callbackGoogleLogin = async (req, res) => {
  const code = req.query.code;

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const nome = payload.name;

    // Verifica se o cliente já existe
    const { data: clienteExistente } = await buscarClientePorEmail(email);

    let cliente = clienteExistente;

    // Se não existe, cria um novo cliente
    if (!clienteExistente) {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{ email, nome, senha: null }])
        .select()
        .single();

      if (error) throw error;
      cliente = data;
    }

    // Cria o token
    const token = jwt.sign(
      { id: cliente.id, email: cliente.email, tipo: 'cliente' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Define cookie
    res.cookie('token_cliente', token, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Redireciona para o front-end
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  } catch (err) {
    console.error('Erro no login com Google:', err);
    res.status(500).json({ error: 'Falha na autenticação com o Google' });
  }
};
