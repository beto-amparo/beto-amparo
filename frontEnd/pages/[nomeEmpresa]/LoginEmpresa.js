// pages/empresa/LoginEmpresa.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast'; 

export default function LoginEmpresa() {
  const router = useRouter();
  const initialState = { email: '', senha: '' };
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [empresaDataFromLogin, setEmpresaDataFromLogin] = useState(null);

  useEffect(() => {
    if (empresaDataFromLogin) {
        // 1. Comece com um caminho de fallback seguro.
        let redirectPath = '/'; // Redireciona para a home se nada for especificado

        const { returnTo } = router.query;
        // 2. AGORA SIM, puxe as variáveis que vêm da API.
        const { primeiroLoginFeito, nomeEmpresa } = empresaDataFromLogin;

        console.log('Dados recebidos para redirecionamento:', { primeiroLoginFeito, nomeEmpresa });

        // 3. Aplique a lógica de prioridades
        if (primeiroLoginFeito === false) {
            redirectPath = `/empresa/personalizacao-loja`;
        } else if (returnTo) {
            redirectPath = returnTo;
        } else if (nomeEmpresa) {
            // Este é o seu redirecionamento principal desejado
            redirectPath = `/${nomeEmpresa}/lojas`;
        }

        console.log('Redirecionando para:', redirectPath);
        router.replace(redirectPath);
    }
}, [router, empresaDataFromLogin]);

  const handleChange = ({ target }) => {
    const { name, value } = target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) {
      console.log('LoginEmpresa: Tentativa de submit ignorada (isLoading é true).');
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loginEmpresa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // IMPORTANTE: Permite o envio e recebimento de cookies (para o Set-Cookie do backend)
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log('LoginEmpresa - Resposta bruta do backend (APÓS SUBMIT MANUAL):', data);

      if (!res.ok) {
        const mensagem = data?.error || data?.mensagem || 'Erro desconhecido ao tentar logar.';
        setErrors({ geral: mensagem });
        setIsLoading(false);
        return;
      }

      setEmpresaDataFromLogin(data);
      // Não reseta isLoading aqui, o useEffect vai redirecionar
    } catch (err) {
      console.error('LoginEmpresa - Erro ao fazer login (catch):', err);
      setErrors({ geral: 'Erro ao fazer login. Tente novamente mais tarde.' });
      setIsLoading(false); // Reseta isLoading no erro da rede
    }
  };

  const handleCadastrar = () => {
    router.push('/cadastroEmpresa');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full sm:max-w-md">
        <div className="text-center mb-4">
          <img src="/logo.png" alt="Logo" className="mx-auto h-16" />
          <h1 className="text-xl font-bold text-[#3681B6] mt-2">Login empresa</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#3681B6] mb-2"
              placeholder="Digite seu email"
              required
              disabled={isLoading}
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
              placeholder="Digite sua senha"
              required
              disabled={isLoading}
            />
          </div>

          {errors?.geral && (
            <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-2 text-sm">
              {errors.geral}
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleCadastrar}
              className="p-2 px-6 bg-gray-200 text-[#3681B6] rounded-xl hover:bg-gray-300"
              disabled={isLoading}
            >
              Cadastrar
            </button>

            <button
              type="submit"
              className="p-2 px-8 bg-[#3681B6] text-white rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
          <div className="text-sm text-center">
            <Link href="/recuperar-senha" className="font-medium text-blue-600 hover:text-blue-500">
              Esqueceu sua senha?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}