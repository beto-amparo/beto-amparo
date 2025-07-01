// pages/hooks/useAuthCliente.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export const useAuthCliente = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState({
    autenticado: false,
    cliente: null
  });

  const verificarAutenticacao = () => {
    // Só executa no cliente (browser)
    if (typeof window === 'undefined') {
      return { autenticado: false, cliente: null };
    }

    const token = window.localStorage.getItem('token_cliente');
    const cliente = JSON.parse(window.localStorage.getItem('cliente') || null);
    return { autenticado: !!token && !!cliente, cliente };
  };

  useEffect(() => {
    const { autenticado } = verificarAutenticacao();
    if (!autenticado) {
      const redirect = encodeURIComponent(router.asPath);
      router.push(`/client/loginCliente?redirect=${redirect}`);
    } else {
      setAuthState(verificarAutenticacao());
    }
  }, [router.asPath]);

  return authState;
};