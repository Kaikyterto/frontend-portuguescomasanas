import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Card from "../components/Card";
import { buscarDadosUsuarioLogado } from "../service/user";
import { cursoService } from "../service/curso";
import { moduloService } from "../service/module";
import { aulaService } from "../service/aula";
import { pdfService } from "../service/pdf";

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

  // ESTADOS PARA MATERIAIS PDF (APENAS LEITURA)
  const [materiaisPdf, setMateriaisPdf] = useState([]);
  const [pdfVisualizando, setPdfVisualizando] = useState(null);
  const [carregandoPdf, setCarregandoPdf] = useState(false);

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

  const carregarMateriaisPdf = async (token) => {
    try {
      const data = await pdfService.listarMateriaisCurso(cursoId, 0, 100, token);
      setMateriaisPdf(data?.content || []);
    } catch (err) {
      console.error("Erro ao carregar materiais PDF do curso:", err);
    }
  };

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

        // Carrega apenas a lista de materiais em PDF disponíveis
        await carregarMateriaisPdf(token);

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

  // ==========================================
  // HANDLERS PARA VISUALIZAÇÃO E DOWNLOAD DE PDF
  // ==========================================

  const handleVisualizarPdf = async (material) => {
    const token = localStorage.getItem("@PortuguessComAnas:token");
    try {
      setCarregandoPdf(true);
      const blobUrl = await pdfService.obterConteudoUrl(
        material.conteudoUrl,
        token,
        false
      );
      setPdfVisualizando({
        titulo: material.titulo,
        nomeArquivo: material.nomeArquivo,
        blobUrl,
      });
    } catch (err) {
      alert("Erro ao abrir PDF: " + err.message);
    } finally {
      setCarregandoPdf(false);
    }
  };

  const handleBaixarPdf = async (material) => {
    const token = localStorage.getItem("@PortuguessComAnas:token");
    try {
      const blobUrl = await pdfService.obterConteudoUrl(
        material.conteudoUrl,
        token,
        true
      );
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = material.nomeArquivo || "material.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      alert("Erro ao baixar PDF: " + err.message);
    }
  };

  const fecharModalPdf = () => {
    if (pdfVisualizando?.blobUrl) {
      URL.revokeObjectURL(pdfVisualizando.blobUrl);
    }
    setPdfVisualizando(null);
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
                      {Number(cursoId) === 8
                        ? "Aulas ao vivo na Quarta 20:40min e Sábado 16:40min"
                        : "Aulas ao vivo na Quarta 19h:30min e Sábado 15h"}
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
            
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 uppercase break-words">
                {cursoData.tituloCurso || cursoData.titulo || cursoData.nome}
              </h1>
              <p className="text-slate-700 font-bold text-xs sm:text-sm md:text-base leading-relaxed">
                {cursoData.descricaoCurso || cursoData.descricao}
              </p>
            </div>

            {/* MATERIAIS COMPLEMENTARES GERAIS DO CURSO (Sem vínculo a módulo/aula) */}
            {materiaisPdf.filter((m) => !m.moduloId).length > 0 && (
              <div className="flex flex-col gap-3 p-4 bg-amber-50 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                  📄 MATERIAIS COMPLEMENTARES DO CURSO
                </h3>
                <div className="flex flex-col gap-2">
                  {materiaisPdf
                    .filter((m) => !m.moduloId)
                    .map((material) => (
                      <div
                        key={material.id}
                        className="bg-white border-2 border-black p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-lg">📕</span>
                          <div className="flex flex-col">
                            <span className="font-black text-xs sm:text-sm text-slate-900">
                              {material.titulo}
                            </span>
                            {material.descricao && (
                              <p className="text-[11px] font-bold text-slate-600">
                                {material.descricao}
                              </p>
                            )}
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {material.nomeArquivo} (
                              {Math.round(material.tamanhoBytes / 1024)} KB)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => handleVisualizarPdf(material)}
                            disabled={carregandoPdf}
                            className="bg-[#00D2DF] text-black text-[11px] font-black px-3 py-1.5 rounded-md border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-cyan-300 transition cursor-pointer"
                          >
                            👁️ Visualizar
                          </button>
                          <button
                            onClick={() => handleBaixarPdf(material)}
                            className="bg-emerald-400 text-black text-[11px] font-black px-3 py-1.5 rounded-md border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-300 transition cursor-pointer"
                          >
                            📥 Baixar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

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
                    const pdfsDoModulo = materiaisPdf.filter(
                      (m) => m.moduloId === modulo.id
                    );

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
                          <div className="bg-slate-50 p-3 sm:p-4 border-t-2 border-black flex flex-col gap-4">
                            {/* AULAS DO MÓDULO */}
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
                                    const pdfsDaAula = pdfsDoModulo.filter(
                                      (m) => m.aulaId === aula.id
                                    );

                                    return (
                                      <div
                                        key={aula.id}
                                        className={`bg-white border-2 border-black p-3 rounded-xl flex flex-col gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                                          assistida ? "bg-emerald-50/60" : ""
                                        }`}
                                      >
                                        <div
                                          onClick={() =>
                                            setVideoSelecionado(aula)
                                          }
                                          className="flex items-center justify-between gap-3 cursor-pointer"
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
                                                  Gravação:{" "}
                                                  {aula.gravacaoTitulo}
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

                                        {/* PDFs VINCULADOS A ESTA AULA ESPECÍFICA */}
                                        {pdfsDaAula.length > 0 && (
                                          <div className="mt-2 pt-2 border-t border-dashed border-slate-300 flex flex-col gap-1.5">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">
                                              📄 Materiais PDF desta aula:
                                            </span>
                                            {pdfsDaAula.map((pdf) => (
                                              <div
                                                key={pdf.id}
                                                className="bg-amber-50 p-2 rounded border border-black flex items-center justify-between text-xs"
                                              >
                                                <span className="font-bold text-slate-800 truncate">
                                                  {pdf.titulo}
                                                </span>
                                                <div className="flex gap-1 shrink-0">
                                                  <button
                                                    onClick={() =>
                                                      handleVisualizarPdf(pdf)
                                                    }
                                                    className="bg-white text-[10px] font-black px-2 py-1 rounded border border-black cursor-pointer"
                                                  >
                                                    Ver
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      handleBaixarPdf(pdf)
                                                    }
                                                    className="bg-emerald-300 text-[10px] font-black px-2 py-1 rounded border border-black cursor-pointer"
                                                  >
                                                    Baixar
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
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

                            {/* PDFs DO MÓDULO (Sem vínculo direto com aula específica) */}
                            {pdfsDoModulo.filter((m) => !m.aulaId).length > 0 && (
                              <div className="flex flex-col gap-2 pt-2 border-t-2 border-black/10">
                                <h4 className="text-xs font-black uppercase text-slate-800">
                                  📚 Materiais PDF do Módulo (
                                  {pdfsDoModulo.filter((m) => !m.aulaId).length})
                                </h4>
                                <div className="space-y-2">
                                  {pdfsDoModulo
                                    .filter((m) => !m.aulaId)
                                    .map((material) => (
                                      <div
                                        key={material.id}
                                        className="bg-white border-2 border-black p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-base">📄</span>
                                          <div className="flex flex-col">
                                            <span className="font-black text-xs text-slate-900">
                                              {material.titulo}
                                            </span>
                                            {material.descricao && (
                                              <span className="text-[10px] text-slate-500 font-bold">
                                                {material.descricao}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={() =>
                                              handleVisualizarPdf(material)
                                            }
                                            className="bg-[#00D2DF] text-black text-[10px] font-black px-2.5 py-1 rounded border border-black cursor-pointer"
                                          >
                                            Ver
                                          </button>
                                          <button
                                            onClick={() => handleBaixarPdf(material)}
                                            className="bg-emerald-400 text-black text-[10px] font-black px-2.5 py-1 rounded border border-black cursor-pointer"
                                          >
                                            Baixar
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
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

      {/* MODAL DE PRÉ-VISUALIZAÇÃO DE PDF */}
      {pdfVisualizando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-4 sm:p-5 max-w-4xl w-full h-[90vh] flex flex-col shadow-[8px_8px_0_black]">
            <div className="flex justify-between items-center mb-3">
              <div className="flex flex-col">
                <h3 className="font-black text-sm sm:text-base uppercase truncate text-slate-900">
                  📄 {pdfVisualizando.titulo}
                </h3>
                <span className="text-[10px] text-slate-600 font-bold">
                  {pdfVisualizando.nomeArquivo}
                </span>
              </div>
              <button
                onClick={fecharModalPdf}
                className="bg-red-400 text-white border-2 border-black px-3 py-1 font-black rounded-lg cursor-pointer hover:bg-red-500 transition"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="flex-1 bg-slate-900 rounded-xl border-2 border-black overflow-hidden relative">
              <iframe
                src={pdfVisualizando.blobUrl}
                title={pdfVisualizando.titulo}
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vídeo Existente */}
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