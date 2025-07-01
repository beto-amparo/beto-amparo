import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useIMask } from 'react-imask';
import suporteImg from '@/public/suporte_beto.svg'; // ajuste o caminho se necessário


export default function Suporte() {
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false); // <-- NOVO ESTADO
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cnpj: '',
    titulo: '',
    descricao: '',
  });
  const [anexo, setAnexo] = useState(null);
  const [errors, setErrors] = useState({});
  const [mensagem, setMensagem] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'success' ou 'error'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setAnexo(e.target.files[0]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome) newErrors.nome = 'O campo Nome é obrigatório.';
    if (!formData.email) newErrors.email = 'O campo Email é obrigatório.';
    if (!formData.cnpj) newErrors.cnpj = 'O campo CNPJ é obrigatório.';
    if (!formData.titulo) newErrors.titulo = 'O campo Título é obrigatório.';
    if (!formData.descricao) newErrors.descricao = 'O campo Descrição é obrigatório.';
    return newErrors;
  };
  useEffect(() => {
    if (!showSuccessModal) return;
    const timer = setTimeout(() => {
      setShowSuccessModal(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [showSuccessModal]);

  // ✅ CORRIGIDO: Função de envio usando FormData
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setErrors({});
    setMensagem('Enviando...');
    setSubmissionStatus(null);

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (anexo) {
      data.append('anexo', anexo);
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/suporte`, {
        method: 'POST',
        body: data,
      });

      if (res.ok) {
        setShowSuccessModal(true);
        setSubmissionStatus('success');
        setFormData({ nome: '', email: '', cnpj: '', titulo: '', descricao: '' });
        setAnexo(null);
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Erro ao enviar. Tente novamente.' }));
        setMensagem(errorData.message || 'Erro ao enviar. Tente novamente.');
        setSubmissionStatus('error');
      }
    } catch (error) {
        setMensagem('Erro de conexão. Verifique sua internet.');
        setSubmissionStatus('error');
    }
  };
  
  const { ref: cnpjRef, maskRef } = useIMask(
    { mask: '00.000.000/0000-00' },
    { onAccept: (value) => handleChange({ target: { name: 'cnpj', value } }) }
  );

  useEffect(() => {
    const verificarLogin = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/verificar-sessao`, {
          credentials: 'include', // Essencial para enviar o cookie de sessão!
        });

        if (res.ok) {
          const userData = await res.json();
          
          setFormData(prevData => ({
            ...prevData,
            nome: userData.nome || '',
            email: userData.email || '',
            cnpj: userData.cnpj || '',
          }));
          
          if (userData.cnpj && maskRef.current) {
            maskRef.current.value = userData.cnpj;
          }
          
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Erro ao verificar sessão, tratando como visitante.", error);
      }
    };

    verificarLogin();
  }, [maskRef]);
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-blue-50 px-4 py-10">
      {showSuccessModal && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm text-center transform transition-all scale-100 opacity-100">
          {/* Ícone de Sucesso */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {/* Título e Mensagem */}
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Enviado com Sucesso!</h3>
          <p className="text-gray-600">
            Sua solicitação foi recebida. Nossa equipe de suporte entrará em contato o mais breve possível.
            Fique de olho no seu e-mail!
          </p>
        </div>
      </div>
    )}
      <button
        onClick={() => router.back()}
        className="absolute top-5 left-5 sm:top-8 sm:left-8 z-10 bg-white/80 p-2 rounded-full shadow-md hover:bg-gray-200 transition-colors backdrop-blur-sm"
        aria-label="Voltar para a página anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="bg-white shadow-xl rounded-3xl overflow-hidden flex flex-col-reverse md:flex-row w-full max-w-5xl">
        <div className="w-full md:w-1/2 p-8 bg-[#5698c6] text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">Suporte Beto Amparo:</h2>
          <form onSubmit={handleSubmit} noValidate>

            <div className="mb-4">
              <input
                type="text" name="nome" value={formData.nome} onChange={handleChange}
                placeholder="Nome Completo"
                readOnly={isAuthenticated} // Campo bloqueado se logado
                className={`w-full p-3 bg-white text-black rounded-full outline-none placeholder:text-[#5698c6] placeholder:font-medium transition-all ${errors.nome ? 'ring-2 ring-red-400' : 'focus:ring-2 focus:ring-blue-200'} ${isAuthenticated ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                required
              />
              {errors.nome && <p className="text-red-300 text-sm mt-1 ml-3">{errors.nome}</p>}
            </div>
            
            <div className="mb-4">
              <input
                type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="Email"
                readOnly={isAuthenticated} // Campo bloqueado se logado
                className={`w-full p-3 bg-white text-black rounded-full outline-none placeholder:text-[#5698c6] placeholder:font-medium transition-all ${errors.email ? 'ring-2 ring-red-400' : 'focus:ring-2 focus:ring-blue-200'} ${isAuthenticated ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                required
              />
              {errors.email && <p className="text-red-300 text-sm mt-1 ml-3">{errors.email}</p>}
            </div>

            <div className="mb-4">
              <input
                ref={cnpjRef} type="text" name="cnpj" placeholder="CNPJ"
                value={formData.cnpj} onChange={handleChange} // Garante que o valor seja controlado pelo React
                readOnly={isAuthenticated} // Campo bloqueado se logado
                className={`w-full p-3 bg-white text-black rounded-full outline-none placeholder:text-[#5698c6] placeholder:font-medium transition-all ${errors.cnpj ? 'ring-2 ring-red-400' : 'focus:ring-2 focus:ring-blue-200'} ${isAuthenticated ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                required
              />
              {errors.cnpj && <p className="text-red-300 text-sm mt-1 ml-3">{errors.cnpj}</p>}
            </div>

            <div className="mb-4">
              <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} placeholder="Título do Problema" className={`w-full p-3 bg-white text-black rounded-full outline-none placeholder:text-[#5698c6] placeholder:font-medium transition-all ${errors.titulo ? 'ring-2 ring-red-400' : 'focus:ring-2 focus:ring-blue-200'}`}/>
              {errors.titulo && <p className="text-red-300 text-sm mt-1 ml-3">{errors.titulo}</p>}
            </div>
            
            <div className="mb-6">
              <textarea name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Descrição do problema" rows={4} className={`w-full p-3 bg-white text-black rounded-2xl outline-none placeholder:text-[#5698c6] placeholder:font-medium transition-all ${errors.descricao ? 'ring-2 ring-red-400' : 'focus:ring-2 focus:ring-blue-200'}`}></textarea>
              {errors.descricao && <p className="text-red-300 text-sm mt-1 ml-3">{errors.descricao}</p>}
            </div>
            
            <div className="mb-4">
              <label htmlFor="file-upload" className="w-full cursor-pointer border border-white text-white font-medium py-2 px-4 rounded-full flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                <Image src="/icons/clip.svg" alt="Ícone de anexo" width={20} height={20} />
                <span>Anexar imagem (opcional)</span>
              </label>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif"/>
            </div>

            {anexo && (
              <div className="mb-4 flex items-center justify-between bg-white/20 text-white p-2 rounded-full">
                <span className="text-sm truncate pl-2">{anexo.name}</span>
                <button type="button" onClick={() => setAnexo(null)} className="text-white bg-red-500/80 rounded-full h-6 w-6 flex items-center justify-center hover:bg-red-600 transition-colors" aria-label="Remover anexo">&times;</button>
              </div>
            )}

            <div className="flex justify-center mt-6">
              <button type="submit" className="w-40 bg-[#FAA042] text-white font-semibold py-2 px-4 rounded-full hover:bg-orange-500 transition-colors">
                Enviar
              </button>
            </div>
          </form>

          {/* ✅ CORRIGIDO: Lógica da mensagem de status usando o estado 'submissionStatus' */}
          {mensagem && (
            <p className={`text-center mt-4 text-sm ${submissionStatus === 'error' ? 'text-red-300' : 'text-white'}`}>{mensagem}</p>
          )}
        </div>

        <div className="md:w-1/2 flex justify-center items-center p-8">
          <Image src={suporteImg} alt="Ilustração de suporte" className="w-72 h-auto" />
        </div>
      </div>
    </div>
  );
}