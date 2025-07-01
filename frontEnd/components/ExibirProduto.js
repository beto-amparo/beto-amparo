import Image from "next/image";

const ExibirProduto = ({ produto, corPrimaria }) => (
  <div className="space-y-6">
    <div className="relative">
      <button
        onClick={() => window.history.back()}
        className="absolute -left-2 -top-2 w-10 h-10 flex items-center justify-center font-bold text-xl text-white rounded-full shadow-md z-10 transition-colors duration-200"
        style={{ backgroundColor: corPrimaria }}
      >
        &lt;
      </button>
      
      <div className="relative h-64 w-full overflow-hidden rounded-lg">
        <Image
          src={produto.image}
          alt={produto.nome}
          layout="fill"
          objectFit="cover"
          className="transition-opacity duration-300 hover:opacity-90"
        />
      </div>
    </div>
    
    <div className="space-y-2">
      <h2 className="text-2xl font-bold text-gray-800">{produto.nome}</h2>
      <p className="text-gray-600">
        {produto.descricao || "Descrição não disponível."}
      </p>
    </div>
  </div>
);

export default ExibirProduto;