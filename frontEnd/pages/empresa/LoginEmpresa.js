// pages/empresa/LoginEmpresa.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
// import Cookies from 'js-cookie'; // Não é mais estritamente necessário para o fluxo de login/redirecionamento, mas pode manter se usar para outras coisas.

export default function LoginEmpresa() {
    const router = useRouter();
    const initialState = { email: '', senha: '' };
    const [formData, setFormData] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    // Removido 'isLoggedIn' pois a verificação de autenticação agora é primariamente pelo cookie HttpOnly e middleware.
    // 'empresaDataFromLogin' é usado para dados temporários após o login bem-sucedido, para o redirecionamento imediato.
    const [empresaDataFromLogin, setEmpresaDataFromLogin] = useState(null);

    useEffect(() => {
        console.log('LoginEmpresa: Componente MONTADO. Router.query:', router.query);

        // Esta lógica só será executada se 'empresaDataFromLogin' for preenchido
        // após um SUBMIT de login BEM-SUCEDIDO NESTA SESSÃO.
        if (empresaDataFromLogin) {
            let redirectPath = '/dashboard-generico'; // Fallback padrão

            // Captura o 'returnTo' da URL.
            const { returnTo } = router.query; 

            const { primeiroLoginFeito, slugLoja } = empresaDataFromLogin;

            if (primeiroLoginFeito === false) {
                // Se for o primeiro login, redireciona para personalização
                redirectPath = '/empresa/${slugLoja}/personalizacao-loja';
            } else if (returnTo) {
                // Se existe um 'returnTo' na URL, usa ele
                redirectPath = returnTo;
            } else if (slugLoja) {
                // Se não tem 'returnTo' e já fez o primeiro login, vai para o dashboard da loja
                redirectPath = `/empresa/${slugLoja}/dashboard`;
            } else {
                // Último fallback, se nada se aplicar
                redirectPath = '/empresa/${slugLoja}/donoarea'; 
            }

            console.log('LoginEmpresa - useEffect: Redirecionando APÓS LOGIN para:', redirectPath);
            // Usa router.replace para evitar que a página de login fique no histórico do navegador
            router.replace(redirectPath);
            // Não precisa de setTimeout ou 'redirectAttempted' aqui, pois o 'empresaDataFromLogin'
            // só muda uma vez após o sucesso do submit e o 'router.replace' é eficiente.
        }

        // Não adicione lógica aqui para ler o cookie 'token_empresa' e redirecionar.
        // O middleware já lida com isso. Se o usuário está nesta página, é porque o middleware
        // decidiu que ele precisa fazer login.

        return () => {
            console.log('LoginEmpresa: Componente DESMONTADO.');
        };
    }, [router, empresaDataFromLogin]); // Dispara o useEffect quando router ou empresaDataFromLogin mudam.

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
            console.log('LoginEmpresa - Resposta bruta do backend:', data);

            if (!res.ok) {
                const mensagem = data?.error || data?.mensagem || 'Erro desconhecido ao tentar logar.';
                setErrors({ geral: mensagem });
                setIsLoading(false);
                return;
            }

            alert('Login realizado com sucesso!');
            
            // O cookie `token_empresa` será setado automaticamente pelo navegador
            // porque o backend enviou o cabeçalho Set-Cookie na resposta HTTP.
            // Não precisamos manipulá-lo no frontend com js-cookie aqui.
            
            // Armazena os dados relevantes da empresa para o redirecionamento do useEffect
            setEmpresaDataFromLogin(data); 
            
        } catch (err) {
            console.error('LoginEmpresa - Erro ao fazer login (catch):', err);
            setErrors({ geral: 'Erro ao fazer login. Tente novamente mais tarde.' });
        } finally {
            // setIsLoading(false); // Não reseta isLoading aqui, o useEffect vai redirecionar
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
                            disabled={isLoading} // Corrigido aqui
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
                            disabled={isLoading} // Corrigido aqui
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
                            disabled={isLoading} // Corrigido aqui
                        >
                            Cadastrar
                        </button>

                        <button
                            type="submit"
                            className="p-2 px-8 bg-[#3681B6] text-white rounded-xl"
                            disabled={isLoading} // Corrigido aqui
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