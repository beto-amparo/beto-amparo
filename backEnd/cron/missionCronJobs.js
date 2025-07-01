// backend/cron/missionCronJobs.js
import supabase from '../src/config/SupaBase.js'; // Ajuste o caminho se necessário
import { trackMissionProgress } from '../services/missionTrackerService.js'; // Ajuste o caminho se necessário

// Função para calcular faturamento semanal e rastrear missão (Já funcionando!)
export async function checkWeeklyRevenue() {
    const now = new Date();
    const offsetPalmas = -3 * 60; 
    const nowLocal = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + offsetPalmas * 60000);

    const startOfWeek = new Date(nowLocal);
    startOfWeek.setDate(nowLocal.getDate() - nowLocal.getDay() - 7); 
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); 
    endOfWeek.setHours(23, 59, 59, 999);

    const { data: lojas, error: lojasError } = await supabase
        .from('loja')
        .select('id, id_empresa') 
        .not('id_empresa', 'is', null); 

    if (lojasError) {
        return;
    }

    for (const loja of lojas) {
        const { data: pedidos, error: pedidosError } = await supabase
            .from('pedidos') 
            .select('total') 
            .eq('id_loja', loja.id)
            .gte('data', startOfWeek.toISOString()) 
            .lte('data', endOfWeek.toISOString())   
            .eq('status', 4); 

        if (pedidosError) {
            continue;
        }

        const totalFaturamento = pedidos.reduce((sum, pedido) => sum + pedido.total, 0);

        await trackMissionProgress(loja.id, 'weekly_revenue', totalFaturamento, { ownerId: loja.id_empresa });
    }
}

// --- Funçao checkBestSellingProduct() - CORRIGIDA! ---
export async function checkBestSellingProduct() {
    const now = new Date();
    const offsetPalmas = -3 * 60; 
    const nowLocal = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + offsetPalmas * 60000);

    const startOfMonth = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1); 
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(nowLocal.getFullYear(), nowLocal.getMonth() + 1, 0); 
    endOfMonth.setHours(23, 59, 59, 999);

    const { data: missionDef, error: missionDefError } = await supabase
        .from('achievements')
        .select('goal')
        .eq('type', 'best_selling_product')
        .single();

    const missionGoal = missionDef ? missionDef.goal : 20; 

    if (missionDefError) {
        // Pode-se registrar o erro internamente sem console.error, ou deixar passar se a meta default é aceitável
    }

    const { data: lojas, error: lojasError } = await supabase
        .from('loja')
        .select('id, id_empresa') 
        .not('id_empresa', 'is', null); 

    if (lojasError) {
        return;
    }

    for (const loja of lojas) {
        const { data: itensVendidos, error: itensError } = await supabase
            .from('pedido_itens')
            .select(`
                quantidade,
                produto_id,
                pedidos!inner(id, id_loja, data, status)
            `)
            .eq('pedidos.id_loja', loja.id) 
            .eq('pedidos.status', 4) 
            .gte('pedidos.data', startOfMonth.toISOString()) 
            .lte('pedidos.data', endOfMonth.toISOString());

        if (itensError) {
            continue;
        }

        const productSales = {};
        for (const item of itensVendidos) {
            productSales[item.produto_id] = (productSales[item.produto_id] || 0) + item.quantidade;
        }

        let maxSoldUnits = 0; 
        let bestSellingProductId = null; 

        for (const productId in productSales) {
            if (productSales[productId] > maxSoldUnits) {
                maxSoldUnits = productSales[productId];
                bestSellingProductId = productId;
            }
        }
        
        // Sempre rastrear o progresso, mesmo que não tenha atingido a meta
        await trackMissionProgress(loja.id, 'best_selling_product', maxSoldUnits, { ownerId: loja.id_empresa });
    }
}