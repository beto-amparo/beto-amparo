import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import OwnerSidebar from '@/components/OwnerSidebar';

export default function HorarioFuncionamentoPage() {
    const router = useRouter();
    const { slug } = router.query;
    const [horarios, setHorarios] = useState({
        segunda: { aberto: true, inicio: '08:00', fim: '18:00' },
        terca: { aberto: true, inicio: '08:00', fim: '18:00' },
        quarta: { abierto: true, inicio: '08:00', fim: '18:00' },
        quinta: { aberto: true, inicio: '08:00', fim: '18:00' },
        sexta: { aberto: true, inicio: '08:00', fim: '18:00' },
        sabado: { aberto: false, inicio: '', fim: '' },
        domingo: { aberto: false, inicio: '', fim: '' },
    });
    const [mensagem, setMensagem] = useState('');
    const [corMensagem, setCorMensagem] = useState('');

    useEffect(() => {
        if (slug) {
            fetchHorarios();
        }
    }, [slug]);

    const fetchHorarios = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/empresa/loja/${slug}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.horarios_funcionamento) {
                    setHorarios(prev => ({ ...prev, ...data.horarios_funcionamento }));
                }
            }
        } catch (error) {
            // Error handling, but without console.error for clean output
        }
    };

    const handleChange = (dia, campo, valor) => {
        setHorarios(prev => ({
            ...prev,
            [dia]: {
                ...prev[dia],
                [campo]: valor
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensagem('Salvando horários...');
        setCorMensagem('text-blue-600');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/horarios`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ horarios: horarios }), 
                credentials: 'include',
            });

            if (response.ok) {
                setMensagem('Horários salvos com sucesso!');
                setCorMensagem('text-green-600');
            } else {
                const errorData = await response.json();
                setMensagem(`Erro ao salvar: ${errorData.message || response.statusText}`);
                setCorMensagem('text-red-600');
            }
        } catch (error) {
            setMensagem(`Erro de conexão: ${error.message}`);
            setCorMensagem('text-red-600');
        } finally {
            setTimeout(() => setMensagem(''), 3000);
        }
    };

    const diasDaSemana = {
        segunda: 'Segunda-feira',
        terca: 'Terça-feira',
        quarta: 'Quarta-feira',
        quinta: 'Quinta-feira',
        sexta: 'Sexta-feira',
        sabado: 'Sábado',
        domingo: 'Domingo',
    };

    return (
        <OwnerSidebar slug={slug}>
            <div className="w-full h-full flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-5 w-full sm:max-w-2xl relative">
                    <Link href={`/empresa/${slug}/configuracoes`}>
                        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold p-1 leading-none cursor-pointer">
                            &times;
                        </button>
                    </Link>

                    <div className="flex justify-between items-center mb-3 mt-3">
                        <div className="h-12 object-contain">
                            <Image src="/logo.png" width={80} height={70} alt="Logo da Marca" />
                        </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-semibold mb-6" style={{ color: '#3681B6' }}>
                        Horário de Funcionamento
                    </h1>

                    {mensagem && (
                        <div className={`text-center mb-4 font-medium ${corMensagem}`}>
                            {mensagem}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {Object.entries(horarios).map(([diaKey, diaValue]) => (
                            <div key={diaKey} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 last:border-b-0">
                                <label className="flex items-center mb-2 sm:mb-0 w-full sm:w-1/3">
                                    <input
                                        type="checkbox"
                                        checked={diaValue.aberto}
                                        onChange={(e) => handleChange(diaKey, 'aberto', e.target.checked)}
                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="font-semibold text-lg text-gray-800">{diasDaSemana[diaKey]}</span>
                                </label>
                                <div className="flex gap-2 w-full sm:w-2/3">
                                    <input
                                        type="time"
                                        value={diaValue.inicio}
                                        onChange={(e) => handleChange(diaKey, 'inicio', e.target.value)}
                                        disabled={!diaValue.aberto}
                                        className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-white"
                                    />
                                    <span className="flex items-center text-gray-600">-</span>
                                    <input
                                        type="time"
                                        value={diaValue.fim}
                                        onChange={(e) => handleChange(diaKey, 'fim', e.target.value)}
                                        disabled={!diaValue.aberto}
                                        className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-white"
                                    />
                                </div>
                            </div>
                        ))}
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors cursor-pointer"
                            style={{ backgroundColor: '#3681B6' }}
                        >
                            Salvar Horários
                        </button>
                    </form>
                </div>
            </div>
        </OwnerSidebar>
    );
}