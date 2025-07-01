import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RedefinirSenha() {
  const router = useRouter();
  const { token, redirect } = router.query;

  const [formData, setFormData] = useState({ senha: '', confirmacao: '' });
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tipo, setTipo] = useState('empresa');
  const [deveRedirecionar, setDeveRedirecionar] = useState(false);

  // Normaliza o redirect para começar com '/'
  const normalizedRedirect = redirect
    ? redirect.startsWith('/')
      ? redirect
      : '/' + redirect
    : '';

  useEffect(() => {
    if (!router.isReady) return;
      console.log('redirect:', redirect);

    if (normalizedRedirect.startsWith('/loja')) {
      setTipo('cliente');
    } else {
      setTipo('empresa');
    }
  }, [router.isReady, normalizedRedirect]);

  useEffect(() => {
    if (deveRedirecionar) {
      console.log('Redirecionando para:', normalizedRedirect, 'Tipo:', tipo);

      if (tipo === 'cliente') {
        router.push(
          normalizedRedirect
            ? `/login?redirect=${encodeURIComponent(normalizedRedirect)}`
            : '/login'
        );
      } else {
        router.push('/empresa/LoginEmpresa');
      }
      setDeveRedirecionar(false);
    }
  }, [deveRedirecionar, tipo, normalizedRedirect, router]);

  const handleChange = ({ target }) => {
    const { name, value } = target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);
    setErro(null);

    if (formData.senha !== formData.confirmacao) {
      setErro('As senhas não coincidem.');
      return;
    }

    if (!token) {
      setErro('Token inválido ou expirado.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/nova-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha: formData.senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.mensagem || 'Erro ao redefinir senha.');
      }

      toast.success('Senha redefinida com sucesso!');
      setDeveRedirecionar(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const linkLogin = tipo === 'cliente'
    ? (normalizedRedirect ? `/login?redirect=${encodeURIComponent(normalizedRedirect)}` : '/login')
    : '/empresa/LoginEmpresa';

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full sm:max-w-md">
          <div className="text-center mb-4">
            <img src="/logo.png" alt="Logo" className="mx-auto h-16" />
            <h1 className="text-xl font-bold text-[#3681B6] mt-2">Definir Nova Senha</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
              <input
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                placeholder="Digite sua nova senha"
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#3681B6] mb-2"
                required
                disabled={isLoading}
              />

              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
              <input
                type="password"
                name="confirmacao"
                value={formData.confirmacao}
                onChange={handleChange}
                placeholder="Confirme sua nova senha"
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
                required
                disabled={isLoading}
              />
            </div>

            {mensagem && (
              <div className="bg-green-100 text-green-700 p-3 rounded-xl text-sm">
                {mensagem}
              </div>
            )}
            {erro && (
              <div className="bg-red-100 text-red-700 p-3 rounded-xl text-sm">
                {erro}
              </div>
            )}

            <button
              type="submit"
              className="w-full p-2 bg-[#3681B6] text-white rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar nova senha'}
            </button>

            <div className="text-sm text-center mt-3">
              <Link href={linkLogin} className="font-medium text-blue-600 hover:text-blue-500">
                Voltar para login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
