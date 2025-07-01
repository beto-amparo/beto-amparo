const Carrinho = ({ subtotal, handleAddToCart, corPrimaria }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-800">Subtotal:</h3>
      <p className="text-xl font-bold" style={{ color: corPrimaria }}>
        R$ {subtotal.toFixed(2)}
      </p>
    </div>
    
    <button
      onClick={handleAddToCart}
      className="w-full py-3 px-4 rounded-lg text-white font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
      style={{ backgroundColor: corPrimaria }}
    >
      Adicionar ao Carrinho
    </button>
  </div>
);

export default Carrinho;