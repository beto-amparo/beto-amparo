
import * as agendamento from '../../models/agendamentoEmpresaModel.js';


export const getAgendamentosController = async (req, res) => {
    
    const empresaId = req.IdEmpresa;
    const slug = req.params.slug


    

    try {
       
      const agendamentos = await agendamento.buscarAgendamentosPorEmpresa(empresaId , slug);
        if (!agendamentos || agendamentos.length === 0) {
            return res.status(404).json({ message: "Nenhum agendamento encontrado para esta empresa." });
        }

        return res.status(200).json(agendamentos);
    } catch (err) {
        console.error("Erro ao buscar agendamentos:", err);
        return res.status(500).json({ message: "Erro interno do servidor ao buscar agendamentos." });
    }
}

export const deleteAgendamentoController = async (req, res) => {
    const data= req.body;
    const empresaId = req.IdEmpresa;
    const slug = req.params.slug
 

    try {
        const result = await agendamento.deletarAgendamentoPorId(data.data, data.time, empresaId , data.id_cliente , slug);
        if (!result || result.length === 0) {
            return res.status(404).json({ message: "Agendamento não encontrado ou já deletado." });
        }   
        
        return res.status(200).json({ message: "Agendamento deletado com sucesso." });
    } catch (err) {
        console.error("Erro ao deletar agendamento:", err);
        return res.status(500).json({ message: "Erro interno do servidor ao deletar agendamento." });
    }
}
export const updateAgendamentoController = async (req, res) => {
    const data = req.body;
    const empresaId = req.IdEmpresa;
    const slug = req.params.slug


    try {
        const result = await agendamento.updateAgendamentoController(data.data, data.time, empresaId  , data.status , data.id_cliente ,slug);
        if (!result || result.length === 0) {
            return res.status(404).json({ message: "Agendamento não encontrado ou já deletado." });
        }   
        
        return res.status(200).json({ message: "Agendamento atualizado com sucesso." });
    } catch (err) {
        console.error("Erro ao atualizar agendamento:", err);
        return res.status(500).json({ message: "Erro interno do servidor ao atualizar agendamento." });
    }
}