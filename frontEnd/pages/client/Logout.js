
'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_EMPRESA_API + '/clientLogout', {

        method: 'GET',
        credentials: 'include', 
      });
     
      if (response.ok) {
        window.location.href = '/login'; 
      } else {
        console.error('Erro ao fazer logout');
      }
    } catch (error) {
      console.error('Erro na requisição de logout:', error);
    }
  };

  return (
   
        <button
        onClick={handleLogout}
        className="bg-blue-400 text-white px-4 py-1 rounded hover:bg-blue-600 transition"
        >
        Sair
        </button>
  
  );
}
