'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
    const [redirectUrl, setRedirectUrl] = useState('/');

  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [erros, setErros] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      const { redirect } = router.query;
      setRedirectUrl(typeof redirect === 'string' ? redirect : '/');
    }
  }, [router.isReady, router.query]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErros([]);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      
      if (!res.ok) {
        const mensagem = data?.error || data?.mensagem || 'Erro desconhecido.';
        setErrors({ geral: mensagem });
        return;
      }

      alert('Login realizado com sucesso!');
      router.push(redirectUrl).then(() => window.location.reload());
    } catch (err) {
      console.error(err);
      setErrors({ geral: 'Erro ao fazer login. Tente novamente mais tarde.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 bg-opacity-60 backdrop-blur-sm">
      {/* Container principal */}
      <div className="flex max-w-4xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Lado esquerdo - Imagem ilustrativa */}
        <div className="hidden md:block md:w-1/2 bg-blue-600 relative">
          <Image
            src="/pexels-markusspiske-6502328.jpg"
            alt="Ilustração de login"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-blue-800 bg-opacity-30 flex items-center justify-center">
            <h2 className="text-white text-3xl font-bold px-8 text-center">
              Bem-vindo de volta!
            </h2>
          </div>
        </div>
        
        {/* Lado direito - Formulário de login */}
        <div className="w-full md:w-1/2 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Faça seu login</h1>
            <p className="text-gray-600 mt-2">
              Acesse sua conta para continuar
            </p>
          </div>
          
          {erros.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <ul className="list-disc pl-5">
                {erros.map((erro, index) => (
                  <li key={index}>{erro}</li>
                ))}
              </ul>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="seu@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                Senha *
              </label>
              <input
                type="password"
                id="senha"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                required
                minLength="6"
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="lembrar-me"
                  name="lembrar-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="lembrar-me" className="ml-2 block text-sm text-gray-700">
                  Lembrar de mim
                </label>
              </div>
              
              <div className="text-sm">
              <Link href="/recuperar-senha" className="font-medium text-blue-600 hover:text-blue-500">
  Esqueceu sua senha?
</Link>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link href="/cadastro" className="font-medium text-blue-600 hover:text-blue-500">
              
                Cadastre-se
              
            </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
