// src/controllers/client/Empresa/AuthController.js

import * as empresas from "#models/EmpresaModel.js"; // <-- USANDO ALIAS
import jwt from "jsonwebtoken";
import { inserirEmpresa } from '#models/EmpresaModel.js'; // <-- USANDO ALIAS
import bcrypt from 'bcrypt';
import validarDadosEmpresa from '#validators/EmpresaValidator.js'; // <-- USANDO ALIAS
import * as lojaModel from '#models/Loja.js'; // <-- USANDO ALIAS

export const loginEmpresa = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    try {
        const { error: loginError, data: empresaData } = await empresas.LoginEmpresa(email, senha);
    

        if (loginError || !empresaData) {
            return res.status(401).json({ error: loginError || 'Email ou senha inválidos' });
        }

        let slugDaLoja = null;
        let nomeFantasiaLoja = null;

        const { data: lojasInfo, error: lojaError } = await lojaModel.buscarLojasPorEmpresaId(empresaData.id);

        if (lojaError) {
            console.error(`Erro ao buscar loja(s) para a empresa ID ${empresaData.id}. Erro:`, lojaError); // Log melhorado
            // Continuar o fluxo, mas sem slug da loja.
        } else if (lojasInfo && lojasInfo.length > 0) {
            // Se encontrou UMA OU MAIS lojas, pegue o slug da primeira encontrada.
            slugDaLoja = lojasInfo[0].slug_loja;
            nomeFantasiaLoja = lojasInfo[0].nome_fantasia;
        } else {
            console.warn(`Aviso: Nenhuma loja encontrada para a empresa ID ${empresaData.id}.`);
        }

        const token = jwt.sign({
            id: empresaData.id,
            tipo: 'empresa'
        },
            process.env.JWT_SECRET, {
            expiresIn: '1d'
        });

        res.cookie("token_empresa", token, {
            httpOnly: false, // Pode ser 'true' se o frontend não precisar ler
            secure: process.env.NODE_ENV === 'production' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? "none" : "Lax",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/",
            domain: process.env.COOKIE_DOMAIN || 'localhost'
        });

        console.log("Backend AuthController: Cookie 'token_empresa' setado com:", {
            tokenValue: token,
            secure: process.env.NODE_ENV === 'production' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? "none" : "Lax",
            path: "/",
            maxAge: 24 * 60 * 60 * 1000,
        });
        console.log("Backend AuthController: Headers da resposta SET-COOKIE:", res.getHeaders()['set-cookie']);

        res.status(200).json({
            mensagem: "Login realizado com sucesso",
            primeiroLoginFeito: empresaData.primeiro_login_feito,
            slugLoja: slugDaLoja,
            nomeFantasia: nomeFantasiaLoja,
            nomeEmpresa: empresaData.nome,
        });

    } catch (error) {
        console.error("Erro inesperado no loginEmpresa:", error);
        res.status(500).json({ error: "Erro ao fazer login: " + error.message });
    }
};

export const verificarSessao = async (req, res) => {
    try {
        const token = req.cookies.token_empresa;
        if (!token) {
            // Se não há token, não é um erro, apenas não está logado.
            // Retornar um 401 faria o console do navegador mostrar um erro,
            // o que pode não ser ideal. Um JSON indicando "não logado" é melhor.
            return res.json({ logado: false });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { data: empresa, error } = await empresas.buscarEmpresaPorId(decoded.id);

        if (error || !empresa) {
            // Limpa o cookie inválido
            res.clearCookie('token_empresa');
            return res.status(401).json({ logado: false, error: "Sessão inválida" });
        }

        // --- MUDANÇA PRINCIPAL AQUI ---
        // Retorne o objeto 'empresa' completo ou os campos necessários,
        // incluindo 'slug' e/ou 'site'.
        res.status(200).json({
            logado: true,
            empresa: { // Aninhar os dados da empresa é uma boa prática
                responsavel: empresa.responsavel,
                email: empresa.email,
                cnpj: empresa.cnpj,
                slug: empresa.slug, // Assumindo que o model retorna isso
                site: empresa.site   // Assumindo que o model retorna isso
            }
        });

    } catch (error) {
        // Token expirado ou malformado
        res.clearCookie('token_empresa');
        return res.status(401).json({ logado: false, error: "Token inválido ou expirado" });
    }
};

export const criarEmpresa = async (req, res) => {
    try {
        const dados = req.body;

        const errors = await validarDadosEmpresa(dados);
        if (Object.keys(errors).length > 0) {
            console.log(errors);
            return res.status(400).json({ errors });
        }

        const { nome, cnpj, responsavel, categoria, telefone, endereco, cidade, uf, site, email, senha, confirmarSenha } = dados;

        const senhaHash = await bcrypt.hash(senha, 10);

        // --- ALTERAÇÃO AQUI: Capture a resposta da inserção ---
        const { data: novaEmpresa, error: insertError } = await inserirEmpresa({ // Mude 'error' para 'insertError' para evitar conflito
            nome,
            cnpj,
            responsavel,
            categoria,
            telefone,
            endereco,
            cidade,
            uf,
            site,
            email,
            senha: senhaHash
        });

        if (insertError) { // Use 'insertError'
            console.error("Erro ao inserir empresa no banco de dados:", insertError); // Adicione mais detalhes ao log
            return res.status(500).json({ mensagem: insertError }); // `insertError` aqui provavelmente é um objeto de erro do Supabase
        }

        // Assumindo que `inserirEmpresa` com `.select()` retorna um array, e o objeto criado está em [0]
        const idNovaEmpresa = novaEmpresa && novaEmpresa.length > 0 ? novaEmpresa[0].id : null;

        if (!idNovaEmpresa) {
            console.error("ID da nova empresa não encontrado após a inserção.");
            return res.status(500).json({ mensagem: 'Empresa cadastrada, mas o ID não foi retornado.' });
        }

        // --- ALTERAÇÃO AQUI: Inclua o ID da empresa na resposta ---
        return res.status(201).json({
            id: idNovaEmpresa, // <--- RETORNANDO O ID!
            mensagem: 'Empresa cadastrada com sucesso!'
        });
        // --- FIM DA ALTERAÇÃO ---

    } catch (error) {
        console.error("Erro inesperado em criarEmpresa (catch):", error); // Adicione mais detalhes ao log
        return res.status(500).json({ mensagem: error.message || 'Erro ao criar empresa.' });
    }
};
   


export const logout = (req, res) => {
    res.clearCookie('token_empresa', {
        httpOnly: false, // Alterei para false porque o frontend está lendo o cookie
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: process.env.NODE_ENV === 'production' ? "none" : "Lax",
        path: '/',
    });

    res.status(200).send('Logout realizado com sucesso');
};