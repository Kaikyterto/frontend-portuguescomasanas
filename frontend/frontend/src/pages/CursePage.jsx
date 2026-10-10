import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Card from "../components/Card";
import { buscarDadosUsuarioLogado } from "../service/user";
import { cursoService } from "../service/curso";
import { moduloService } from "../service/module";
import { aulaService } from "../service/aula";
export default function CursePage() {
  const navigate = useNavigate();
  const { id: cursoId } = useParams();
  const [usuario, setUsuario] = useState(null);
  const [cursoData, setCursoData] = useState(null);
  const [modulos, setModulos] = useState([]);

  const [aulasPorModulo, setAulasPorModulo] = useState({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [moduloAtivo, setModuloAtivo] = useState(null);
  const [videoSelecionado, setVideoSelecionado] = useState(null);

  let LINK_MEET_FIXO = "";
  if (Number(cursoId) === 8) {
    LINK_MEET_FIXO = "https://meet.google.com/yfm-ektc-svr";
  } else if (Number(cursoId) === 9) {
    LINK_MEET_FIXO = "https://meet.google.com/ddq-bsqk-gaw";
  }

  const [aulasAssistidas, setAulasAssistidas] = useState(() => {
    const salvo = localStorage.getItem(
      `@PortuguessComAnas:curso_${cursoId}_assistidas`
    );
    return salvo ? JSON.parse(salvo) : [];
  });

  useEffect(() => {
    async function carregarDadosPagina() {
      const token = localStorage.getItem("@PortuguessComAnas:token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const [dadosUsuario, dadosCurso, dadosModulos] = await Promise.all([
          buscarDadosUsuarioLogado(token),
          cursoService.buscarPorId(cursoId, token),
          moduloService.listarModulos(cursoId, token),
        ]);

        setUsuario(dadosUsuario);
        setCursoData(dadosCurso);
        setModulos(dadosModulos || []);

        if (dadosModulos && dadosModulos.length > 0) {
          setModuloAtivo(dadosModulos[0].id);

          const mapaAulas = {};
          await Promise.all(
            dadosModulos.map(async (modulo) => {
              try {
                const aulasDoMod = await aulaService.listar(
                  cursoId,
                  modulo.id,
                  token
                );
                mapaAulas[modulo.id] = aulasDoMod || [];
              } catch (err) {
                console.error(
                  `Erro ao carregar aulas do módulo ${modulo.id}:`,
                  err
                );
                mapaAulas[modulo.id] = [];
              }
            })
          );
          setAulasPorModulo(mapaAulas);
        }
      } catch (error) {
        console.error("Erro ao carregar dados da página do curso:", error);
        setErro("Não foi possível carregar as informações do curso.");
      } finally {
        setLoading(false);
      }
    }

    carregarDadosPagina();
  }, [cursoId, navigate]);

  useEffect(() => {
    localStorage.setItem(
      `@PortuguessComAnas:curso_${cursoId}_assistidas`,
      JSON.stringify(aulasAssistidas)
    );
  }, [aulasAssistidas, cursoId]);

  const toggleModulo = (id) => {
    setModuloAtivo(moduloAtivo === id ? null : id);
  };

  const toggleAssistida = (e, aulaId) => {
    e.stopPropagation();
    setAulasAssistidas((prev) =>
      prev.includes(aulaId)
        ? prev.filter((id) => id !== aulaId)
        : [...prev, aulaId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center p-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 animate-pulse uppercase tracking-wider text-center">
          Carregando informações do curso...
        </h1>
      </div>
    );
  }

  if (erro || !cursoData) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex flex-col items-center justify-center p-4 gap-4">
        <div className="rounded-2xl border-[3px] border-black bg-[#FF6B6B] p-5 sm:p-6 text-center font-bold text-black shadow-[6px_6px_0px_#000] max-w-sm w-full text-sm sm:text-base">
          {erro || "Curso não encontrado."}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="bg-white text-black text-xs font-black px-4 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4EFE6] font-sans flex flex-col">
      <Navbar usuario={usuario} />

      <main className="flex-1 flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 md:p-8 bg-gradient-to-tr from-[#00D2DF] via-[#7B5CFA] to-[#FF42DE] border-b-2 border-black">
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="bg-white text-black text-xs font-black px-3.5 sm:px-4 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer flex items-center gap-2"
          >
            ← VOLTAR AO PAINEL
          </button>
        </div>

        <div className="max-w-4xl w-full mx-auto flex flex-col gap-4 sm:gap-6">
          <Card className="bg-[#F4EFE6] !p-4 sm:!p-6 md:!p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl sm:rounded-2xl flex flex-col gap-4 sm:gap-6">
            {(Number(cursoId) === 8 || Number(cursoId) === 9) && (
              <div className="bg-red-100 border-2 border-black p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-wider text-red-700 bg-red-200 px-2 py-0.5 rounded border border-red-400 w-fit mb-1">
                      🔴 AO VIVO
                    </span>
                    <span className="text-xs font-bold text-slate-800 break-all">
                      Aulas ao vivo na Quarta 19h:30min e Sábado 15h
                    </span>
                  </div>
                </div>

                <a
                  href={LINK_MEET_FIXO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-400 text-black text-center text-xs font-black px-4 py-2.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-300 transition shrink-0"
                >
                  Entrar na Aula Ao Vivo
                </a>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-[10px] sm:text-xs font-black uppercase text-[#7B5CFA] bg-[#7B5CFA]/10 px-2.5 py-1 rounded-md border border-[#7B5CFA]/30 w-fit">
                Grade Curricular
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 uppercase break-words">
                {cursoData.tituloCurso || cursoData.titulo || cursoData.nome}
              </h1>
              <p className="text-slate-700 font-bold text-xs sm:text-sm md:text-base leading-relaxed">
                {cursoData.descricaoCurso || cursoData.descricao}
              </p>
            </div>
            {/* LISTA DE MÓDULOS */}
            <div className="flex flex-col gap-3 sm:gap-4 mt-1">
              <h2 className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-wider">
                Módulos do Curso ({modulos.length})
              </h2>

              <div className="flex flex-col gap-3">
                {modulos && modulos.length > 0 ? (
                  modulos.map((modulo, index) => {
                    const isOpen = moduloAtivo === modulo.id;
                    const aulasDoModulo = aulasPorModulo[modulo.id] || [];

                    return (
                      <div
                        key={modulo.id}
                        className="bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition"
                      >
                        <div
                          onClick={() => toggleModulo(modulo.id)}
                          className="p-3.5 sm:p-4 bg-white hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer select-none"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <span className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 rounded-lg border-2 border-black font-black text-xs bg-[#7B5CFA] text-white">
                              {modulo.ordem || index + 1}
                            </span>
                            <div className="flex flex-col">
                              <h3 className="font-black text-xs sm:text-sm md:text-base text-slate-900 uppercase leading-snug">
                                {modulo.titulo}
                              </h3>
                              <p className="text-[11px] sm:text-xs font-bold text-slate-500 line-clamp-1">
                                {modulo.descricao ||
                                  "Módulo estruturado do curso"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center self-end sm:self-auto gap-2">
                            <span className="text-[10px] sm:text-xs font-black bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-black">
                              {isOpen ? "▲ Ocultar Aulas" : "▼ Ver Aulas"}
                            </span>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="bg-slate-50 p-3 sm:p-4 border-t-2 border-black flex flex-col gap-3">
                            <div className="flex flex-col gap-2 mt-1">
                              <h4 className="text-xs font-black uppercase text-slate-800">
                                🎥 Aulas e Gravações do Módulo (
                                {aulasDoModulo.length})
                              </h4>

                              {aulasDoModulo.length > 0 ? (
                                <div className="space-y-2">
                                  {aulasDoModulo.map((aula) => {
                                    const assistida = aulasAssistidas.includes(
                                      aula.id
                                    );
                                    return (
                                      <div
                                        key={aula.id}
                                        onClick={() =>
                                          setVideoSelecionado(aula)
                                        }
                                        className={`bg-white hover:bg-slate-100 border-2 border-black p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition ${
                                          assistida ? "bg-emerald-50/60" : ""
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <span
                                            className={`border border-black p-2 rounded-lg text-xs font-black ${
                                              assistida
                                                ? "bg-emerald-400 text-black"
                                                : "bg-[#00D2DF]"
                                            }`}
                                          >
                                            {assistida ? "✓" : "▶"}
                                          </span>
                                          <div className="flex flex-col">
                                            <span
                                              className={`font-black text-xs sm:text-sm text-slate-900 ${
                                                assistida
                                                  ? "line-through opacity-75"
                                                  : ""
                                              }`}
                                            >
                                              {aula.titulo}
                                            </span>
                                            {aula.gravacaoTitulo && (
                                              <span className="text-[10px] text-slate-500 font-bold">
                                                Gravação: {aula.gravacaoTitulo}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={(e) =>
                                              toggleAssistida(e, aula.id)
                                            }
                                            className={`text-[10px] sm:text-xs font-black px-2.5 py-1.5 rounded-lg border-2 border-black transition cursor-pointer ${
                                              assistida
                                                ? "bg-emerald-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                : "bg-white text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                            }`}
                                          >
                                            {assistida
                                              ? "✓ Assistida"
                                              : "Marcar como Assistida"}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-xs font-bold text-slate-500 bg-white p-3 rounded-lg border-2 border-black text-center">
                                  Nenhuma aula cadastrada neste módulo ainda.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs sm:text-sm font-bold text-slate-600 text-center py-6 bg-white rounded-xl border-2 border-black">
                    Nenhum módulo cadastrado para este curso.
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Modal de Vídeo */}
      {videoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-5 max-w-2xl w-full shadow-[8px_8px_0_black]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-base uppercase truncate">
                {videoSelecionado.titulo}
              </h3>
              <button
                onClick={() => setVideoSelecionado(null)}
                className="bg-red-400 text-white border-2 border-black px-3 py-1 font-black rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {videoSelecionado.embedUrl ? (
              <div className="aspect-video w-full border-2 border-black rounded-xl overflow-hidden bg-black mb-4">
                <iframe
                  src={videoSelecionado.embedUrl}
                  title={videoSelecionado.titulo}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="p-6 bg-white border-2 border-black rounded-xl text-center font-bold text-xs mb-4">
                Esta aula não possui vídeo vinculado. Conteúdo textual:
                <p className="mt-2 text-slate-700 font-normal">
                  {videoSelecionado.conteudo}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={(e) => toggleAssistida(e, videoSelecionado.id)}
                className={`flex-1 border-2 border-black rounded-xl py-2.5 text-xs font-black shadow-[3px_3px_0_black] cursor-pointer transition ${
                  aulasAssistidas.includes(videoSelecionado.id)
                    ? "bg-emerald-400 text-black"
                    : "bg-white text-black hover:bg-slate-50"
                }`}
              >
                {aulasAssistidas.includes(videoSelecionado.id)
                  ? "✓ Aula Concluída (Desmarcar)"
                  : "✓ Marcar como Assistida"}
              </button>
              <button
                onClick={() => setVideoSelecionado(null)}
                className="bg-black text-white border-2 border-black rounded-xl py-2.5 px-6 text-xs font-black shadow-[3px_3px_0_black] cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-[#F4EFE6] py-4 text-center text-[11px] sm:text-xs font-bold text-slate-700 border-t-2 border-black">
        Português com Anas © 2026 - Todos os direitos reservados
      </footer>
    </div>
  );
}
