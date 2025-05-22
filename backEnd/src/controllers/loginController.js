// src/controllers/loginController.js
import Login from '../models/loginModel.js';
import supabase from '../config/SupaBase.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class LoginController {
  async autenticar(req, res) {
    try {
      console.log('Dados recebidos no login:', req.body);
      const loginData = req.body;

      if (!loginData) {
        return res.status(400).json({ error: 'Dados de login não fornecidos' });
      }

      const login = new Login(loginData);
      const erros = login.validar('tradicional');

      if (erros.length > 0) {
        return res.status(400).json({ erros });
      }

      // Busca o cliente pelo email
      const { data: cliente, error: erroBusca } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', login.email.toLowerCase().trim())
        .single();

      if (erroBusca) throw erroBusca;
      if (!cliente) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Verifica a senha
      const senhaValida = await bcrypt.compare(login.senha, cliente.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Gera token JWT (adicione sua chave secreta no .env)
      const token = jwt.sign(
        { id: cliente.id, email: cliente.email },
        process.env.JWT_SECRET, // Agora usa a variável de ambiente JWT_SECRET
        { expiresIn: '1h' }
      );

      // Retorna o token e informações básicas do cliente (sem a senha)
      const { senha, ...clienteSemSenha } = cliente;

      return res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        token,
        cliente: clienteSemSenha
      });

    } catch (error) {
      console.error('Erro no processo de login:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  async loginComGoogle(req, res) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ success: false, error: 'ID Token não fornecido' });
      }

      // Verifica o token com a Google
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { email, name, sub: googleId } = payload;

      // Validação com o model Login (agora com email também)
      const login = new Login({ email, idToken });
      const erros = login.validar('google');

      if (erros.length > 0) {
        return res.status(400).json({ success: false, errors: erros });
      }

      // Verifica se o cliente já existe no Supabase
      const { data: cliente, error: erroBusca } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', email)
        .single();

      let clienteFinal = cliente;

      // Se não existir, cria o cliente
      if (!cliente) {
        const { data: novoCliente, error: erroCriacao } = await supabase
          .from('clientes')
          .insert([
            {
              email,
              nome: name,
              senha: '', // Pode usar hash aleatória se preferir
              google_id: googleId,
            },
          ])
          .select()
          .single();

        if (erroCriacao) throw erroCriacao;
        clienteFinal = novoCliente;
      }

      // Gera token JWT
      const token = jwt.sign(
        { id: clienteFinal.id, email: clienteFinal.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const { senha, ...clienteSemSenha } = clienteFinal;

      return res.status(200).json({
        success: true,
        message: 'Login com Google bem-sucedido',
        token,
        cliente: clienteSemSenha,
      });
    } catch (error) {
      console.error('Erro no login com Google:', error);
      return res.status(500).json({ error: 'Erro no login com Google' });
    }
  }
}

export default new LoginController();