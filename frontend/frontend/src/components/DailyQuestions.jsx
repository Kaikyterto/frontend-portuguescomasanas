import Card from "./Card";

export default function DailyQuestions() {
  return (
    <Card className="w-full lg:w-64 p-4 flex flex-col justify-between border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl bg-[#F4EFE6] overflow-hidden relative">
      {/* Camada de sobreposição (Overlay) por cima de todo o card */}
      <div className="absolute inset-0 bg-[#F4EFE6]/70 backdrop-blur-[1px] z-10 flex items-center justify-center p-4">
        <div className="bg-cyan-300 text-black border-2 border-black px-4 py-2 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-3 text-center">
          EM BREVE
        </div>
      </div>

      {/* Conteúdo Principal original */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-base font-black leading-tight mb-2 text-slate-900 uppercase tracking-wide">
          Questões Recomendadas
        </h3>
        <p className="text-xs font-medium text-slate-700 mb-4 leading-relaxed">
          Uma seleção personalizada de questões para o seu nível e progresso.
        </p>
        <ul className="text-xs font-bold space-y-1 text-slate-800 list-disc list-inside mt-auto mb-4">
          <li>Pontuação: 10 Questões</li>
          <li>Crase: 5 Questões</li>
        </ul>
      </div>

      {/* Botão original */}
      <button
        disabled
        className="w-full bg-cyan-300 border-2 border-black rounded-xl py-2.5 px-4 font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1 cursor-not-allowed shrink-0 opacity-50"
      >
        VER QUESTÕES ➔
      </button>
    </Card>
  );
}
