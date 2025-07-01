import * as clientes from "../models/ClienteModel.js"; 
import JWT from "jsonwebtoken";

export const clientePrivate = async (req, res, next) => {
    const token = req.cookies?.token_cliente;
  
    if (!token) {
      return res.status(401).json({ error: "Acesso não autorizado para cliente." });
    }
  
    try {
      const decoded = JWT.verify(token, process.env.JWT_SECRET);
  
      if (decoded.tipo !== "cliente") {
        return res.status(403).json({ error: "Acesso negado. Não é um cliente." });
      }
  
      const cliente = await clientes.buscarClientePorId(decoded.id);
  
      if (!cliente) {
        return res.status(401).json({ error: "Cliente não encontrado." });
      }
  
      req.ClientId = decoded.id;
      req.user = cliente;
      req.userTipo = decoded.tipo;
  
      next();
    } catch (err) {
      console.error("Erro ao verificar token do cliente:", err.message);
      return res.status(401).json({ error: "Token inválido ou expirado." });
    }
  };
  