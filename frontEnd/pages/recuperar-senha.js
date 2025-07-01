import { useState, useEffect  } from 'react';
import { useRouter } from 'next/router';

export default function RecuperarSenha() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('empresa'); // default empresa
  const [redirect, setRedirect] = useState(''); // <-- adiciona redirect no estado
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [linkLogin, setLinkLogin] = useState('/empresa/LoginEmpresa');

  useEffect(() => {
    if (!router.isReady) return;

    const r = router.query.redirect || '';
    setRedirect(r);  // salva redirect no estado

    if (r) {
      setLinkLogin(`/login?redirect=${encodeURIComponent(r)}`);

      if (r.startsWith('/loja')) {
        setTipo('cliente');
      } else {
        setTipo('empresa');
      }
    } else {
      setTipo('empresa');
      setLinkLogin('/empresa/LoginEmpresa');
    }
  }, [router.isReady, router.query.redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);
    setErro(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/recuperar-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tipo, redirect }),  // <-- usa redirect do estado aqui
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.mensagem || 'Erro ao solicitar recuperação.');
      }

      setMensagem('Instruções de recuperação de senha foram enviadas para seu e-mail.');
    } catch (err) {
      setErro(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full sm:max-w-md">
        <div className="text-center mb-4">
          <img src="/logo.png" alt="Logo" className="mx-auto h-16" />
          <h1 className="text-xl font-bold text-[#3681B6] mt-2">Recuperar Senha</h1>
          <p className="text-sm text-gray-600 mt-1">
            Digite seu e-mail de {tipo === 'empresa' ? 'empresa' : 'cliente'} para receber um link de redefinição de senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
            placeholder="Seu e-mail"
            required
            disabled={isLoading}
          />

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
            {isLoading ? 'Enviando...' : 'Enviar e-mail de recuperação'}
          </button>

          <div className="text-sm text-center mt-2">
            <a href={linkLogin} className="text-blue-600 hover:underline">
              Voltar para o login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
