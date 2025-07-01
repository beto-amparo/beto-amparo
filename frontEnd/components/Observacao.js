export const Obersevacao = ({ produto }) => (
    <div className="flex flex-col px-6 justify-center mt-4">
        <h2 className="text-lg font-semibold mb-2 ">Observações</h2>
        <textarea
        className="w-full h-20 p-2 border border-gray-300 rounded-lg"
        placeholder="Digite suas observações aqui..."
        ></textarea>
    </div>
)