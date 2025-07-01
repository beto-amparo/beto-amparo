// middlewares/authClienteMiddleware.js
import jwt from 'jsonwebtoken';

export const authCliente = (req, res, next) => {
  try {
    // Verifica tanto o cookie quanto o header Authorization
    const token = req.cookies.token_cliente || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Acesso não autorizado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adiciona o cliente à requisição
    req.cliente = { 
      id: decoded.id,
      tipo: decoded.tipo // 'cliente'
    };
    
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};