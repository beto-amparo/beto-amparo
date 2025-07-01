// backend/services/missionTrackerService.js

import supabase from '../src/config/SupaBase.js'; // Garanta que este caminho está correto

export async function checkAndUpgradeShopLevel(lojaId) {
    try {
        // 1. Obtenha o nível atual da LOJA
        const { data: lojaAtual, error: fetchLojaError } = await supabase
            .from('loja') // Busca na tabela 'loja'
            .select('level_tier')
            .eq('id', lojaId)
            .single();

        if (fetchLojaError || !lojaAtual) {
            return { success: false, message: 'Erro ao buscar loja.' };
        }

        // Se a loja já é Ouro, não precisa verificar mais (assumindo Ouro é o máximo)
        if (lojaAtual.level_tier === 'Ouro') {
            return { success: true, message: 'Loja já no nível máximo.' };
        }

        // Buscar TODAS as conquistas completadas da loja
        const { data: ownerAchievements, error: fetchAchievementsError } = await supabase
            .from('owner_achievements')
            .select('achievement:achievement_id(name, level)') // Faz JOIN para pegar o nome e o nível da missão
            .eq('loja_id', lojaId) 
            .not('completed_at', 'is', null); // Filtra apenas conquistas COMPLETADAS

        if (fetchAchievementsError) {
            return { success: false, message: 'Erro ao buscar conquistas.' };
        }
        
        // Mapeia para um formato mais fácil de usar
        const completedMissionsWithLevels = ownerAchievements.map(oa => ({
            name: oa.achievement.name,
            level: oa.achievement.level
        }));

        // --- Lógica para Nível BRONZE ---
        const requiredMissionsForBronze = ['Primeira Venda', 'Novo Produto', 'Ajuste Preciso'];
        const completedBronzeMissionsCount = completedMissionsWithLevels.filter(m => 
            m.level === 1 && requiredMissionsForBronze.includes(m.name)
        ).length;
        
        const allBronzeMissionsCompleted = completedBronzeMissionsCount >= requiredMissionsForBronze.length;
        const isCurrentlyNenhum = lojaAtual.level_tier === 'Nenhum';

        if (allBronzeMissionsCompleted && isCurrentlyNenhum) {
            const { error: updateError } = await supabase
                .from('loja') 
                .update({ level_tier: 'Bronze' })
                .eq('id', lojaId);

            if (updateError) {
                return { success: false, message: 'Erro ao atualizar nível.' };
            }
            return { success: true, newLevel: 'Bronze' };
        }

        // --- Lógica para Nível PRATA ---
        const requiredSilverMissionName = 'Vendedor Prata'; // Principal gatilho para o nível Prata
        const isVendedorPrataCompleted = completedMissionsWithLevels.some(m => 
            m.name === requiredSilverMissionName && m.level === 2
        );

        if (isVendedorPrataCompleted && (lojaAtual.level_tier === 'Bronze' || lojaAtual.level_tier === 'Nenhum')) {
            if (lojaAtual.level_tier !== 'Prata' && lojaAtual.level_tier !== 'Ouro') {
                const { error: updateError } = await supabase
                    .from('loja')
                    .update({ level_tier: 'Prata' })
                    .eq('id', lojaId);

                if (updateError) {
                    return { success: false, message: 'Erro ao atualizar nível.' };
                }
                return { success: true, newLevel: 'Prata' };
            }
        }
        
        // --- NOVO: Lógica para Nível OURO ---
        const requiredGoldMissionNames = [
            'Mestre de Vendas Diário',
            'Produto com Estoque Zerado',
            'Faturamento Semanal',
            'Mais Vendido'
        ];

        // Filtra as missões completadas que são de nível 3 e estão na lista de requisitos para Ouro
        const completedGoldMissions = completedMissionsWithLevels.filter(m => 
            m.level === 3 && requiredGoldMissionNames.includes(m.name)
        );
        const allGoldMissionsCompleted = completedGoldMissions.length >= requiredGoldMissionNames.length;

        // Condição para upgrade para OURO:
        // 1. Todas as missões de nível Ouro (3) devem estar completas.
        // 2. O nível atual da loja deve ser 'Prata' ou 'Bronze' ou 'Nenhum' (nunca Ouro).
        if (allGoldMissionsCompleted && (lojaAtual.level_tier === 'Prata' || lojaAtual.level_tier === 'Bronze' || lojaAtual.level_tier === 'Nenhum')) {
            // Certifica-se de que a loja ainda não é Ouro
            if (lojaAtual.level_tier !== 'Ouro') {
                const { error: updateError } = await supabase
                    .from('loja')
                    .update({ level_tier: 'Ouro' })
                    .eq('id', lojaId);

                if (updateError) {
                    return { success: false, message: 'Erro ao atualizar nível.' };
                }
                return { success: true, newLevel: 'Ouro' };
            }
        }

        return { success: true, message: 'Nível não alterado.' };

    } catch (error) {
        return { success: false, message: 'Erro interno ao verificar nível.' };
    }
}

