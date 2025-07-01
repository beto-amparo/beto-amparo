// frontend/pages/_app.js

import "@/styles/globals.css";
import { Toaster } from 'react-hot-toast'; // Importe o componente Toaster

// A função principal do App pode ser uma função nomeada ou exportada diretamente
// Mantendo o padrão de exportação padrão
export default function App({ Component, pageProps }) { // Alterei para 'App' para seguir a convenção de nome
  return (
    <>
      <Component {...pageProps} />
      {/* Adicione o componente Toaster aqui, com as opções de estilo do develop */}
      <Toaster 
        position="top-right" // Posição dos toasts (top-right, top-center, etc.)
        toastOptions={{
          success: {
            style: {
              background: '#28A745', // Cor de fundo verde para sucesso
              color: 'white',        // Cor do texto branca
            },
          },
          error: {
            style: {
              background: '#DC3545', // Cor de fundo vermelha para erro
              color: 'white',        // Cor do texto branca
            },
          },
          // Você pode adicionar mais opções globais aqui para outros tipos de toast
        }}
      />
    </>
  );
}