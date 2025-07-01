import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import toast from 'react-hot-toast'; 
//import Image from 'next/image';
import NextImage from 'next/image';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default function PersonalizacaoLoja() {
  const router = useRouter();
  const { slug } = router.query;
  const [uploading, setUploading] = useState(false);
  const [posicaoVerticalBanner, setPosicaoVerticalBanner] = useState(50); // centralizado por padrão


  const [dados, setDados] = useState({
    nome_fantasia: '',
    cor_primaria: '',
    cor_secundaria: '',
    foto_loja: '',
    banner: '',
    slogan: '',
    slug_loja: '',
  });

  const [imagemFotoLoja, setImagemFotoLoja] = useState(null);
  const [imagemBanner, setImagemBanner] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function cropBannerImage(file, cropPercent = 50) {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const reader = new FileReader();

      reader.onload = () => {
        img.src = reader.result;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');

        const targetWidth = 1200; // exemplo de largura final
        const targetHeight = 400; // exemplo de altura final

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');

        const scale = targetWidth / img.width;
        const scaledHeight = img.height * scale;

        const offsetY = (scaledHeight - targetHeight) * ((100 - cropPercent) / 100);

        ctx.drawImage(
          img,
          0,
          -offsetY, // move a imagem para cima
          targetWidth,
          scaledHeight
        );

        canvas.toBlob((blob) => {
          const croppedFile = new File([blob], file.name, { type: file.type });
          resolve(croppedFile);
        }, file.type);
      };

      img.onerror = reject;
      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  }

  async function uploadImagemSupabase(file, pasta) {
  setUploading(true);
  try {
    const nomeArquivo = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from(pasta).upload(nomeArquivo, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from(pasta).getPublicUrl(nomeArquivo);
    setUploading(false);
    return urlData.publicUrl;
  } catch (error) {
    setUploading(false);
    console.error('Erro no upload:', error.message);
    return null;
  }
}
  useEffect(() => {
    if (!slug) return;

    async function buscarDados() {
      try {
        const resposta = await axios.get(`${process.env.NEXT_PUBLIC_EMPRESA_API}/empresa/personalizacao/${slug}`);
        setDados(resposta.data);
      } catch (err) {
        setErro('Erro ao carregar dados de personalização.');
      } finally {
        setCarregando(false);
      }
    }

    buscarDados();
  }, [slug]);

  function handleChange(e) {
    const { name, value } = e.target;
    setDados(prev => ({ ...prev, [name]: value }));
  }

  const [previewFotoLoja, setPreviewFotoLoja] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);

  function handleImageSelect(e, tipo) {
    const file = e.target.files[0];
    if (!file) return;

    if (tipo === 'foto_loja') {
      setImagemFotoLoja(file);
      setPreviewFotoLoja(URL.createObjectURL(file)); // preview somente
    } else if (tipo === 'banner') {
      setImagemBanner(file);
      setPreviewBanner(URL.createObjectURL(file)); // preview somente
    }
  }


  async function handleSubmit(e) {
  e.preventDefault();

  try {
    let urlFotoLoja = dados.foto_loja;
    let urlBanner = dados.banner;

    if (imagemFotoLoja) {
      const url = await uploadImagemSupabase(imagemFotoLoja, 'lojas');
      if (url) urlFotoLoja = url;
    }

    if (imagemBanner) {
      const imagemCortada = await cropBannerImage(imagemBanner, posicaoVerticalBanner);
      const url = await uploadImagemSupabase(imagemCortada, 'lojas');
      if (url) urlBanner = url;
    }


    const atualizados = {
      ...dados,
      foto_loja: urlFotoLoja,
      banner: urlBanner,
    };

    await axios.put(`${process.env.NEXT_PUBLIC_EMPRESA_API}/empresa/personalizacao/${slug}`, atualizados);

    toast.success('Dados atualizados com sucesso!');
    router.push(`/empresa/${slug}/donoarea`);
  } catch (err) {
    console.error(err);
    toast.error('Erro ao atualizar dados');
  }
}


  if (carregando) return <p>Carregando...</p>;
  if (erro) return <p>{erro}</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full sm:max-w-3xl text-black">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#3681B6] mb-6 text-center">
          Editar Informações da Loja
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome da loja */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
            <input
              type="text"
              name="nome_fantasia"
              value={dados.nome_fantasia}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-xl"
            />
          </div>

          {/* Slogan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slogan</label>
            <input
              type="text"
              name="slogan"
              value={dados.slogan}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl"
            />
          </div>

          {/* Cores */}
          <div className="flex gap-6">
            <div>
              <label>Cor Primária</label>
              <input type="color" name="cor_primaria" value={dados.cor_primaria} onChange={handleChange} />
            </div>
            <div>
              <label>Cor Secundária</label>
              <input type="color" name="cor_secundaria" value={dados.cor_secundaria} onChange={handleChange} />
            </div>
          </div>

        {/* Foto da loja */}
        <div>
          <label>Foto da Loja</label>
          {(previewFotoLoja || dados.foto_loja) && (
            <div className="flex justify-center mb-4">
            <img
              src={previewFotoLoja || dados.foto_loja}
              className="w-56 h-56 object-cover rounded-xl mb-2"
              alt="Foto da loja"
            />
            </div>
          )}
          <input
            id="fotoLojaInput"
            type="file"
            style={{ display: 'none' }}
            onChange={e => handleSelect(e, 'foto_loja')}
          />
          <label
            htmlFor="fotoLojaInput"
            className="block w-full bg-gradient-to-r from-[#3681B6] to-[#2e6e99] text-white py-3 rounded-xl text-center cursor-pointer"
          >
            Escolher Foto da Loja
          </label>
        </div>

          {/* Banner */}
          <label>Banner da Loja</label>
          <div className="w-full h-48 relative rounded-t-lg overflow-hidden mb-2 bg-gray-200">
            {(previewBanner || dados.banner) && (
              <img
                src={previewBanner || dados.banner}
                alt="Banner"
                className="absolute w-full h-auto object-cover"
                style={{
                  top: `${posicaoVerticalBanner}%`,
                  transform: 'translateY(-50%)',
                  position: 'absolute',
                }}
              />
            )}
          </div>
          <label className="text-sm text-gray-700">Ajustar posição vertical do banner</label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={posicaoVerticalBanner}
            onChange={(e) => setPosicaoVerticalBanner(Number(e.target.value))}
            className="w-full"
          />

      <input
        id="bannerInput"
        type="file"
        style={{ display: 'none' }}
        onChange={e => handleImageSelect(e, 'banner')}
      />
      <label
        htmlFor="bannerInput"
        className="w-full bg-gradient-to-r from-[#3681B6] to-[#2e6e99] text-white py-3 rounded-xl block text-center cursor-pointer"
      >
        Escolher Banner
      </label>


          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              name="slug_loja"
              value={dados.slug_loja}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#3681B6] to-[#2e6e99] text-white py-3 rounded-xl"
          >
            Salvar
          </button>
        </form>
      </div>
    </div>
  );
}
