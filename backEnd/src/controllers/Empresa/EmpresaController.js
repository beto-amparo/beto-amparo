import { inserirEmpresa } from '../../models/EmpresaModel.js';
import * as empresas from '../../models/EmpresaModel.js';
import supabase from '../../config/SupaBase.js';
import * as LojaModel from '../../models/Loja.js';

// VERSÃO ORIGINAL DE getEmpresaBySlug (mantida)
export async function getEmpresaBySlug(req, res) {
    const slug = req.params.slug.toLowerCase();

    try {
        const { data, error } = await supabase
            .from('loja')
            .select('id_empresa, nome_fantasia, foto_loja')
            .eq('slug_loja', slug)
            .single();

        if (error || !data || data.length === 0) {
            return res.status(404).json({ erro: 'Loja não encontrada' });
        }

        const empresa = await empresas.buscarEmpresaPorId(data.id_empresa);

        if (!empresa) {
            return res.status(404).json({ erro: 'Empresa não encontrada' });
        }

        res.status(200).json({
            ...empresa,
            nome_fantasia: data.nome_fantasia,
            foto_loja: data.foto_loja
        });

    } catch (err) {
        console.log(err.message);
        res.status(500).json({ erro: err.message });
    }
}

export const marcarPersonalizacaoCompleta = async (req, res) => {
    // Assume que req.Id está disponível pelo middleware protectRoutes
    const idEmpresa = req.Id; // CUIDADO: Seu middleware 'empresaPrivate' usa req.idEmpresa (minúsculo). Verifique qual é o correto.

    if (!idEmpresa) {
        return res.status(400).json({ mensagem: 'ID da empresa não fornecido.' });
    }

    try {
        const { success, error } = await empresas.marcarPrimeiroLoginFeito(idEmpresa);
        if (success) {
            return res.status(200).json({ mensagem: 'Personalização marcada como completa.' });
        } else {
            return res.status(500).json({ mensagem: 'Erro ao marcar personalização.', erro: error });
        }
    } catch (err) {
        console.error("Erro ao marcar personalização:", err);
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
};

// FUNÇÃO LISTAR LOJAS POR EMPRESA SLUG (DO BLOCO 'develop')
export const listarLojasPorEmpresaSlug = async (req, res) => {
    // O ID da empresa já estará disponível em req.idEmpresa graças ao middleware 'empresaPrivate'
    // CUIDADO: O log usa `req.IdEmpresa` (maiúsculo). Seu middleware define como `req.idEmpresa` (minúsculo).
    // A CONVENÇÃO É `req.idEmpresa`. Sugiro padronizar.
    const empresaId = req.idEmpresa; // <-- AQUI! Use req.idEmpresa (minúsculo)
    const empresaSlug = req.params.empresaSlug;

    console.log(`DEBUG: [EmpresaController.listarLojasPorEmpresaSlug] Buscando lojas para empresa ID: ${empresaId} com slug: ${empresaSlug}`);

    try {
        const { data: lojas, error } = await supabase
            .from('loja')
            .select('id, nome_fantasia, slogan, foto_loja, slug_loja')
            .eq('id_empresa', empresaId); // Assumindo que o campo na tabela é 'id_empresa'

        console.log("Resultado da consulta de lojas:", lojas);

        if (error) {
            console.error("Erro ao buscar lojas no modelo:", error);
            return res.status(500).json({ message: "Erro interno do servidor ao buscar lojas." });
        }
        // req.user já tem os dados da empresa logada (populado pelo empresaPrivate)
        const empresaInfo = {
            id: req.user.id,
            nome: req.user.nome,
            site: req.user.site,
            slug: req.user.slug // Adicionando slug se estiver no token/user
        };

        return res.status(200).json({
            lojas: lojas || [],
            empresa: empresaInfo
        });

    } catch (err) {
        console.error("Erro inesperado no controller listarLojasPorEmpresaSlug:", err);
        return res.status(500).json({ message: "Erro inesperado do servidor." });
    }
};

// FUNÇÃO BUSCAR EMPRESA POR SLUG (DO BLOCO 'develop')
export async function BuscarEmpresaBySlug(req, res) {
    const slug = req.params.slug.toLowerCase();

    try {
        const { data: lojaData, error } = await supabase
            .from('loja')
            .select(`
                *,
                empresas: id_empresa(*)
            `)
            .eq('slug_loja', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ erro: 'Loja não encontrada.' });
            }
            throw error;
        }

        const empresaData = lojaData.empresas;

        if (!empresaData) {
            return res.status(404).json({ erro: 'Dados da empresa associada não encontrados.' });
        }

        delete lojaData.empresas;

        res.status(200).json({
            loja: lojaData,
            empresa: empresaData
        });

    } catch (err) {
        console.error("Erro ao buscar dados completos da loja:", err.message);
        res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}