import Card from "./Card";

export default function DailyQuestions() {
  return (
    <Card className="w-full lg:w-64 p-4 flex flex-col justify-between border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl bg-[#F4EFE6] overflow-hidden">
      {/* Conteúdo Principal */}
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

      {/* Botão Brutalista Ajustado */}
      <button className="w-full bg-cyan-300 border-2 border-black rounded-xl py-2.5 px-4 font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1 hover:bg-cyan-200 transition-all active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] cursor-pointer shrink-0">
        VER QUESTÕES ➔
      </button>
    </Card>
  );
}
