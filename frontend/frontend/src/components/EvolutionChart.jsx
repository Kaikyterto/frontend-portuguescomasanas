import Card from "./Card";

export default function EvolutionChart({ percentage = 0 }) {
  // Garante que a porcentagem fique entre 0 e 100
  const safePercentage = Math.max(0, Math.min(100, percentage));

  return (
    <Card className="w-full lg:w-64 p-4 flex flex-col items-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl bg-[#F4EFE6] overflow-hidden">
      {/* Barra superior estilo janela Mac/Neo-brutalista */}
      <div className="w-[calc(100%+2rem)] bg-[#00D2DF] border-b-2 border-black -mt-4 p-2 px-4 flex gap-1.5 mb-4 shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF42DE] border border-black"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 border border-black"></span>
      </div>

      <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider self-start mb-4">
        Minha Evolução
      </h4>

      {/* Gráfico Circular com Progresso em Degradê */}
      <div className="relative my-auto flex items-center justify-center">
        {/* Container principal com borda e sombra brutalista */}
        <div className="w-32 h-32 rounded-full border-2 border-black bg-slate-200 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex items-center justify-center">
          {/* Camada do Degradê Real (Revelada dinamicamente pelo conic-gradient) */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-[#00D2DF] via-[#7B5CFA] to-[#FF42DE]"
            style={{
              clipPath: "circle(50%)",
              maskImage: `conic-gradient(black ${
                safePercentage * 3.6
              }deg, transparent 0deg)`,
              WebkitMaskImage: `conic-gradient(black ${
                safePercentage * 3.6
              }deg, transparent 0deg)`,
            }}
          />

          {/* Centro do Gráfico (Rosca interna) */}
          <div className="w-[82%] h-[82%] bg-[#F4EFE6] rounded-full border-2 border-black flex flex-col items-center justify-center p-2 text-center z-10">
            <span className="text-2xl font-black text-slate-900 leading-none">
              {safePercentage}%
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 mt-1">
              taxa de acerto
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
