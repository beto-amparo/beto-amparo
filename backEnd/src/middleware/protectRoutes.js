import * as empresas from "../models/EmpresaModel.js";
import * as clientes from "../models/ClienteModel.js"; // Supondo que você tem este modelo para clientes
import JWT from "jsonwebtoken";

export const routePrivate = async (req, res, next) => {
  const token = req.cookies?.token_cliente || req.cookies?.token_empresa;

  if (!token) {
    // Se o token está ausente, envia um status 401 e a URL de redirecionamento para o frontend.
    return res.status(401).json({
      error: "Acesso não autorizado. Token ausente.",
      // Redirecionar para a página de login da EMPRESA
      redirectTo: `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(req.originalUrl)}`
    });
  }

  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);

    let user;

    if (decoded.tipo === "empresa") {
      // Importante: verificar se empresas.buscarEmpresaPorId retorna { data, error } ou o objeto diretamente
      const { data, error } = await empresas.buscarEmpresaPorId(decoded.id);
      if (error) throw new Error(error); // Propagar erro se a busca falhar
      user = data;
    } else if (decoded.tipo === "cliente") {
      // Importante: verificar se clientes.buscarClientePorId retorna { data, error } ou o objeto diretamente
      const { data, error } = await clientes.buscarClientePorId(decoded.id);
      if (error) throw new Error(error); // Propagar erro se a busca falhar
      user = data;
    } else {
      // Se o tipo de usuário no token for inválido, mesmo com token presente
      return res.status(403).json({ error: "Tipo de usuário inválido." });
    }

    if (!user) {
      // Se o usuário não for encontrado (ex: foi deletado do DB), invalida o token
      return res.status(401).json({
        error: "Usuário não encontrado.",
        // Redirecionar para a página de login da EMPRESA
        redirectTo: `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(req.originalUrl)}`
      });
    }

    // Anexa o ID do usuário, o objeto do usuário e o tipo de usuário à requisição
    // Isso é útil para as rotas subsequentes saberem quem está logado
    req.Id = decoded.id; // Convenção de usar 'Id' capitalizado
    req.user = user;
    req.userTipo = decoded.tipo;

    // Se a autenticação for bem-sucedida, continua para a próxima função middleware/rota
    next();
  } catch (err) {
    // Se o token for inválido ou expirado (erro do JWT.verify)
    // Ou se a busca por usuário no DB falhar
    console.error("Erro na validação do token ou busca de usuário no protectRoutes:", err.message);
    return res.status(401).json({
      error: "Token inválido ou expirado.",
      // Redirecionar para a página de login da EMPRESA
      redirectTo: `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(req.originalUrl)}`
    });
  }
};