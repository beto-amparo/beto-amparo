import * as loja  from "../../models/Loja.js"
import { DatasConfiguradasModel } from '../../models/DatasConfiguradasModel.js';
import { IntervalosHorarioModel } from '../../models/IntervalosHorarioModel.js';
import * as agendamento from '../../models/agendamentoModel.js';
import * as agendamentoEmpresaModel from '../../models/agendamentoEmpresaModel.js';
import { format } from 'date-fns';

export const getHoraririosAgendamentoController = async (req, res) => {
    const { slug } = req.params;

    try {
        const { data: lojaData, error: modelError } = await loja.buscarLojaPorSlugCompleta(slug);

        if (modelError || !lojaData) {
            return res.status(404).json({ message: "Loja não encontrada para este slug." });
        }
        const datasConfig = await DatasConfiguradasModel.buscarDatasPorEmpresaPorSlug(slug);
        const datasConfigIds = datasConfig.map(dc => dc.id).filter(Boolean);
   
        let intervalos = [];
        if (datasConfigIds.length > 0) {
        intervalos = await IntervalosHorarioModel.getByDataConfigIds(datasConfigIds);
        }

        const result = datasConfig.map(dc => ({
        ...dc,
        intervalos: intervalos
            .filter(iv => iv.data_config_id === dc.id)
            .sort((a, b) => a.inicio.localeCompare(b.inicio))
        }));

  
        
        res.status(200).json(result);
    } catch (err) {
        console.error("Controller Error: Erro ao buscar horários de agendamento:", err);
        res.status(500).json({ message: "Erro interno do servidor ao buscar horários de agendamento." });
    }



} 

export const postAgendamentoController = async (req, res) => {
    try {
        const { slug } = req.params;
        const id_cliente = req.ClientId;
        const { data: dataAgendada, horario } = req.body;

        // Buscar informações da loja
        const lojaInfo = await loja.buscarLojaPorSlugCompleta(slug);
        if (!lojaInfo) {
            return res.status(404).json({ message: "Loja não encontrada." });
        }

        const id_empresa = lojaInfo.data.id_empresa;
        const dataFormatada = format(dataAgendada, 'yyyy-MM-dd');

        const agendamentoData = {
            data: dataFormatada,
            time: horario,
            slug,
            id_cliente,
            id_empresa,
        };

        // Verificar se já existe agendamento no mesmo dia e horário
        const agendamentoDuplicado = await agendamento.verificaAgendamentoDuplicado(agendamentoData);
        if (agendamentoDuplicado) {
            return res.status(400).json({ message: "Já existe um agendamento para esta data e horário." });
        }

        // Verificar se a data está configurada
        const dataConfigurada = await DatasConfiguradasModel.getByDataAndEmpresa(dataAgendada, id_empresa , slug);
        if (!dataConfigurada) {
            return res.status(400).json({ message: "A data escolhida não está disponível para agendamentos." });
        }

        // Atualizar status do intervalo de horário
        const intervaloAtualizado = await IntervalosHorarioModel.updateAvailableStatus(
            dataConfigurada.id,
            false,
            horario
        );

        if (!intervaloAtualizado) {
            return res.status(400).json({ message: "Horário selecionado não está mais disponível." });
        }

        // Criar agendamento
        const novoAgendamento = await agendamento.agendamentoInsert(agendamentoData);

        return res.status(201).json({
            message: "Agendamento criado com sucesso.",
            data: novoAgendamento,
        });

    } catch (err) {
        console.error("Erro no controller de agendamento:", err);
        return res.status(500).json({ message: "Erro interno no servidor ao criar agendamento." });
    }
};
export const getAgendamentoByIdController = async (req, res) => {
   
    const cliente_id = req.ClientId;
    const { slug } = req.params;
    if (!cliente_id) {
        return res.status(400).json({ message: "ID do cliente não fornecido." });
    }
    if (!slug) {
        return res.status(400).json({ message: "Slug da loja não fornecido." });
    }
    try {
        const agendamentoData = await agendamento.getAgendamentosByCliente(cliente_id , slug);
     
        if (!agendamentoData) {
            return res.status(404).json({ message: "Agendamento não encontrado." });
        }

        return res.status(200).json(agendamentoData);
    } catch (err) {
        console.error("Erro ao buscar agendamento por ID:", err);
        return res.status(500).json({ message: "Erro interno do servidor ao buscar agendamento." });
    }
}

export const putAgendamentoCancelamentoController = async (req, res) => {
    const { slug } = req.params;
    const cliente_id = req.ClientId;
    const {  data, time,id_empresa } = req.body;
    try {
   const dataConfigurada = await DatasConfiguradasModel.getByDataAndEmpresa(data, id_empresa);
    if (!dataConfigurada) {
        return res.status(400).json({ message: "A data escolhida não está disponível para agendamentos." });        

    }
    const intervaloAtualizado = await IntervalosHorarioModel.updateAvailableStatus(
        dataConfigurada.id,
        true,
        time
    );
    if (!intervaloAtualizado) {
        return res.status(400).json({ message: "Horário selecionado não está mais disponível." });
    }  
    const agendamentoStatus = await agendamentoEmpresaModel.updateAgendamentoController(
        data,
        time,
        id_empresa,
        "Cancelado",
        cliente_id,
    );
    if (!agendamentoStatus) {
        return res.status(400).json({ message: "Erro ao cancelar o agendamento." });
    }    
    return res.status(200).json({ message: "Agendamento cancelado com sucesso." });
        
    } catch (err) {
        console.error("Erro ao atualizar agendamento:", err);
        return res.status(500).json({ message: "Erro interno do servidor ao atualizar agendamento." });
    }
};  