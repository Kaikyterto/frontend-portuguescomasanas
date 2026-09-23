import Card from "./Card";
import { useNavigate } from "react-router-dom";

export default function ModuleProgress({ currentModule, onAdquirir }) {
  const navigate = useNavigate();

  // Verifica se o usuário tem acesso ao curso/módulo
  const comprado = currentModule?.comprado ?? true;

  const handleVerModulosCurso = (cursoId) => {
    if (!comprado) return; // Impede navegação se não comprou
    navigate(`/curso/${cursoId}`);
  };

  return (
    <Card
      className={`w-full flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 p-3.5 transition-colors ${
        !comprado ? "bg-slate-100 opacity-80 border-slate-400" : "bg-white"
      }`}
    >
      {/* Área de Texto e Progresso */}
      <div className="flex-1 min-w-0">
        <h2
          className={`text-base font-black tracking-tight mb-0.5 whitespace-normal sm:truncate flex items-center gap-2 ${
            !comprado ? "text-slate-500" : "text-slate-900"
          }`}
        >
          {!comprado && <span>🔒</span>}
          {currentModule.title}
        </h2>

        <p
          className={`text-xs font-medium line-clamp-2 sm:line-clamp-1 mb-3 sm:mb-2 ${
            !comprado ? "text-slate-400" : "text-slate-600"
          }`}
        >
          {currentModule.description}
        </p>

        {/* Barra de Progresso ou Aviso de Bloqueado */}
        {comprado ? (
          <div className="flex items-center gap-3 max-w-sm">
            <div className="flex-1 bg-slate-200 rounded-full h-2 border border-black overflow-hidden">
              <div
                className="bg-cyan-400 h-full border-r border-black transition-all duration-500"
                style={{ width: `${currentModule.progress}%` }}
              />
            </div>
            <span className="text-[10px] font-black shrink-0">
              {currentModule.progress}%
            </span>
          </div>
        ) : (
          <div className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
            Conteúdo Bloqueado
          </div>
        )}
      </div>

      {/* Renderização condicional dos botões com base no acesso */}
      {comprado ? (
        <button
          onClick={() => handleVerModulosCurso(currentModule.id)}
          className="w-full sm:w-auto text-center bg-cyan-300 border-2 border-black rounded-lg px-4 py-2 sm:py-1.5 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer whitespace-nowrap shrink-0 self-end sm:self-auto"
        >
          VER MÓDULO
        </button>
      ) : (
        <button
          onClick={() => onAdquirir && onAdquirir(currentModule.title)}
          className="w-full sm:w-auto bg-[#FF42DE] text-white border-2 border-black rounded-xl py-2 px-4 font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer shrink-0 uppercase whitespace-nowrap self-end sm:self-auto"
        >
          Adquirir
        </button>
      )}
    </Card>
  );
}
