import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function AchievementsList({ ownerSlug }) {
  const router = useRouter();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/empresa/${ownerSlug}/achievements`, {
          credentials: 'include',
        });

        if (response.status === 401) {
          if (router.asPath !== '/empresa/LoginEmpresa') {
            router.push('/empresa/LoginEmpresa');
          }
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.mensagem || `Erro HTTP! Status: ${response.status}`);
        }

        const data = await response.json();
        const validAchievements = data.map(mission => ({
            ...mission,
            goal: mission.goal || 1 // Garante que goal não seja zero para a divisão
        }));
        setAchievements(validAchievements);
      } catch (err) {
        setError(err.message || "Erro ao carregar conquistas.");
      } finally {
        setLoading(false);
      }
    };

    if (ownerSlug) {
      fetchAchievements();
    }
  }, [ownerSlug, router.asPath]);

  if (loading) {
    return <p className="text-gray-700">Carregando missões...</p>;
  }
  if (error) {
    return <p className="text-red-500">Erro: {error}</p>;
  }
  if (achievements.length === 0) {
    return <p className="text-gray-700">Nenhuma missão disponível no momento.</p>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-900">Suas Missões e Conquistas</h3>
      <div className="space-y-4">
        {achievements.map((mission) => (
          <div key={mission.id} className="flex items-center space-x-4 bg-gray-50 p-3 rounded-md border border-gray-200">
            {mission.badge_image_url && (
              <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-full overflow-hidden text-black">
                <Image
                  src={mission.badge_image_url}
                  alt={mission.name}
                  layout="fill"
                  objectFit="contain"
                  unoptimized={mission.badge_image_url.endsWith('.svg')}
                />
              </div>
            )}
            <div className="flex-grow">
              <h4 className="font-bold text-lg text-gray-800">{mission.name}</h4>
              <p className="text-gray-600 text-sm">{mission.description}</p>

              {/* BLOCO ÚNICO DE PROGRESSO (BARRA + TEXTO) */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  // A cor da barra depende se a missão está completa ou não
                  className={`h-2.5 rounded-full ${mission.is_completed ? 'bg-green-500' : 'bg-blue-500'}`}
                  // A largura da barra é calculada com base no progresso, limitado a 100%
                  style={{ width: `${Math.min((mission.current_progress / mission.goal) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Progresso: {mission.current_progress}/{mission.goal}
                {/* Texto de conclusão/em andamento */}
                {mission.is_completed ? (
                  mission.completed_at ? (
                    ` (Concluído em: ${new Date(mission.completed_at).toLocaleDateString('pt-BR')})`
                  ) : (
                    ' (Concluído!)'
                  )
                ) : (
                  ' (Em andamento)'
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}