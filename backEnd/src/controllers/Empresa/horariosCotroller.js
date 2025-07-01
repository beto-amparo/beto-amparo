import { DatasConfiguradasModel } from '../../models/DatasConfiguradasModel.js';
import { IntervalosHorarioModel } from '../../models/IntervalosHorarioModel.js';

// GET - Buscar todas as datas configuradas por empresa
export const getDatasConfiguradasByEmpresa = async (req, res) => {
  const empresaId = req.IdEmpresa;
  const slug = req.params.slug


  try {
    const datasConfig = await DatasConfiguradasModel.buscarDatasPorEmpresaPorId(empresaId , slug);
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
  } catch (error) {
    console.error('Erro ao buscar datas configuradas:', error.message);
    res.status(500).json({ error: 'Erro interno ao buscar horários.' });
  }
};

export const saveDatasConfiguradas = async (req, res) => {
  const empresaId = req.IdEmpresa;
  const datasToSave = req.body;
  const slug = req.params.slug

  if (!Array.isArray(datasToSave)) {
    return res.status(400).json({ error: 'A requisição deve ser um array de configurações.' });
  }

  try {
    const hasErrors = datasToSave.some(dc => {
      if (!dc.data || !dc.tipoConfig) return true;
      if (!dc.fechado && (!dc.intervalos || dc.intervalos.length === 0)) return true;
      if (!dc.fechado && dc.intervalos) {
        return dc.intervalos.some(iv => !iv.inicio || !iv.fim || iv.fim <= iv.inicio);
      }
      return false;
    });

    if (hasErrors) {
      return res.status(400).json({ error: 'Dados inválidos nas configurações de data ou intervalos.' });
    }

    for (const dc of datasToSave) {
      console.log('Processando data configurada:', dc);
      const { data, tipoConfig, fechado, intervalos , repetirSemanal } = dc;

      let dataExistente = null;

    
      dataExistente = await DatasConfiguradasModel.getByDataAndEmpresa(data, empresaId , slug);
      

      if (dataExistente) {
        
        
        await DatasConfiguradasModel.update(dataExistente.id, { data, tipoConfig, fechado , slug });

        if (fechado) {
          await IntervalosHorarioModel.deleteByDataConfigId(dataExistente.id);
        } else {
          const currentIntervals = await IntervalosHorarioModel.getByDataConfigId(dataExistente.id);

          const newIntervalKeys = new Set(intervalos.map(iv => `${iv.inicio}-${iv.fim}`));
          const currentIntervalKeys = new Set(currentIntervals.map(iv => `${iv.inicio}-${iv.fim}`));

          const toAdd = intervalos.filter(iv => !currentIntervalKeys.has(`${iv.inicio}-${iv.fim}`));
          const toRemove = currentIntervals.filter(iv => !newIntervalKeys.has(`${iv.inicio}-${iv.fim}`));

          if (toAdd.length > 0) {
            await IntervalosHorarioModel.bulkInsert(toAdd.map(iv => ({
              ...iv,
              data_config_id: dataExistente.id
            })));
          }
          if (toRemove.length > 0) {
            await IntervalosHorarioModel.deleteByIds(toRemove.map(iv => iv.id));
          }
        }

      } else {
        // Inserção nova
       
        const [novaData] = await DatasConfiguradasModel.bulkInsert([{ data, tipoConfig, fechado, empresa_id: empresaId , slug}]);
        
        if (!fechado && intervalos?.length > 0) {
          const novos = intervalos.map(iv => ({
            ...iv,
            data_config_id: novaData.id
          }));
          await IntervalosHorarioModel.bulkInsert(novos);
        }
      }
    }

    res.status(200).json({ message: 'Configurações salvas com sucesso.' });

  } catch (error) {
    console.error('Erro ao salvar configurações:', error.message);
    res.status(500).json({ error: 'Erro interno ao salvar configurações.' });
  }
};




export const deleteDataConfigurada = async (req, res) => {
  const { data , slug } = req.params;
  const empresaId = req.IdEmpresa;

  try {
    const dataExistente = await DatasConfiguradasModel.getByDataAndEmpresa(data, empresaId , slug)
    

    if (!dataExistente ) {
      return res.status(403).json({ error: 'Acesso negado ou horário não encontrado.' });
    }
    await IntervalosHorarioModel.deleteByDataConfigId(dataExistente.id);
    await DatasConfiguradasModel.deleteById(dataExistente.id);
    res.status(204).json({ message: 'Horário deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar data configurada:', error.message);
    res.status(500).json({ error: 'Erro interno ao deletar horário.' });
  }
};
