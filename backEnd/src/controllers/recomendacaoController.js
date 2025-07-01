// /controllers/recomendacaoController.js

// Importa a função do model
import { getRecomendacoes } from '../models/recomendacaoModel.js';

// A função do controller recebe 'req' e 'res'
export async function buscarRecomendacoes(req, res) {
    try {
        const { slug } = req.params;
        const { clienteId } = req.query;
        const recomendacoes = await getRecomendacoes(slug, clienteId);

        res.status(200).json(recomendacoes);

    } catch (error) {
        console.error("Erro no controller de recomendações:", error.message);
        res.status(500).json({ error: "Ocorreu um erro ao processar sua solicitação." });
    }
}
