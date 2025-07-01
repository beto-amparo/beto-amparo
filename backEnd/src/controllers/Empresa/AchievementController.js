// backend/controllers/Empresa/AchievementController.js

import supabase from '../../config/SupaBase.js';
import * as LojaModel from '../../models/Loja.js';
import jwt from 'jsonwebtoken';

// getEmpresaIdFromToken não é mais usado se você usa o middleware, pode remover ou manter para debug.
/*
async function getEmpresaIdFromToken(req) {
    const token = req.cookies?.token_empresa;
    if (!token) return { error: { message: 'Token não fornecido no cookie' } };
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return { empresaId: decoded.id };
    } catch (err) {
        return { error: { message: 'Token inválido ou expirado' } };
    }
}
*/

export const getOwnerAchievements = async (req, res) => {
    try {
        const ownerId = req.idEmpresa; // <--- CORREÇÃO AQUI para ser consistente com o middleware
        if (!ownerId) {
            return res.status(401).json({ error: 'ID da empresa não disponível. Autenticação falhou.' });
        }
        const { slugLoja } = req.params;
        if (!slugLoja) {
            return res.status(400).json({ mensagem: 'Slug da loja é obrigatório para buscar conquistas.' });
        }

        const { data: lojaDoContexto, error: lojaError } = await LojaModel.buscarLojaPorSlugCompleta(slugLoja);

        if (lojaError || !lojaDoContexto) {
            return res.status(404).json({ mensagem: 'Loja não encontrada para o slug fornecido.' });
        }
        
        if (lojaDoContexto.id_empresa !== ownerId) {
            return res.status(403).json({ mensagem: 'Acesso negado. A loja não pertence à sua conta.' });
        }

        const lojaId = lojaDoContexto.id; 

        const { data: allAchievements, error: achievementsError } = await supabase
            .from('achievements')
            .select('*');

        if (achievementsError) {
            throw new Error('Erro ao buscar conquistas do banco de dados.');
        }
        // Se allAchievements pode ser null, considere: if (!allAchievements) allAchievements = [];
        const finalAllAchievements = allAchievements || [];


        const { data: ownerProgress, error: progressError } = await supabase
            .from('owner_achievements')
            .select('*')
            .eq('loja_id', lojaId);

        if (progressError) {
            throw new Error('Erro ao buscar progresso das conquistas.');
        }
        // Se ownerProgress pode ser null, considere: if (!ownerProgress) ownerProgress = [];
        const finalOwnerProgress = ownerProgress || [];


        const combinedData = finalAllAchievements.map(mission => {
            const progress = finalOwnerProgress.find(p => p.achievement_id === mission.id);
            return {
                ...mission,
                current_progress: progress ? progress.current_progress : 0,
                completed_at: progress ? progress.completed_at : null,
                is_completed: progress ? progress.current_progress >= mission.goal : false
            };
        });

        return res.status(200).json(combinedData);

    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno ao buscar conquistas.', detalhes: error.message });
    }
};