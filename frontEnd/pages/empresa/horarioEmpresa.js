import React, { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { Trash2, PlusCircle } from "lucide-react";
import OwnerSidebar from '@/components/OwnerSidebar';
import { useRouter } from 'next/router';
import Notification from '@/components/ui/Notification.js'; // Componente de notificação

function diaDaSemanaLabel(dataStr) {
  const date = new Date(dataStr + "T00:00:00");
  const nomes = [
    "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
    "Quinta-feira", "Sexta-feira", "Sábado",
  ];
  return nomes[date.getDay()];
}

const IconAlert = () => (
  <svg className="w-4 h-4 text-red-500 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);


const ResumoIntervalos = ({ intervalos }) => {
  if (!intervalos || intervalos.length === 0) return <span className="italic text-sm text-gray-400">Sem horários definidos</span>;
  return (
    <span className="text-gray-600 font-mono text-xs md:text-sm">
      {intervalos.map(({ inicio, fim }) => `${inicio}–${fim}`).join(", ")}
    </span>
  );
};


function LinhaIntervalo({
  intervalo,
  blocoId,
  onDelete,
  onUpdate,
  onSplit,
  onNotify, // Prop para exibir notificações
}) {
  const [duracao, setDuracao] = useState(30);
  const [erroLocal, setErroLocal] = useState("");
  const isMasterInterval = !intervalo.originalId;

  useEffect(() => {
    if (!intervalo.inicio && !intervalo.fim) {
      setErroLocal("");
    } else if (!intervalo.inicio || !intervalo.fim) {
      setErroLocal("Preencha início e fim.");
    } else if (intervalo.fim <= intervalo.inicio) {
      setErroLocal("Hora final deve ser maior que a inicial.");
    } else {
      setErroLocal("");
    }
  }, [intervalo.inicio, intervalo.fim]);

  function dividirIntervaloInterno(inicioStr, fimStr, duracaoMinutos) {
    const resultado = [];
    if (!inicioStr || !fimStr || inicioStr.length !== 5 || fimStr.length !== 5) return resultado;
    const [h, m] = inicioStr.split(":").map(Number);
    const [fh, fm] = fimStr.split(":").map(Number);
    let inicioTotalMinutos = h * 60 + m;
    const fimTotalMinutos = fh * 60 + fm;
    if (inicioTotalMinutos >= fimTotalMinutos) return resultado;
    while (inicioTotalMinutos + duracaoMinutos <= fimTotalMinutos) {
      const fimSubIntervaloMinutos = inicioTotalMinutos + duracaoMinutos;
      const iniH = String(Math.floor(inicioTotalMinutos / 60)).padStart(2, "0");
      const iniM = String(inicioTotalMinutos % 60).padStart(2, "0");
      const fimH = String(Math.floor(fimSubIntervaloMinutos / 60)).padStart(2, "0");
      const fimM = String(fimSubIntervaloMinutos % 60).padStart(2, "0");
      resultado.push({
        id: uuid(),
        inicio: `${iniH}:${iniM}`,
        fim: `${fimH}:${fimM}`,
        originalId: intervalo.id,
      });
      inicioTotalMinutos += duracaoMinutos;
    }
    return resultado;
  }

  const handleDividirClick = () => {
    if (erroLocal) {
      onNotify(`Não é possível dividir. Corrija o erro: ${erroLocal}`, "error"); // Usa onNotify
      return;
    }
    
    // Ajuste de formatação para garantir HH:MM
    const partesInicio = intervalo.inicio.split(":");
    if (partesInicio.length >= 2) {
      intervalo.inicio = `${partesInicio[0].padStart(2, "0")}:${partesInicio[1].padStart(2, "0")}`;
    }
    const partesFim= intervalo.fim.split(":");
    if (partesFim.length >= 2) {
      intervalo.fim = `${partesFim[0].padStart(2, "0")}:${partesFim[1].padStart(2, "0")}`;
    }

    if (
      isMasterInterval &&
      intervalo.inicio && intervalo.inicio.length === 5 &&
      intervalo.fim && intervalo.fim.length === 5 &&
      intervalo.inicio < intervalo.fim &&
      duracao > 0
    ) {
      const subintervalos = dividirIntervaloInterno(intervalo.inicio, intervalo.fim, duracao);

      if (subintervalos.length > 0) {
        onSplit(blocoId, intervalo.id, subintervalos);
      } else {
        onNotify(`Não foi possível dividir o intervalo com a duração selecionada.`, "error"); // Usa onNotify
      }
    } else {
      if (!intervalo.inicio || !intervalo.fim ) onNotify("Preencha os horários de início e fim (HH:MM).", "error"); // Usa onNotify
      else if (duracao <= 0) onNotify("Selecione uma duração válida.", "error"); // Usa onNotify
      else if (!isMasterInterval) onNotify("Este sub-intervalo não pode ser dividido.", "error"); // Usa onNotify
      else onNotify("Não é possível dividir com as configurações atuais.", "error"); // Usa onNotify
    }
  };
  
  const inputClasses = `block w-24 rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-[#3681B6] focus:border-[#3681B6] text-sm py-1.5 px-2`;
  const errorInputClasses = `border-red-500 focus:ring-red-500 focus:border-red-500`;

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 py-2 px-1 rounded-md transition-colors ${isMasterInterval ? 'hover:bg-slate-50' : 'bg-gray-50 hover:bg-gray-100 pl-4'}`}>
      <input type="time" value={intervalo.inicio} onChange={(e) => onUpdate(blocoId, intervalo.id, "inicio", e.target.value)} className={`${inputClasses} ${erroLocal && (intervalo.inicio === "" || (intervalo.fim && intervalo.fim <= intervalo.inicio)) ? errorInputClasses : ""}`} disabled={!isMasterInterval && intervalo.originalId} />
      <span className="text-xs text-gray-500">às</span>
      <input type="time" value={intervalo.fim} onChange={(e) => onUpdate(blocoId, intervalo.id, "fim", e.target.value)} className={`${inputClasses} ${erroLocal && (intervalo.fim === "" || (intervalo.inicio && intervalo.fim <= intervalo.inicio)) ? errorInputClasses : ""}`} disabled={!isMasterInterval && intervalo.originalId} />
      {isMasterInterval && (
        <>
          <select value={duracao} onChange={(e) => setDuracao(Number(e.target.value))} className="block w-auto rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-[#3681B6] focus:border-[#3681B6] text-xs py-1.5 px-2 h-[34px]">
            <option value={15}>15 min</option> <option value={30}>30 min</option> <option value={45}>45 min</option> <option value={60}>60 min</option>
          </select>
          <button onClick={handleDividirClick} className="px-2.5 py-1 bg-[#3681B6] text-white rounded-md text-xs font-medium hover:bg-[#2c6991] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#3681B6] h-[34px]" title="Dividir">Dividir</button>
        </>
      )}
      <button onClick={() => onDelete(blocoId, intervalo.id)} className={`p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors ${isMasterInterval ? 'ml-auto sm:ml-1' : 'ml-auto'}`} title={isMasterInterval ? "Remover intervalo e sub-intervalos" : "Remover sub-intervalo"}>
        <Trash2 size={16} />
      </button>
      {erroLocal && (<p className="text-red-600 text-xs flex items-center w-full basis-full order-last pl-1 pt-0.5" role="alert"><IconAlert /> <span className="ml-1">{erroLocal}</span></p>)}
    </div>
  );
}



export default function HorariosPorData({ tipo = "agendamento" }) {

  const router = useRouter()
  const { slug } = router.query;

  const [blocos, setBlocos] = useState([]);
  const [novaData, setNovaData] = useState("");
  const [errorGeral, setErrorGeral] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null); // Estado para a notificação


  // Função para mostrar notificações usando o componente Notification
  const show = (msg, type) => {
    setNotification({ message: msg, type });
  };

  const carregarHorarios = async () => {
    
    if (!slug )return
    setIsLoading(true);
    setErrorGeral("");
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_EMPRESA_API + "/empresa/horarios/"+slug, {
        method: "GET",
        credentials: 'include', 
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const erroData = await response.json();
        throw new Error(erroData.message || "Erro ao carregar horários.");
      }

      const horariosSalvos = await response.json();

      // Transforma os dados do backend para o formato do estado do frontend
      const blocosFormatados = horariosSalvos.map(blocoSalvo => {
        const intervalosFormatados = (blocoSalvo.intervalos || []).map(intervaloSalvo => ({
          id: uuid(), // ID do frontend para manipulação e key
          inicio: intervaloSalvo.inicio,
          fim: intervaloSalvo.fim,
          originalId: null, // Assume que todos os intervalos carregados são "mestre"
                               // Se o backend enviar info de relação, precisaria de lógica aqui
        }));
        return {
          id: uuid(), // ID do frontend para manipulação e key
          data: blocoSalvo.data,
          fechado: blocoSalvo.fechado || false,
          repetirSemanal: blocoSalvo.repetirSemanal || false,
          // tipoConfig não faz parte do estado 'blocos', é usado na prop 'tipo'
          intervalos: intervalosFormatados,
        };
      });

      setBlocos(blocosFormatados);

    } catch (err) {
      console.error("Erro ao carregar horários:", err);
      
      setErrorGeral(err.message || "Não foi possível carregar os horários salvos.");
    } finally {
      setIsLoading(false);
    }
  };

  
  useEffect(() => {
    carregarHorarios();
  
  }, [slug]); // Adicionado slug como dependência para o useEffect

  async function handleDeletarData(b ) {
    const confirmar = confirm("Tem certeza que deseja excluir esta data?");
    if (!confirmar) return;
    
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_EMPRESA_API + "/empresa/horarios/" + b.data + '/' + slug, {
        method: 'DELETE',
        credentials: 'include',

      });
  
      if (response.status === 403) {
        // Se for 403, apenas remove do frontend, pois o backend já impediu a exclusão no DB
        setBlocos(prev => prev.filter(bloco => bloco.id !== b.id)); 
        show("Acesso negado para esta exclusão.", "error"); // Mensagem para o usuário
        return;
      }
  
      if (response.ok) {
      
        setBlocos(prev => prev.filter(bloco => bloco.id !== b.id));
        show("Data excluída com sucesso!", "success"); // Usa show
      } else {
        const result = await response.json(); // Pega a mensagem de erro do backend
        console.error(result);
        show("Erro ao excluir a data: " + (result.error || result.message || 'Erro desconhecido'), "error"); // Usa show
      }
    } catch (error) {
      console.error("Erro inesperado:", error);
      show("Erro inesperado ao tentar excluir a data.", "error"); // Usa show
    }
  }
  
  const salvarHorarios = async () => {

    try {
      const configuracoesParaEnviar = blocos.map((bloco) => ({
        data: bloco.data,
        fechado: bloco.fechado,
        repetirSemanal: bloco.repetirSemanal,
        tipoConfig: tipo, 
        intervalos: bloco.intervalos.map((iv) => ({
          inicio: iv.inicio,
          fim: iv.fim,
        })),
      }));
  
      const response = await fetch(process.env.NEXT_PUBLIC_EMPRESA_API + "/empresa/horarios/"+ slug, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",

        },
        body: JSON.stringify(configuracoesParaEnviar),
      });
  
      if (!response.ok) {
        const erroData = await response.json();
        throw new Error(erroData.message || "Erro ao salvar horários.");
      }
  
      show("Horários salvos com sucesso!", "success"); // Usa show

    } catch (err) {
      console.error("Erro ao salvar horários:", err);
      show("Error: " + err.message, "error"); // Usa show
      setErrorGeral(err.message || "Ocorreu um erro desconhecido ao salvar.");
    }
  };


  const adicionarBloco = () => {
    if (!novaData) {
      setErrorGeral("Selecione uma data primeiro.");
      return;
    }
    if (blocos.some((b) => b.data === novaData)) {
      setErrorGeral("Já existe um bloco para essa data. Remova o existente ou edite-o.");
      return;
    }
    setBlocos((prev) => [
      ...prev,
      {
        id: uuid(), 
        data: novaData,
        fechado: false,
        intervalos: [], 
        repetirSemanal: false,
      },
    ]);
    setNovaData(""); 
    setErrorGeral("");
  };

  const atualizarBloco = (blocoId, campo, valor) => {
    setBlocos((prev) =>
      prev.map((b) => {
        if (b.id === blocoId) {
          const atualizado = { ...b, [campo]: valor };
          if (campo === "fechado" && valor === true) {
            atualizado.intervalos = [];
          }
          return atualizado;
        }
        return b;
      })
    );
    setErrorGeral("");
  };

  const adicionarIntervaloAoBloco = (blocoId) => {
    setBlocos((prev) =>
      prev.map((b) =>
        b.id === blocoId
          ? { ...b, intervalos: [...b.intervalos, { id: uuid(), inicio: "", fim: "" }] } 
          : b
      )
    );
    setErrorGeral("");
  };

  const atualizarDadosIntervalo = (blocoId, intervaloId, campo, valor) => {
    setBlocos((prevBlocos) =>
      prevBlocos.map((b) => {
        if (b.id !== blocoId) return b;
        const novosIntervalos = b.intervalos.map((iv) =>
          iv.id === intervaloId ? { ...iv, [campo]: valor } : iv
        );
        return { ...b, intervalos: novosIntervalos };
      })
    );
    setErrorGeral("");
  };

  const removerIntervaloDoBloco = (blocoId, intervaloId) => {
    setBlocos((prevBlocos) =>
      prevBlocos.map((b) => {
        if (b.id !== blocoId) return b;
        const intervaloRemovido = b.intervalos.find(iv => iv.id === intervaloId);
        let intervalosAtualizados = [];
        if (intervaloRemovido && !intervaloRemovido.originalId) { 
            intervalosAtualizados = b.intervalos.filter(iv => iv.id !== intervaloId && iv.originalId !== intervaloId);
        } else { 
            intervalosAtualizados = b.intervalos.filter(iv => iv.id !== intervaloId);
        }
        return { ...b, intervalos: intervalosAtualizados };
      })
    );
    setErrorGeral("");
  };

  const handleIntervaloDividido = (blocoId, originalIntervaloId, subIntervalos) => {
    setBlocos((prevBlocos) =>
      prevBlocos.map((b) => {
        if (b.id !== blocoId) return b;
        const outrosIntervalos = b.intervalos.filter(
          (iv) => iv.id !== originalIntervaloId && iv.originalId !== originalIntervaloId
        );
        const todosNovosIntervalos = [...outrosIntervalos, ...subIntervalos];
        todosNovosIntervalos.sort((a, b) => a.inicio.localeCompare(b.inicio));
        return { ...b, intervalos: todosNovosIntervalos };
      })
    );
    setErrorGeral("");
  };

  function formatarData(dataStr) {
    if (!dataStr || typeof dataStr !== 'string') return "Data inválida";
    const parts = dataStr.split("-");
    if (parts.length !== 3) return "Data inválida";
    const [ano, mes, dia] = parts;
    return `${dia}/${mes}/${ano}`;
  }

  const validar = () => {
    for (const b of blocos) {
      if (b.fechado) continue; 
      if ((!b.intervalos || b.intervalos.length === 0)) {
        if (tipo === "agendamento") {
            setErrorGeral(`Adicione ao menos um intervalo em ${formatarData(b.data)} (${diaDaSemanaLabel(b.data)}) ou marque como fechado.`);
            return false;
        }
      }
      for (let i = 0; i < b.intervalos.length; i++) {
        const a = b.intervalos[i];
        if (!a.inicio || !a.fim) {
          setErrorGeral(`Preencha todos os campos de início e fim do intervalo em ${formatarData(b.data)} (${diaDaSemanaLabel(b.data)}).`);
          return false;
        }
        if (a.fim <= a.inicio) {
          setErrorGeral(`O horário de fim (${a.fim}) deve ser maior que o de início (${a.inicio}) em ${formatarData(b.data)} (${diaDaSemanaLabel(b.data)}).`);
          return false;
        }
        for (let j = i + 1; j < b.intervalos.length; j++) {
          const c = b.intervalos[j];
          if (a.originalId === c.originalId && a.originalId !== null) continue;
          if (a.inicio < c.fim && a.fim > c.inicio) {
            setErrorGeral(`Intervalos ${a.inicio}–${a.fim} e ${c.inicio}–${c.fim} sobrepostos em ${formatarData(b.data)} (${diaDaSemanaLabel(b.data)}).`);
            return false;
          }
        }
      }
    }
    setErrorGeral("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validar()) {
        return;
    }
    if (blocos.length === 0 && tipo === "agendamento") {
        setErrorGeral("Adicione pelo menos uma data e configure os horários antes de salvar.");
        return;
    }
    await salvarHorarios();
  };

  // Renderização condicional baseada no estado de carregamento
  if (isLoading) {
    return (
      <OwnerSidebar slug={slug}>
        <div className="max-w-3xl mx-auto p-4 md:p-6 text-center">
          <p className="text-lg text-gray-500">Carregando horários...</p>
          {/* Você pode adicionar um spinner SVG ou componente de spinner aqui */}
        </div>
      </OwnerSidebar>
    );
  }

  return (
    <OwnerSidebar slug={slug}>
      <div className="max-w-3xl mx-auto p-4 md:p-10 bg-white rounded-xl shadow-2xl font-sans">
        <h1 className="text-xl md:text-2xl font-bold text-[#3681B6] mb-6 text-center tracking-tight">
          {tipo === "agendamento" ? "Configurar Horários Disponíveis para Agendamento" : "Configurar Horário de Funcionamento"}
        </h1>

        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-slate-50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="date"
              value={novaData}
              onChange={(e) => {
                setNovaData(e.target.value);
                setErrorGeral(""); 
              }}
              className="block w-full sm:flex-1 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-[#3681B6] focus:border-[#3681B6] p-2.5 text-sm h-10"
            />
            <button
              onClick={adicionarBloco}
              className="px-5 py-2 bg-[#3681B6] text-white rounded-lg shadow-sm hover:bg-[#2c6991] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3681B6] text-sm font-medium h-10 flex items-center justify-center"
            >
              <PlusCircle size={18} className="mr-2"/>
              Adicionar Data
            </button>
          </div>
        </div>

        {errorGeral && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md relative mb-5 shadow" role="alert">
            <strong className="font-semibold">Atenção: </strong>
            <span className="block sm:inline">{errorGeral}</span>
          </div>
        )}

        <div className="space-y-6">
          {blocos.length === 0 && !isLoading && !errorGeral && (
              <div className="text-center py-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma configuração de horário encontrada.</h3>
                  <p className="mt-1 text-sm text-gray-500">Comece adicionando uma data para configurar os horários ou verifique se há horários salvos.</p>
              </div>
          )}
          {[...blocos] 
            .sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime() )
            .map((b) => (
            <section
              key={b.id} 
              className={`p-4 border border-gray-200 rounded-lg shadow-lg transition-all ${b.fechado ? "bg-slate-100 opacity-80" : "bg-white"}`}
            >
              <header className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200">
                <div className="flex-grow">
                  <h2 className="font-semibold text-base md:text-lg text-slate-800">
                    {formatarData(b.data)}
                    <span className="ml-2 text-xs md:text-sm text-slate-500 font-normal">({diaDaSemanaLabel(b.data)})</span>
                  </h2>
                  {!b.fechado && <ResumoIntervalos intervalos={b.intervalos} />}
                  {b.fechado && <span className="italic text-sm text-slate-500">Fechado neste dia</span>}
                </div>
                <button
                  onClick={() => {
                    handleDeletarData(b )
                  }}
                  className="p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-100 transition-colors ml-2"
                  title="Remover esta data e todos os seus horários"
                >
                  <Trash2 size={18} />
                </button>
              </header>

              {!b.fechado && (
                <div className="space-y-0.5">
                  {b.intervalos && b.intervalos
                    .sort((ivA, ivB) => ivA.inicio.localeCompare(ivB.inicio)) 
                    .map((iv) => ( 
                    <LinhaIntervalo
                      key={iv.id} 
                      intervalo={iv}
                      blocoId={b.id}
                      onUpdate={atualizarDadosIntervalo}
                      onDelete={removerIntervaloDoBloco} // Esta função já remove do estado do frontend
                      onSplit={handleIntervaloDividido}
                      onNotify={show} // Passa a função 'show' para o LinhaIntervalo
                    />
                  ))}
                  <button
                    onClick={() => adicionarIntervaloAoBloco(b.id)}
                    className="text-xs text-[#3681B6] hover:text-[#2c6991] font-medium mt-2 py-1.5 px-2.5 rounded-md hover:bg-sky-50 transition-colors flex items-center gap-1.5"
                  >
                    <PlusCircle size={16}/>
                    Adicionar Horário
                  </button>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-3 sm:space-y-0 text-sm">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={b.fechado}
                    onChange={(e) => atualizarBloco(b.id, "fechado", e.target.checked)}
                    className="h-4 w-4 text-[#3681B6] border-gray-300 rounded focus:ring-[#3681B6] cursor-pointer"
                  />
                  <span className="text-slate-700 group-hover:text-slate-900">Marcar como fechado</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={b.repetirSemanal}
                    onChange={(e) => atualizarBloco(b.id, "repetirSemanal", e.target.checked)}
                    className="h-4 w-4 text-[#3681B6] border-gray-300 rounded focus:ring-[#3681B6] cursor-pointer"
                  />
                  <span className="text-slate-700 group-hover:text-slate-900">Repetir semanalmente</span>
                </label>
              </div>
            </section>
          ))}
        </div>

        {(blocos.length > 0 || novaData ) && ( // Mostrar botão salvar se houver blocos ou intenção de adicionar novo
          <div className="mt-10 pt-6 border-t border-gray-200 text-center">
            <button
              onClick={handleSubmit}
              className="bg-[#3681B6] hover:bg-[#2c6991] text-white px-8 py-2.5 md:px-10 md:py-3 rounded-lg text-sm md:text-base font-semibold transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3681B6]"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        )}
      </div>
    
      {/* Componente de Notificação */}
      {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}
        
    </OwnerSidebar>
  );
}