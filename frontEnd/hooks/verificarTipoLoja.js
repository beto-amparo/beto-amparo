import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';


export const verificarTipoDeLoja = async (slug) => {
    if (!slug) {
      console.warn('Slug não fornecido para verificar o tipo da loja.');
      return null;
    }
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/tipoLoja/${slug}`);
  
      if (!response.ok) {
        console.error('Erro ao buscar tipo da loja:', await response.text());
        return null;
      }
  
      const data = await response.json();
      return data.tipoLoja; 
    } catch (error) {
      console.error('Erro na requisição de tipo da loja:', error);
      return null;
    }
  };
  