// --- FUNÇÃO: trackMissionProgress (ATUALIZADA para lógica de completed_at) ---
export async function trackMissionProgress(lojaId, eventType, amount = 1, data = {}) { 
    try {
        let ownerId = data.ownerId; 
        if (!ownerId) {
            const { data: lojaDetalhes, error: lojaDetalhesError } = await supabase
                .from('loja')
                .select('id_empresa')
                .eq('id', lojaId)
                .single();
            if (lojaDetalhesError || !lojaDetalhes || !lojaDetalhes.id_empresa) {
                return { success: false, message: 'Owner ID não encontrado para a loja.' };
            }
            ownerId = lojaDetalhes.id_empresa;
        }

        const { data: missions, error: missionsError } = await supabase
            .from('achievements')
            .select('*')
            .eq('type', eventType); 

        if (missionsError) {
            return { success: false, message: 'Erro ao buscar missões.' };
        }
        if (!missions || missions.length === 0) {
            return { success: true, message: 'Nenhuma missão encontrada para este evento.' };
        }

        for (const mission of missions) {
            let ownerAchievement;
            let existingProgress = 0;
            let wasCompletedBefore = false; 

            const { data: existingOwnerAchievement, error: fetchProgressError } = await supabase
                .from('owner_achievements')
                .select('*')
                .eq('loja_id', lojaId)
                .eq('achievement_id', mission.id)
                .single();

            if (fetchProgressError && fetchProgressError.code !== 'PGRST116') { 
                continue; 
            }

            if (existingOwnerAchievement) {
                ownerAchievement = existingOwnerAchievement;
                existingProgress = ownerAchievement.current_progress;
                wasCompletedBefore = existingOwnerAchievement.completed_at !== null; 

                // Lógica de reset para missões repetíveis
                if (mission.is_repeatable && ownerAchievement.completed_at) { // Reseta APENAS se já estava completada antes
                    const lastCompletedDate = new Date(ownerAchievement.completed_at);
                    let shouldReset = false;
                    const now = new Date();

                    const offset = -3 * 60; 
                    const nowLocal = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + offset * 60000);
                    const lastCompletedLocal = new Date(lastCompletedDate.getTime() + lastCompletedDate.getTimezoneOffset() * 60000 + offset * 60000);

                    if (mission.reset_period === 'daily' && nowLocal.getDate() !== lastCompletedLocal.getDate()) {
                        shouldReset = true;
                    } else if (mission.reset_period === 'weekly') {
                        const startOfWeekNow = new Date(nowLocal);
                        startOfWeekNow.setDate(nowLocal.getDate() - nowLocal.getDay()); 
                        startOfWeekNow.setHours(0,0,0,0);
                        
                        const startOfWeekLast = new Date(lastCompletedLocal);
                        startOfWeekLast.setDate(lastCompletedLocal.getDate() - lastCompletedLocal.getDay());
                        startOfWeekLast.setHours(0,0,0,0);

                        if (startOfWeekNow.getTime() !== startOfWeekLast.getTime()) {
                            shouldReset = true;
                        }
                    } else if (mission.reset_period === 'monthly' && nowLocal.getMonth() !== lastCompletedLocal.getMonth()) {
                        shouldReset = true;
                    }

                    if (shouldReset) {
                        existingProgress = 0; // Zera o progresso
                        ownerAchievement.completed_at = null; // Remove o status de completada
                        ownerAchievement.last_reset_at = now.toISOString(); 
                        wasCompletedBefore = false; // Se resetou, não estava mais completada "antes" neste ciclo de atualização
                    }
                }
            } else {
                ownerAchievement = {
                    loja_id: lojaId,
                    owner_id: ownerId, 
                    achievement_id: mission.id,
                    current_progress: 0,
                    completed_at: null,
                    last_reset_at: null,
                };
            }

            let newProgress;
            
            if (mission.type === 'portfolio_diversificado' || mission.type === 'active_products_count' ||
                mission.type === 'weekly_revenue' || mission.type === 'monthly_revenue' || mission.type === 'best_selling_product' || mission.type === 'product_sold_out') { 
                newProgress = amount;
            } 
            else { 
                newProgress = existingProgress + amount;
            }
            
            if (newProgress > mission.goal && mission.is_repeatable === false) {
                 newProgress = mission.goal;
            }
            if (newProgress < 0) { 
                newProgress = 0;
            }

            // AQUI ESTÁ A CORREÇÃO DA LÓGICA COMPLETED_AT
            let missionShouldBeCompletedNow = newProgress >= mission.goal; // Se o progresso atinge a meta
            let missionWasJustCompleted = missionShouldBeCompletedNow && !wasCompletedBefore; // Se atingiu a meta E não estava completa antes

            const updatePayload = {
                current_progress: newProgress,
                // Lógica de completed_at:
                // 1. Se a missão acabou de ser completada, define a data atual.
                // 2. Se a missão JÁ ESTAVA COMPLETA E AINDA ATINGE A META, MANTÉM a data antiga.
                // 3. Se a missão NÃO ATINGE MAIS A META (descompleta ou resetada), seta para NULL.
                completed_at: missionWasJustCompleted ? new Date().toISOString() : (missionShouldBeCompletedNow && wasCompletedBefore ? ownerAchievement.completed_at : null),
                last_reset_at: ownerAchievement.last_reset_at, 
            };
            
            if (existingOwnerAchievement) {
                const { error: updateError } = await supabase
                    .from('owner_achievements')
                    .update(updatePayload)
                    .eq('id', ownerAchievement.id);
                if (updateError) { 
                    throw updateError;
                }
            } else {
                const { error: insertError } = await supabase
                    .from('owner_achievements')
                    .insert([
                        {
                            loja_id: lojaId,
                            owner_id: ownerId, 
                            achievement_id: mission.id,
                            current_progress: newProgress,
                            completed_at: missionWasJustCompleted ? new Date().toISOString() : null, // Apenas marca como completa na primeira vez
                            last_reset_at: null,
                        }
                    ]);
                if (insertError) { 
                    throw insertError;
                }
            }

            if (missionWasJustCompleted) { // Chamar upgrade de nível APENAS quando a missão acabou de ser completada
                await checkAndUpgradeShopLevel(lojaId); 
            }
            // Se a missão era completada e agora descompleta (progresso < goal e não é repetível)
            else if (wasCompletedBefore && newProgress < mission.goal && mission.is_repeatable === false) { // Se a missão era completa e agora não é mais
                 await checkAndUpgradeShopLevel(lojaId); // Re-verifica o nível, pode haver downgrade
            }
        }

        return { success: true, message: 'Progresso da missão atualizado.' };

    } catch (error) {
        return { success: false, message: 'Erro interno no rastreamento de missões.' };
    }
}