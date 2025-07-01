// backend/models/Mission.js
console.log('DEBUG: Tentando carregar Mission.js');
import supabase from '../config/SupaBase.js'; // <--- VERIFIQUE ESTE CAMINHO! (pode ser ../config/SupaBase.js ou ../../config/SupaBase.js dependendo da estrutura)

export async function getAllActiveMissions() {
    try {
        const { data, error } = await supabase
            .from('missions') // Nome da sua tabela de missões
            .select('*')
            .eq('is_active', true); // Busca apenas missões ativas
        if (error) throw error;
        return { data, error: null };
    } catch (err) {
        console.error('MissionModel: Erro ao buscar missões ativas:', err.message);
        return { data: null, error: err.message };
    }
}

export async function getOwnerMissionProgress(ownerId, missionId = null) {
    try {
        let query = supabase
            .from('owner_mission_progress') // Nome da sua tabela de progresso do dono
            .select('*')
            .eq('owner_id', ownerId);

        if (missionId) {
            query = query.eq('mission_id', missionId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { data, error: null };
    } catch (err) {
        console.error('MissionModel: Erro ao buscar progresso do dono:', err.message);
        return { data: null, error: err.message };
    }
}

export async function updateMissionProgress(ownerId, missionId, currentProgress, isCompleted, completedCount = 0) {
    try {
        const { data, error } = await supabase
            .from('owner_mission_progress') // Nome da sua tabela de progresso do dono
            .upsert({
                owner_id: ownerId,
                mission_id: missionId,
                current_progress: currentProgress,
                is_completed: isCompleted,
                last_completed_at: isCompleted ? new Date().toISOString() : null,
                completed_count: completedCount
            }, {
                onConflict: ['owner_id', 'mission_id'], // Chave para upsert: garante que não haja duplicatas
                ignoreDuplicates: false
            })
            .select('*')
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (err) {
        console.error('MissionModel: Erro ao atualizar progresso da missão:', err.message);
        return { data: null, error: err.message };
    }
}

export async function awardBadge(ownerId, badgeName, badgeImageUrl) {
    try {
        // Verifica se o emblema já foi concedido para esta missão (para não conceder duplicatas)
        const { data: existingBadge, error: checkError } = await supabase
            .from('owner_badges') // Nome da sua tabela de emblemas do dono
            .select('id')
            .eq('owner_id', ownerId)
            .eq('badge_name', badgeName) // Verifica pelo nome do emblema
            .maybeSingle(); 

        if (checkError) throw checkError;
        if (existingBadge) {
            console.log(`Badge '${badgeName}' já concedido ao dono ${ownerId}.`);
            return { data: { message: 'Badge já concedido' }, error: null };
        }

        // Se não foi concedido, insere
        const { data, error } = await supabase
            .from('owner_badges') // Nome da sua tabela de emblemas do dono
            .insert({
                owner_id: ownerId,
                badge_name: badgeName,
                badge_image_url: badgeImageUrl,
                awarded_at: new Date().toISOString()
            })
            .select('*')
            .single();
        if (error) throw error;
        return { data, error: null };
    } catch (err) {
        console.error('MissionModel: Erro ao conceder emblema:', err.message);
        return { data: null, error: err.message };
    }
}

// Lembre-se de implementar funções para XP/Nível se você planeja usá-los.