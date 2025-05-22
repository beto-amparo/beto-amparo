// pages/OwnerDashboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabaseClient';

async function simularLoginLoja() {
  try {
    const { data, error } = await supabase
      .from('loja')
      .select('*')
      .ilike('nome_fantasia', 'Ben Burguer')
      .single();

    if (error) {
      console.error('Erro ao buscar loja:', error);
      // Fallback: cria um token fictício se a requisição falhar
      const fakeDecoded = {
        tipo: 'empresa',
        id: 'fallback-id',
        nome_fantasia: 'Ben Burguer',
        slug_loja: 'ben-burguer',
        foto_loja: 'url-fallback',
      };
      const token = btoa(JSON.stringify(fakeDecoded));
      localStorage.setItem('token', token);
      console.log('Usando token fictício:', fakeDecoded);
      return fakeDecoded;
    }

    const fakeDecoded = {
      tipo: 'empresa',
      id: data.id,
      nome_fantasia: data.nome_fantasia,
      slug_loja: data.slug_loja,
      foto_loja: data.foto_loja,
    };

    const token = btoa(JSON.stringify(fakeDecoded));
    localStorage.setItem('token', token);
    console.log('Loja simulada logada:', fakeDecoded);
    return fakeDecoded;
  } catch (err) {
    console.error('Erro inesperado:', err);
    // Fallback em caso de erro inesperado
    const fakeDecoded = {
      tipo: 'empresa',
      id: 'fallback-id',
      nome_fantasia: 'Ben Burguer',
      slug_loja: 'ben-burguer',
      foto_loja: 'url-fallback',
    };
    const token = btoa(JSON.stringify(fakeDecoded));
    localStorage.setItem('token', token);
    console.log('Usando token fictício após erro:', fakeDecoded);
    return fakeDecoded;
  }
}

export default function OwnerDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [primeiroNome, setPrimeiroNome] = useState('Ben Burguer'); // Valor padrão

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const init = async () => {
      const decoded = await simularLoginLoja();
      setPrimeiroNome(decoded.nome_fantasia || 'Ben Burguer');
    };

    init();
  }, []);

  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="flex-1 bg-gray-100 p-6 md:p-8 mt-[64px] md:mt-0">
        <h1 className="text-2xl font-bold text-gray-600 mb-6 text-center">
          Bem-vindo (a) de volta, {primeiroNome}!
        </h1>
        {/* Conteúdo da dashboard */}
      </main>
    </div>
  );
}