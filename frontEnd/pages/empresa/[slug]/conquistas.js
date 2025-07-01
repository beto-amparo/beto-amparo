// pages/empresa/[slug]/conquistas.js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import OwnerSidebar from '../../../components/OwnerSidebar'; // Ajuste o caminho se necessário
import AchievementsList from '../../../components/AchievementsList'; // Este componente você vai criar/finalizar

export default function ConquistasPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [ownerSlug, setOwnerSlug] = useState(null);

  useEffect(() => {
    if (slug) {
      setOwnerSlug(slug);
    }
  }, [slug]);

  if (!ownerSlug) {
    return <p>Carregando...</p>; // Ou um spinner de carregamento
  }

  return (
    <OwnerSidebar slug={ownerSlug}>
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-gray-800">Minhas Conquistas</h1>
        {/* O componente AchievementsList fará a chamada à API e exibirá as conquistas */}
        <AchievementsList ownerSlug={ownerSlug} />
      </div>
    </OwnerSidebar>
  );
}