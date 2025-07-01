// pages/auth-success.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

export default function AuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    console.log('AuthSuccessPage: Componente MONTADO.');
    const { returnTo } = router.query;

    // Se não há returnTo, ou se o usuário não está logado (o que não deveria acontecer se chegou aqui)
    const token = Cookies.get('token_empresa');
    if (!token) {
        console.warn('AuthSuccessPage: Sem token, redirecionando para login.');
        router.replace('/empresa/LoginEmpresa'); // replace para não adicionar ao histórico
        return;
    }

    const finalRedirectPath = returnTo || '/dashboard-generico'; // Fallback
    
    console.log('AuthSuccessPage: Redirecionando para destino final:', finalRedirectPath);
    // Usar window.location.href para garantir um hard redirect após a página intermediária
    window.location.href = finalRedirectPath; 

  }, [router]); // Depende apenas do router

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-xl text-[#3681B6]">Autenticação bem-sucedida. Redirecionando...</p>
    </div>
  );
}