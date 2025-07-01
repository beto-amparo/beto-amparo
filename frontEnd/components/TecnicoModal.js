// components/TecnicoModal.js

import { useState, useRef } from 'react';
import { FiX, FiPaperclip, FiLoader, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

export default function TecnicoModal({ isOpen, onClose }) {
    // Estados para os campos do formulário
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [anexo, setAnexo] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const fileInputRef = useRef(null);

    const titulosDeSuporte = [
        "Erro ao finalizar a compra",
        "Página não carrega / Erro no site",
        "Problema com o login ou cadastro",
        "Funcionalidade não está operando",
        "Sugestão de melhoria",
        "Outro"
    ];

    const formatCPF = (value) => {
        const numericValue = value.replace(/\D/g, '');
        const truncatedValue = numericValue.slice(0, 11);
        let formattedValue = truncatedValue;
        if (truncatedValue.length > 9) {
            formattedValue = truncatedValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (truncatedValue.length > 6) {
            formattedValue = truncatedValue.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        } else if (truncatedValue.length > 3) {
            formattedValue = truncatedValue.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        }
        return formattedValue;
    };
    
    const handleCpfChange = (e) => {
        const formattedCpf = formatCPF(e.target.value);
        setCpf(formattedCpf);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!titulo) {
            setError("Por favor, selecione um motivo para o contato.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        const cleanCpf = cpf.replace(/\D/g, '');

        const formData = new FormData();
        formData.append('nome', nome);
        formData.append('email', email);
        formData.append('cpf', cleanCpf);
        formData.append('titulo', titulo);
        formData.append('descricao', descricao);
        if (anexo) {
            formData.append('anexo', anexo);
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/suporte/cliente`,  {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Ocorreu um erro ao enviar o chamado.');
            }

            setSuccess('Seu chamado foi enviado com sucesso! Nossa equipe já está analisando e retornará o contato em breve.');
            setNome(''); setEmail(''); setCpf(''); setTitulo(''); setDescricao(''); setAnexo(null);
            if(fileInputRef.current) fileInputRef.current.value = "";

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 transition-opacity">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Relatar um Problema Técnico</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
                        <FiX size={24} />
                    </button>
                </header>
                
                <div className="p-6 overflow-y-auto">
                    {success ? (
                        <div className="text-center p-6">
                            <FiCheckCircle className="mx-auto text-green-500 h-16 w-16 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-800">Enviado!</h3>
                            <p className="text-gray-600 mt-2">{success}</p>
                            <button onClick={onClose} className="mt-6 w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600">
                                Fechar
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Linha 1: Nome e Email */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">O seu Nome:</label>
                                    <input type="text" id="nome" value={nome} onChange={e => setNome(e.target.value)} required className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"/>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">O seu Email:</label>
                                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"/>
                                </div>
                            </div>

                            {/* Linha 2: CPF */}
                            <div>
                                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">CPF:</label>
                                <input 
                                  type="text" 
                                  id="cpf" 
                                  value={cpf} 
                                  onChange={handleCpfChange} 
                                  required 
                                  placeholder="000.000.000-00" 
                                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" 
                                  maxLength="14"
                                />
                            </div>

                            {/* Linha 3: Título (Select) */}
                            <div>
                                <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">Motivo do Contato:</label>
                                <select id="titulo" value={titulo} onChange={e => setTitulo(e.target.value)} required className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900">
                                    <option value="" disabled>Selecione um motivo...</option>
                                    {titulosDeSuporte.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            {/* Linha 4: Descrição */}
                            <div>
                                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">Descreva o problema:</label>
                                {/* ✅ CORRIGIDO: Adicionada a classe text-gray-900 para garantir boa legibilidade */}
                                <textarea id="descricao" rows="4" value={descricao} onChange={e => setDescricao(e.target.value)} required placeholder="Por favor, detalhe o máximo possível o que aconteceu..." className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"></textarea>
                            </div>

                            {/* Linha 5: Anexo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Anexar uma captura de ecrã (opcional)</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        <FiPaperclip className="mx-auto h-10 w-10 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                                <span>Clique para selecionar</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={e => setAnexo(e.target.files[0])} ref={fileInputRef} />
                                            </label>
                                        </div>
                                        {anexo ? (
                                            <p className="text-xs text-green-600 font-semibold">{anexo.name}</p>
                                        ) : (
                                            <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Botão de Envio e Mensagens */}
                            <div className="pt-4">
                                {error && (
                                    <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg mb-4">
                                        <FiAlertTriangle />
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}
                                <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed">
                                    {isLoading && <FiLoader className="animate-spin" />}
                                    {isLoading ? 'A enviar...' : 'Abrir Chamado'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
