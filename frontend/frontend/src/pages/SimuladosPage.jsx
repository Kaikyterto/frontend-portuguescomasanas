import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { links } from "../ultils/links";
import Card from "../components/Card";
import AlertModal from "../components/AlertModal";
import { simuladoService } from "../service/simulado";
import { buscarDadosUsuarioLogado } from "../service/user";
import ReactMarkdown from "react-markdown";

export default function SimuladosPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("@PortuguessComAnas:token");

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de listagem de simulados
  const [simulados, setSimulados] = useState([]);
  const [loadingSimulados, setLoadingSimulados] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  // Estados da tentativa ativa (resolução de simulado)
  const [tentativaAtual, setTentativaAtual] = useState(null);
  const [indiceQuestao, setIndiceQuestao] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(null);
  const [historicoTentativas, setHistoricoTentativas] = useState([]);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [simuladoSelecionadoHistorico, setSimuladoSelecionadoHistorico] =
    useState(null);

  // Estado para guardar a alternativa selecionada em cada questão antes de enviar
  const [alternativasSelecionadas, setAlternativasSelecionadas] = useState({});
  const [salvandoResposta, setSalvandoResposta] = useState(false);

  // Modal de Alerta
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "success",
    message: "",
  });

  const showAlert = (message, type = "success") => {
    setModalConfig({ isOpen: true, type, message });
  };

  const setAlternativaSelecionadaParaQuestao = (questaoId, alternativaId) => {
    setAlternativasSelecionadas((prev) => ({
      ...prev,
      [questaoId]: alternativaId,
    }));
  };

  // Carregar dados iniciais
  useEffect(() => {
    async function init() {
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        setLoading(true);
        const [dadosUsuario, dadosSimulados] = await Promise.all([
          buscarDadosUsuarioLogado(token),
          simuladoService.listar(token, 0, 10),
        ]);
        setUsuario(dadosUsuario);
        setSimulados(dadosSimulados?.content || dadosSimulados || []);
        if (dadosSimulados?.totalPages)
          setTotalPages(dadosSimulados.totalPages);
      } catch (error) {
        console.error("Erro ao carregar simulados:", error);
        showAlert("Erro ao carregar simulados disponíveis.", "error");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [token, navigate]);

  // Timer regressivo para a tentativa em andamento
  useEffect(() => {
    if (
      !tentativaAtual ||
      tentativaAtual.status !== "EM_ANDAMENTO" ||
      !tentativaAtual.prazoEm
    ) {
      return;
    }

    const calcularTempo = () => {
      const agora = new Date().getTime();
      const prazo = new Date(tentativaAtual.prazoEm).getTime();
      const diff = Math.floor((prazo - agora) / 1000);

      if (diff <= 0) {
        setTempoRestante(0);
        handleFinalizar(tentativaAtual.id, true);
      } else {
        setTempoRestante(diff);
      }
    };

    calcularTempo();
    const interval = setInterval(calcularTempo, 1000);
    return () => clearInterval(interval);
  }, [tentativaAtual]);

  const formatarTempo = (segundos) => {
    if (segundos === null || segundos === undefined) return "--:--:--";
    const hrs = Math.floor(segundos / 3600);
    const mins = Math.floor((segundos % 3600) / 60);
    const secs = segundos % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  // Iniciar ou continuar tentativa
  const handleIniciarSimulado = async (simuladoId) => {
    try {
      setLoadingSimulados(true);
      const tentativa = await simuladoService.iniciarTentativa(
        simuladoId,
        token
      );
      setTentativaAtual(tentativa);
      setIndiceQuestao(0);

      const mapaRespostasIniciais = {};
      tentativa.respostas?.forEach((resp) => {
        mapaRespostasIniciais[resp.simuladoQuestaoId] =
          resp.simuladoAlternativaId;
      });
      setAlternativasSelecionadas(mapaRespostasIniciais);
    } catch (error) {
      if (error.status === 403) {
        showAlert(
          "Acesso negado: verifique se sua matrícula está ativa ou se seu usuário possui perfil de aluno.",
          "error"
        );
      } else {
        showAlert(
          error.message || "Erro ao iniciar tentativa de simulado.",
          "error"
        );
      }
    } finally {
      setLoadingSimulados(false);
    }
  };

  // Finalizar tentativa manualmente ou por expiração
  const handleFinalizar = async (tentativaId, porExpiracao = false) => {
    try {
      const tentativaFinalizada = await simuladoService.finalizarTentativa(
        tentativaId,
        token
      );
      setTentativaAtual(tentativaFinalizada);
      if (porExpiracao) {
        showAlert(
          "O prazo do simulado se encerrou. Sua tentativa foi finalizada automaticamente.",
          "error"
        );
      } else {
        showAlert(
          "Simulado finalizado com sucesso! Confira seu resultado.",
          "success"
        );
      }
    } catch (error) {
      console.error("Erro ao finalizar:", error);
    }
  };

  // Responder questão e avançar ou finalizar automaticamente se for a última
  const handleResponder = async (questaoId, alternativaId) => {
    if (!tentativaAtual || tentativaAtual.status !== "EM_ANDAMENTO") return;
    setSalvandoResposta(true);
    try {
      const tentativaAtualizada = await simuladoService.responderQuestao(
        tentativaAtual.id,
        questaoId,
        alternativaId,
        token
      );
      setTentativaAtual(tentativaAtualizada);

      const ehUltimaQuestao =
        indiceQuestao + 1 >= tentativaAtual.questoes.length;

      if (ehUltimaQuestao) {
        // Se for a última questão, finaliza a tentativa automaticamente
        await handleFinalizar(tentativaAtual.id, false);
      } else {
        // Caso contrário, apenas avança para a próxima questão
        setIndiceQuestao((prev) => prev + 1);
      }
    } catch (error) {
      showAlert(error.message || "Erro ao salvar resposta.", "error");
    } finally {
      setSalvandoResposta(false);
    }
  };

  // Ver histórico de um simulado
  const handleVerHistorico = async (simulado) => {
    try {
      setSimuladoSelecionadoHistorico(simulado);
      const hist = await simuladoService.listarHistorico(
        simulado.id,
        null,
        token,
        0
      );
      setHistoricoTentativas(hist?.content || hist || []);
      setShowHistoricoModal(true);
    } catch (error) {
      showAlert("Erro ao carregar histórico de tentativas.", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center">
        <h1 className="text-2xl font-black uppercase tracking-wider animate-pulse">
          Carregando simulados...
        </h1>
      </div>
    );
  }

  const ehUltimaQuestaoAtual =
    tentativaAtual?.questoes &&
    indiceQuestao + 1 >= tentativaAtual.questoes.length;

  return (
    <div className="min-h-screen bg-[#F4EFE6] font-sans flex flex-col">
      <Navbar links={links} usuario={usuario} />

      <main className="flex-1 p-4 md:p-8 bg-gradient-to-tr from-[#00D2DF] via-[#7B5CFA] to-[#FF42DE] flex flex-col gap-6">
        {tentativaAtual ? (
          <div className="flex-1 flex flex-col gap-4 max-w-4xl mx-auto w-full">
            {/* Barra superior do simulado */}
            <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0_black] flex flex-wrap justify-between items-center gap-4">
              <div>
                <span className="text-xs font-black uppercase bg-[#7B5CFA] text-white px-2 py-1 rounded border border-black">
                  Tentativa #{tentativaAtual.numero} — Status:{" "}
                  {tentativaAtual.status}
                </span>
                <h2 className="text-lg font-black mt-2">
                  Resolução de Simulado
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white border-2 border-black px-4 py-2 rounded-xl font-black text-sm shadow-[2px_2px_0_black]">
                  ⏱️ Tempo Restante:{" "}
                  <span className="text-red-600">
                    {formatarTempo(tempoRestante)}
                  </span>
                </div>
                {tentativaAtual.status === "EM_ANDAMENTO" && (
                  <button
                    onClick={() => handleFinalizar(tentativaAtual.id)}
                    className="bg-red-400 text-white border-2 border-black px-4 py-2 font-black rounded-xl text-xs shadow-[2px_2px_0_black] hover:translate-x-0.5 hover:translate-y-0.5 transition"
                  >
                    FINALIZAR SIMULADO
                  </button>
                )}
              </div>
            </div>

            {/* Bloco da Questão Atual */}
            {tentativaAtual.questoes && tentativaAtual.questoes.length > 0 && (
              <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[6px_6px_0_black] flex flex-col gap-4">
                <div className="flex justify-between items-center border-b-2 border-black pb-3">
                  <span className="font-black text-sm bg-[#00D2DF] px-3 py-1 rounded-lg border border-black">
                    Questão {indiceQuestao + 1} de{" "}
                    {tentativaAtual.questoes.length}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    Nível: {tentativaAtual.questoes[indiceQuestao].nivel} | Ano:{" "}
                    {tentativaAtual.questoes[indiceQuestao].ano}
                  </span>
                </div>

                <div className="text-slate-900 font-bold text-sm md:text-base leading-relaxed">
                  <ReactMarkdown>
                    {tentativaAtual.questoes[indiceQuestao].enunciado}
                  </ReactMarkdown>
                </div>

                {/* Alternativas */}
                <div className="flex flex-col gap-3 mt-2">
                  {tentativaAtual.questoes[indiceQuestao].alternativas.map(
                    (alt) => {
                      const respostaSalva = tentativaAtual.respostas?.find(
                        (r) =>
                          r.simuladoQuestaoId ===
                          tentativaAtual.questoes[indiceQuestao].id
                      );
                      const questaoIdAtual =
                        tentativaAtual.questoes[indiceQuestao].id;
                      const selecionada =
                        respostaSalva?.simuladoAlternativaId === alt.id ||
                        alternativasSelecionadas[questaoIdAtual] === alt.id;
                      const concluida =
                        tentativaAtual.status !== "EM_ANDAMENTO";

                      let estiloCor = "bg-white hover:bg-slate-50";
                      if (concluida) {
                        if (alt.correta)
                          estiloCor =
                            "bg-emerald-100 border-emerald-600 text-emerald-900";
                        else if (selecionada && !alt.correta)
                          estiloCor = "bg-red-100 border-red-600 text-red-900";
                      } else if (selecionada) {
                        estiloCor = "bg-cyan-50 border-cyan-500 font-black";
                      }

                      return (
                        <div
                          key={alt.id}
                          onClick={() => {
                            if (!concluida) {
                              setAlternativaSelecionadaParaQuestao(
                                questaoIdAtual,
                                alt.id
                              );
                            }
                          }}
                          className={`p-3 rounded-xl border-2 border-black flex items-start gap-3 cursor-pointer transition ${estiloCor}`}
                        >
                          <span className="font-black">({alt.letra})</span>
                          <div className="text-xs md:text-sm font-bold flex-1">
                            <ReactMarkdown components={{ p: "span" }}>
                              {alt.texto}
                            </ReactMarkdown>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Botão de Responder / Enviar Alternativa */}
                {tentativaAtual.status === "EM_ANDAMENTO" && (
                  <button
                    disabled={salvandoResposta}
                    onClick={() => {
                      const questaoAtualId =
                        tentativaAtual.questoes[indiceQuestao].id;
                      const altEscolhida =
                        alternativasSelecionadas[questaoAtualId];
                      if (!altEscolhida) {
                        showAlert(
                          "Selecione uma alternativa antes de responder!",
                          "error"
                        );
                        return;
                      }
                      handleResponder(questaoAtualId, altEscolhida);
                    }}
                    className="mt-4 bg-[#7B5CFA] text-white border-2 border-black rounded-xl py-3 font-black shadow-[3px_3px_0_black] hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {salvandoResposta
                      ? "SALVANDO..."
                      : ehUltimaQuestaoAtual
                      ? "RESPONDER E FINALIZAR SIMULADO ➔"
                      : "RESPONDER E PRÓXIMA QUESTÃO ➔"}
                  </button>
                )}

                {/* Explicação (se concluído) */}
                {tentativaAtual.status !== "EM_ANDAMENTO" &&
                  tentativaAtual.questoes[indiceQuestao].explicacao && (
                    <div className="bg-slate-100 border-2 border-black p-4 rounded-xl mt-4">
                      <span className="block text-xs font-black uppercase text-slate-700 mb-1">
                        Explicação:
                      </span>
                      <div className="text-xs font-bold text-slate-800">
                        <ReactMarkdown>
                          {tentativaAtual.questoes[indiceQuestao].explicacao}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                {/* Navegação entre questões */}
                <div className="flex justify-between items-center pt-4 border-t-2 border-black mt-4">
                  <button
                    disabled={indiceQuestao === 0}
                    onClick={() =>
                      setIndiceQuestao((prev) => Math.max(0, prev - 1))
                    }
                    className="bg-slate-200 border-2 border-black px-4 py-2 font-black text-xs rounded-xl shadow-[2px_2px_0_black] disabled:opacity-40"
                  >
                    ← Questão Anterior
                  </button>

                  {tentativaAtual.status !== "EM_ANDAMENTO" ? (
                    <span className="font-black text-xs">
                      Acertos: {tentativaAtual.acertos ?? 0} /{" "}
                      {tentativaAtual.totalQuestoes}
                    </span>
                  ) : (
                    <span className="font-black text-xs text-slate-500">
                      Simulado em andamento
                    </span>
                  )}

                  <button
                    disabled={
                      indiceQuestao + 1 >= tentativaAtual.questoes.length
                    }
                    onClick={() =>
                      setIndiceQuestao((prev) =>
                        Math.min(tentativaAtual.questoes.length - 1, prev + 1)
                      )
                    }
                    className="bg-[#00D2DF] border-2 border-black px-4 py-2 font-black text-xs rounded-xl shadow-[2px_2px_0_black] disabled:opacity-40"
                  >
                    Próxima Questão →
                  </button>
                </div>

                {tentativaAtual.status !== "EM_ANDAMENTO" && (
                  <button
                    onClick={() => setTentativaAtual(null)}
                    className="w-full bg-[#7B5CFA] text-white border-2 border-black rounded-xl py-3 font-black shadow-[3px_3px_0_black] mt-2"
                  >
                    VOLTAR PARA A LISTA DE SIMULADOS
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Listagem de Simulados para o Aluno */
          <Card className="bg-[#F4EFE6] border-2 border-black rounded-2xl shadow-[6px_6px_0_black] p-6 max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-black uppercase">
                  Simulados Disponíveis
                </h1>
                <p className="text-sm font-bold text-slate-600">
                  Resolva simulados com tempo cronometrado e acompanhe seu
                  histórico
                </p>
              </div>
              <button
                onClick={() => navigate("/user")}
                className="bg-slate-200 border-2 border-black px-4 py-2 font-black text-xs rounded-xl shadow-[2px_2px_0_black]"
              >
                Voltar ao Painel Principal
              </button>
            </div>

            <div className="space-y-4">
              {simulados.length === 0 ? (
                <p className="font-bold text-slate-500 py-6 text-center">
                  Nenhum simulado disponível no momento.
                </p>
              ) : (
                simulados.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white border-2 border-black rounded-xl p-5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="bg-[#00D2DF] border-2 border-black px-2 py-0.5 text-xs font-black rounded-lg">
                          ⏱️ {s.duracaoMinutos} min
                        </span>
                        <span className="bg-[#FFD700] border-2 border-black px-2 py-0.5 text-xs font-black rounded-lg">
                          📝 {s.totalQuestoes} Questões
                        </span>
                      </div>
                      <h3 className="font-black text-lg mt-1">{s.titulo}</h3>
                      <p className="text-xs font-bold text-slate-600">
                        {s.descricao}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        onClick={() => handleVerHistorico(s)}
                        className="bg-slate-100 border-2 border-black px-3 py-2 text-xs font-black rounded-xl shadow-[2px_2px_0_black]"
                      >
                        Meu Histórico
                      </button>
                      <button
                        onClick={() => handleIniciarSimulado(s.id)}
                        disabled={loadingSimulados}
                        className="bg-[#7B5CFA] text-white border-2 border-black px-4 py-2 text-xs font-black rounded-xl shadow-[2px_2px_0_black] hover:translate-x-0.5 hover:translate-y-0.5 transition disabled:opacity-50"
                      >
                        {loadingSimulados
                          ? "Carregando..."
                          : "Iniciar / Continuar"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </main>

      {/* Modal de Histórico */}
      {showHistoricoModal && simuladoSelecionadoHistorico && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-6 max-w-lg w-full shadow-[8px_8px_0_black]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black uppercase">
                Histórico: {simuladoSelecionadoHistorico.titulo}
              </h3>
              <button
                onClick={() => setShowHistoricoModal(false)}
                className="bg-red-400 text-white border-2 border-black px-3 py-1 font-black rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {historicoTentativas.length === 0 ? (
                <p className="text-xs font-bold text-slate-500 text-center py-4">
                  Você ainda não realizou tentativas neste simulado.
                </p>
              ) : (
                historicoTentativas.map((h) => (
                  <div
                    key={h.id}
                    className="bg-white border-2 border-black rounded-xl p-3 flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-black mr-2">
                        Tentativa #{h.numero}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-black border border-black ${
                          h.status === "FINALIZADO"
                            ? "bg-emerald-200"
                            : h.status === "EXPIRADO"
                            ? "bg-amber-200"
                            : "bg-cyan-200"
                        }`}
                      >
                        {h.status}
                      </span>
                    </div>
                    <div className="font-black">
                      Acertos: {h.acertos ?? 0} /{" "}
                      {h.totalQuestoes ||
                        simuladoSelecionadoHistorico.totalQuestoes}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        message={modalConfig.message}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
