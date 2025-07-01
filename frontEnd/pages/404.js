// pages/404.js
import Image from 'next/image';
import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-white px-4">
      
      <Image src="/logo.png" alt="Logo da empresa" width={150} height={150} />

      <h1 className="text-6xl font-extrabold text-red-500 mt-8">404</h1>
      <p className="text-2xl text-gray-700 mt-4">
        Opa! Você tropeçou em um link quebrado. 🧱
      </p>
      <p className="text-md text-gray-500 mt-2">
        Parece que essa página foi dar um passeio... e se perdeu. 😅
      </p>

      <Link
        href="/"
        className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
      >
        Voltar para a página inicial
      </Link>
    </div>
  );
}
