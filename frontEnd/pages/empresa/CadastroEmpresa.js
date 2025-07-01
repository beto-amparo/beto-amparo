import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast'; 

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT',
  'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO',
  'RR', 'SC', 'SP', 'SE', 'TO'
];

const categorias = ['Comércio', 'Serviços', 'Alimentação', 'Tecnologia', 'Educação', 'Indústria'];

const initialState = {
  nome: '', cnpj: '', responsavel: '', telefone: '', endereco: '', cidade: '',
  uf: '', site: '', categoria: '', email: '', senha: '',
};

const fields = [
  { label: 'Nome da Empresa', name: 'nome' },
  { label: 'CNPJ', name: 'cnpj' },
  { label: 'Responsável', name: 'responsavel' },
  { label: 'Telefone', name: 'telefone' },
  { label: 'Endereço', name: 'endereco' },
  { label: 'Cidade', name: 'cidade' },
  { label: 'UF', name: 'uf', type: 'select', options: estados },
  { label: 'Site (opcional)', name: 'site' },
  { label: 'Categoria', name: 'categoria', type: 'select', options: categorias },
  { label: 'Email', name: 'email', type: 'email' },
  { label: 'Senha', name: 'senha', type: 'password' },
  { label: 'Confirmar Senha', name: 'confirmarSenha', type: 'password' },
];

export default function CadastrarEmpresa() {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [errorsField, setErrorsField] = useState({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const currentField = fields[step];

  const handleChange = ({ target }) => {
    const { name, value } = target;
    let newValue = value;

    if (name === 'cnpj') {
      newValue = value.replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
    } else if (name === 'telefone') {
      newValue = value.replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15);
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const validateField = () => {
    if (currentField.name === 'site') {
      return true;
    }
    const fieldValue = formData[currentField.name];
    return fieldValue && fieldValue.trim().length > 0;
  };

  const handleNext = () => {
    if (!validateField()) return setErrorsField({ [currentField.name]: 'Campo obrigatório' });
    setErrorsField({});
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.senha !== formData.confirmarSenha) {
      return setErrorsField({ [currentField.name]: 'As senhas não coincidem.' });
    }

    setErrors({});
    setLoading(true);

    try {
      // 1. CHAMA A API DE CADASTRO DA EMPRESA
      const resCadastro = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/addEmpresa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const dataCadastro = await resCadastro.json();
      console.log('RESPOSTA API CADASTRO EMPRESA:', dataCadastro);
      console.log('Status da resposta Cadastro:', resCadastro.status);

      if (!resCadastro.ok) {
        console.error("Erro no cadastro da empresa:", dataCadastro);
        setErrors(dataCadastro.errors || { geral: dataCadastro.mensagem || 'Erro desconhecido ao cadastrar.' });
        setLoading(false);
        return;
      }

      const empresaId = dataCadastro.id || dataCadastro.empresaId; // Confirme o nome da propriedade que sua API retorna
      if (!empresaId) {
        console.warn('ID da empresa não retornado pela API de cadastro ou é inválido:', dataCadastro);
        setErrors({ geral: 'Empresa cadastrada, mas ID não retornado. Tente fazer login.' });
        window.location.href = '/loginEmpresa'; // Redireciona para login se o ID não for obtido
        setLoading(false);
        return;
      }

      // 2. TENTA FAZER LOGIN PROGRAMATICAMENTE APÓS O CADASTRO BEM-SUCEDIDO
      const resLogin = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loginEmpresa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // IMPORTANTE: Permite o envio e recebimento de cookies (para o Set-Cookie do backend)
        body: JSON.stringify({
          email: formData.email,
          senha: formData.senha,
        }),
      });

      const dataLogin = await resLogin.json();
      console.log('RESPOSTA API LOGIN APÓS CADASTRO:', dataLogin);
      console.log('Status da resposta Login:', resLogin.status);

      if (!resLogin.ok) {
        console.error("Erro no login automático após cadastro:", dataLogin);
        //alert('Empresa cadastrada, mas falha no login automático. Por favor, faça login.');
        window.location.href = '/loginEmpresa';
        return;
      }

      // 3. SE O LOGIN FOR BEM-SUCEDIDO, REDIRECIONA COM BASE NO `primeiroLoginFeito`
      const { primeiroLoginFeito, slugLoja } = dataLogin;

      // Armazena o ID da empresa no localStorage para a personalização da loja
      localStorage.setItem('id_empresa_cadastrada', empresaId);
      console.log('ID da empresa salvo no localStorage APÓS LOGIN:', localStorage.getItem('id_empresa_cadastrada'));

      let redirectPath;
      if (primeiroLoginFeito === false) {
        redirectPath = `/empresa/personalizacao-loja`;
      } else if (slugLoja) {
        redirectPath = `/empresa/${slugLoja}/dashboard`;
      } else {
        redirectPath = '/empresa/donoarea';
      }

      toast.success('Empresa cadastrada e login automático realizado com sucesso!');
      window.location.href = redirectPath;

    } catch (err) {
      console.error('Erro geral no fluxo de cadastro/login automático:', err);
      setErrors({ geral: 'Erro ao conectar com o servidor ou processo de cadastro/login falhou.' });
    } finally {
      setLoading(false);
      setFormData(initialState);
      setStep(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full sm:max-w-md">
        <div className="text-center mb-4">
          <img src="/logo.png" alt="Logo" className="mx-auto h-16" />
          <h1 className="text-xl font-bold text-[#3681B6] mt-2">Cadastre sua empresa</h1>
        </div>

        <div className="w-full bg-gray-200 h-2 rounded-xl mb-4">
          <div
            className="bg-[#3681B6] h-full rounded-xl transition-all duration-300"
            style={{ width: `${((step + 1) / fields.length) * 100}%` }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {currentField.label}
            </label>

            {currentField.type === 'select' ? (
              <select
                name={currentField.name}
                value={formData[currentField.name]}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl"
                required
              >
                <option value="">Selecione</option>
                {currentField.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : currentField.name === 'senha' ? (
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl pr-20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            ) : (
              <input
                type={currentField.type || 'text'}
                name={currentField.name}
                value={formData[currentField.name]}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl"
                required={currentField.name !== 'site'}
              />
            )}

            {errorsField[currentField.name] && (
              <p className="text-red-600 text-sm mt-1">{errorsField[currentField.name]}</p>
            )}
          </div>

          {errors && Object.keys(errors).length > 0 && (
            <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm space-y-1">
              {Object.entries(errors).map(([campo, mensagem]) => (
                <div key={campo}>
                  <strong>{campo}:</strong> {mensagem}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mt-6">
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="p-2 px-4 bg-gray-200 rounded-xl text-gray-700"
              >
                <ChevronLeft className="inline mr-1" size={18} /> Voltar
              </button>
            ) : <div />}

            {step === fields.length - 1 ? (
              <button
                type="submit"
                className="p-2 px-4 bg-[#3681B6] text-white rounded-xl"
                disabled={loading}
              >
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="p-2 px-4 bg-[#3681B6] text-white rounded-xl"
              >
                Avançar <ChevronRight className="inline ml-1" size={18} />
              </button>
            )}

          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Já possui uma conta?{' '}
              <a href="/loginEmpresa" className="text-[#3681B6] hover:underline font-medium">
                Faça login
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}