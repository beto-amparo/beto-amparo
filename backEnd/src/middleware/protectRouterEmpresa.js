// backend/middleware/protectRouterEmpresa.js

import * as empresas from "../models/EmpresaModel.js";
import * as lojas from "../models/Loja.js";
import JWT from "jsonwebtoken";

export const empresaPrivate = async (req, res, next) => {
    console.log(`--- INICIANDO MIDDLEWARE empresaPrivate para ${req.method} ${req.originalUrl} ---`);

    const token = req.cookies?.token_empresa;

    if (!token) {
        console.log('DEBUG_AUTH: Token não encontrado nos cookies');
        return res.status(401).json({ error: "Acesso não autorizado para empresa: Token ausente." });
    }

    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        console.log('DEBUG_AUTH: JWT Decodificado - ID:', decoded.id, 'Tipo:', decoded.tipo);

        if (decoded.tipo !== "empresa") {
            console.log('DEBUG_AUTH: Tipo de usuário do token não é empresa. Acesso negado.');
            return res.status(403).json({ error: "Acesso negado: Credenciais inválidas (não é uma empresa)." });
        }

        const { data: empresa, error: empresaError } = await empresas.buscarEmpresaPorId(decoded.id);

        if (empresaError || !empresa) {
            console.log('DEBUG_AUTH: Dados da Empresa do Modelo:', empresa ? 'PRESENTE' : 'AUSENTE', 'Erro Modelo:', empresaError);
            return res.status(401).json({ error: "Empresa não encontrada ou erro ao buscar dados." });
        }
        console.log('DEBUG_AUTH: Empresa encontrada no banco (nome):', empresa.nome);

        // Buscar slug da empresa (assumindo que 'site' ou 'nome' é o slug da empresa)
        const slugDaEmpresaDoBanco = empresa.site || empresa.nome; // Ajuste para o campo real do slug da empresa
        console.log('DEBUG_AUTH: Slug da empresa do banco:', slugDaEmpresaDoBanco);


        const { data: lojasDaEmpresa, error: lojasError } = await lojas.buscarLojasPorEmpresaId(empresa.id);

        if (lojasError || !lojasDaEmpresa || lojasDaEmpresa.length === 0) {
            console.log('DEBUG_AUTH: Nenhuma loja encontrada para esta empresa ou erro:', lojasError);
            // Para rotas que precisam de uma loja (ex: dashboard), isso pode ser um erro.
            // Para rotas como /empresa/slug-da-empresa/lojas, que listam as lojas, talvez não seja um erro crítico.
            // Retornar erro 401 aqui pode impedir o acesso a uma página que deveria listar "nenhuma loja".
            // Considere ajustar isso se necessário para seu fluxo.
            // Por agora, mantemos o erro para garantir que a empresa tenha lojas se essa rota exigir.
            //return res.status(401).json({ error: "Nenhuma loja associada encontrada para a empresa ou erro ao buscar dados." });
        }
        console.log('DEBUG_AUTH: Quantidade de lojas encontradas para a empresa:', lojasDaEmpresa ? lojasDaEmpresa.length : 0);

        const slugsPermitidosDaLoja = (lojasDaEmpresa || []).map(loja => (loja.slug_loja || '').toLowerCase().trim());
        console.log('DEBUG_AUTH: Slugs de lojas permitidos para esta empresa:', slugsPermitidosDaLoja);


        req.idEmpresa = decoded.id; 
        req.user = { 
            ...empresa, 
            lojas: lojasDaEmpresa 
        }; 
        req.userTipo = decoded.tipo; 

        console.log('DEBUG_AUTH: req.idEmpresa definido como:', req.idEmpresa);
        console.log('DEBUG_AUTH: req.user.id (empresa) definido como:', req.user.id);
        console.log('DEBUG_AUTH: req.user.nome (empresa) definido como:', req.user.nome);

        // --- LÓGICA DE VALIDAÇÃO DO SLUG DA URL (AQUI ESTÁ A MUDANÇA) ---
        // Pegar o slug da URL. Pode ser slug da empresa ou slug da loja.
        const slugParam = (req.params.empresaSlug || req.params.slug || req.params.slugLoja || '').toLowerCase().trim(); 
        console.log('DEBUG_AUTH: Slug da URL (req.params):', slugParam);

        // Cenário 1: O slug na URL é o slug da EMPRESA (ex: /ben/lojas)
        if (slugParam === slugDaEmpresaDoBanco) {
            console.log('DEBUG_AUTH: Slug da URL corresponde ao slug da EMPRESA. Permissão concedida para rota de empresa.');
            // Neste caso, a rota é para a empresa (ex: listar suas lojas). Não precisamos validar o slug da loja.
            // Adicionalmente, você pode armazenar o slug da empresa no req.user para uso posterior.
            req.user.currentEmpresaSlug = slugDaEmpresaDoBanco;
            console.log('DEBUG_AUTH: req.user.currentEmpresaSlug definido como:', req.user.currentEmpresaSlug);
        }
        // Cenário 2: O slug na URL é o slug de uma LOJA (ex: /empresa/ben-pizza/dashboard)
        else if (slugParam && slugsPermitidosDaLoja.includes(slugParam)) {
            const lojaAtual = lojasDaEmpresa.find(loja => (loja.slug_loja || '').toLowerCase().trim() === slugParam);
            if (lojaAtual) {
                req.user.currentLoja = lojaAtual;
                console.log('DEBUG_AUTH: Slug da URL corresponde ao slug de uma LOJA. Loja específica:', req.user.currentLoja.slug_loja);
            } else {
                // Embora o slug esteja nos permitidos, não encontrou o objeto loja (improvável se slugsPermitidosDaLoja é de lojasDaEmpresa)
                console.log('DEBUG_AUTH: Acesso negado: Slug da URL corresponde a uma loja, mas objeto loja não encontrado. (Revisar lógica)');
                return res.status(403).json({
                    error: "Acesso negado: Problema ao identificar a loja específica na URL.",
                    receivedSlug: slugParam
                });
            }
        }
        // Cenário 3: Não há slug na URL OU o slug não corresponde nem à empresa nem a uma loja.
        else if (slugParam && slugParam !== slugDaEmpresaDoBanco) {
            console.log('DEBUG_AUTH: Acesso negado: Slug da URL não corresponde ao slug da EMPRESA nem a nenhuma LOJA autenticada.');
            return res.status(403).json({
                error: "Acesso negado: O slug na URL não corresponde a esta empresa ou suas lojas.",
                expectedEmpresaSlug: slugDaEmpresaDoBanco,
                expectedLojaSlugs: slugsPermitidosDaLoja,
                receivedSlug: slugParam
            });
        } else {
            console.warn('DEBUG_AUTH: NENHUM SLUG DE EMPRESA/LOJA ENCONTRADO NA URL. Validação do slug específica pode ser pulada.');
            // Isso pode ser aceitável para rotas como /empresa/dashboard (genérico para a empresa)
            // mas não para rotas que esperam um slug de loja.
        }

        console.log('VALIDAÇÃO DE EMPRESA/LOJA CONCLUÍDA');
        console.log('Slug da URL (req.params):', slugParam);
        console.log('Slug da Empresa do Banco:', slugDaEmpresaDoBanco);
        console.log('Slugs de lojas permitidos para esta empresa:', slugsPermitidosDaLoja); 
        console.log('Empresa autenticada pelo token (nome):', req.user.nome); 


        if (req.originalUrl.includes('/validate')) {
            console.log('DEBUG_AUTH: Rota /validate, retornando resposta direta.');
            return res.status(200).json({
                empresa_slug_da_url_validada: slugParam,
                todos_slugs_da_empresa: slugsPermitidosDaLoja,
                empresa_id: empresa.id,
                acesso_permitido: true
            });
        }
        
        console.log(`--- CHAMANDO next() em empresaPrivate ---`);
        next(); 
    } catch (err) {
        console.error('Middleware Auth Empresa: Erro ao verificar token:', err.name, err.message);
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token inválido ou expirado." });
        }
        return res.status(500).json({ error: "Erro interno do servidor durante a autenticação." });
    }
};