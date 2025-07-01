const Adicionais = ({ adicionais = [], selecionados = {}, toggleAdicional, corPrimaria }) => (
  <div className="space-y-6">
    {adicionais.length > 0 && (
      <>
        {adicionais.map((grupo, index) => (
          <div key={index} className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              {grupo.tipo}
            </h3>

            <div className="space-y-2">
              {grupo.opcoes.map((opcao, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100"
                >
                  <div>
                    <p className="font-medium text-gray-800">{opcao.nome}</p>
                    <p className="text-sm text-gray-500">R$ {opcao.preco.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleAdicional(opcao.nome, opcao.preco, "-")}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-white transition-colors"
                      style={{ backgroundColor: corPrimaria }}
                    >
                      -
                    </button>
                    <span className="w-6 text-center">
                      {selecionados[opcao.nome]?.count || 0}
                    </span>
                    <button
                      onClick={() => toggleAdicional(opcao.nome, opcao.preco, "+")}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-white transition-colors"
                      style={{ backgroundColor: corPrimaria }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </>
    )}
  </div>
);

export default Adicionais;