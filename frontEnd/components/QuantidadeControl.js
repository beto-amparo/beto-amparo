const QuantidadeControl = ({ produto, quantidade, setQuantidade, corPrimaria }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
    <div className="space-y-1">
      <p className="text-2xl font-bold" style={{ color: corPrimaria }}>
        R$ {produto.preco.toFixed(2)}
      </p>
      {produto.desconto && (
        <p className="text-sm line-through text-gray-400">
          R$ {(produto.preco * (1 - produto.desconto/100)).toFixed(2)}
        </p>
      )}
    </div>
    
    <div className="flex items-center space-x-3">
      <button
        onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
        className="w-10 h-10 flex items-center justify-center rounded-full text-white transition-colors"
        style={{ backgroundColor: corPrimaria }}
      >
        -
      </button>
      <span className="text-xl font-medium w-8 text-center">{quantidade}</span>
      <button
        onClick={() => setQuantidade((q) => q + 1)}
        className="w-10 h-10 flex items-center justify-center rounded-full text-white transition-colors"
        style={{ backgroundColor: corPrimaria }}
      >
        +
      </button>
    </div>
  </div>
);

export default QuantidadeControl;