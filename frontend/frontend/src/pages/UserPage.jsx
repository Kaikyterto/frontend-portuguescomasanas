import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { buscarDadosUsuarioLogado, listarMeusCursos } from "../service/user";
import { criarResposta, listarMinhasRespostas } from "../service/answer";
import { cursoService } from "../service/curso";
import Navbar from "../components/Navbar";
import SidebarStats from "../components/SidebarStats";
import ModuleProgress from "../components/ModuleProgress";
import EvolutionChart from "../components/EvolutionChart";
import DailyQuestions from "../components/DailyQuestions";
import Card from "../components/Card";
import AlertModal from "../components/AlertModal";
import { listar } from "../service/questao";

export default function UserPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erroAuth, setErroAuth] = useState("");

  // Estados para lidar com o Banco de Questões
  const [questoes, setQuestoes] = useState([]);
  const [carregandoQuestoes, setCarregandoQuestoes] = useState(false);
  const [erroQuestoes, setErroQuestoes] = useState("");
  const [exibirBanco, setExibirBanco] = useState(false);

  // Estados para responder a questão selecionada e medir o tempo
  const [questaoSelecionada, setQuestaoSelecionada] = useState(null);
  const [indiceQuestaoAtual, setIndiceQuestaoAtual] = useState(0);
  const [alternativaSelecionada, setAlternativaSelecionada] = useState("");
  const [respostaEnviada, setRespostaEnviada] = useState(false);
  const [tempoInicio, setTempoInicio] = useState(null);

  // Referência para rolar até o botão/bloco de feedback
  const fimRespostaRef = useRef(null);

  // Estado para controlar o AlertModal
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "success",
    message: "",
  });

  // Estado dinâmico para as estatísticas do usuário
  const [userStats, setUserStats] = useState({
    total: 0,
    correct: 0,
    wrong: 0,
    evolutionPercentage: 0,
  });

  // Estado para armazenar os cursos vindos da API
  const [cursos, setCursos] = useState([]);

  // Função de Adquirir Curso com Integração Real ao Backend e Mercado Pago (Corrigida e Robusta)
  const handleAdquirirCurso = async (curso) => {
    const titulo = curso?.title || "o curso";

    setModalConfig({
      isOpen: true,
      type: "success",
      message: `Gerando link de pagamento seguro para "${titulo}"...`,
    });

    try {
      const token = localStorage.getItem("@PortuguessComAnas:token");

      // Chamada para o endpoint do backend que utiliza o MercadoPagoGateway
      const response = await fetch(
        `https://backend-portugues-anas-9ffe.onrender.com/api/payments/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cursoId: curso.id,
            description: titulo,
            amount: curso.precoNum,
          }),
        }
      );

      if (!response.ok)
        throw new Error("Erro ao criar preferência de pagamento.");

      const data = await response.json();
      console.log("Resposta do pagamento recebida:", data);

      // Tratamento robusto para capturar diferentes variações de propriedades do backend/SDK
      const checkoutUrl =
        data.initPoint ||
        data.sandboxInitPoint ||
        data.init_point ||
        data.sandbox_init_point ||
        data.checkoutUrl ||
        curso.checkoutUrl;

      setTimeout(() => {
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          setModalConfig({
            isOpen: true,
            type: "error",
            message: "Link de pagamento não retornado pelo servidor.",
          });
        }
      }, 1000);
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      setModalConfig({
        isOpen: true,
        type: "error",
        message: "Não foi possível iniciar o pagamento. Tente novamente.",
      });
    }
  };

  // Função otimizada para rolar até o botão de próxima questão
  useEffect(() => {
    if (respostaEnviada && fimRespostaRef.current) {
      setTimeout(() => {
        fimRespostaRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, [respostaEnviada]);

  // Função para buscar e calcular as estatísticas reais do usuário
  const carregarEstatisticasUsuario = async () => {
    try {
      const minhasRespostas = await listarMinhasRespostas();
      const total = minhasRespostas.length;
      const correct = minhasRespostas.filter((r) => r.acertou).length;
      const wrong = total - correct;
      const evolutionPercentage =
        total > 0 ? Math.round((correct / total) * 100) : 0;

      setUserStats({
        total,
        correct,
        wrong,
        evolutionPercentage,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas do usuário:", error);
    }
  };

  useEffect(() => {
    async function verificarAutenticacao() {
      const token = localStorage.getItem("@PortuguessComAnas:token");
      if (!token) {
        setErroAuth("Acesso negado. Redirecionando para a página de login...");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      try {
        setLoading(true);

        // Busca paralela dos dados do usuário, lista de cursos e cursos do próprio usuário logado
        const [dadosUsuario, dadosCursos, meusCursosRes] = await Promise.all([
          buscarDadosUsuarioLogado(token),
          cursoService.listar(token),
          listarMeusCursos(token).catch(() => []),
        ]);

        setUsuario(dadosUsuario);

        // Cria um conjunto com os IDs dos cursos que o usuário possui acesso/matrícula
        const idsCursosComAcesso = new Set(
          (meusCursosRes || []).map((m) => m.cursoId || m.curso?.id || m.id)
        );

        // Mapeia os cursos injetando a propriedade correta de acesso baseada no back-end
        const cursosComStatus = (dadosCursos || []).map((curso) => ({
          ...curso,
          temAcesso:
            idsCursosComAcesso.has(curso.id) ||
            curso.comprado === true ||
            curso.liberado === true,
        }));

        setCursos(cursosComStatus);
        await carregarEstatisticasUsuario();
      } catch (error) {
        console.error("Erro ao carregar dados da página:", error);
        localStorage.removeItem("@PortuguessComAnas:token");
        setErroAuth(
          "Sessão expirada ou erro ao carregar dados. Faça login novamente."
        );
        setTimeout(() => navigate("/login"), 2000);
      } finally {
        setLoading(false);
      }
    }

    verificarAutenticacao();
  }, [navigate]);

  const handleCarregarBancoQuestoes = async () => {
    try {
      setCarregandoQuestoes(true);
      setErroQuestoes("");
      const token = localStorage.getItem("@PortuguessComAnas:token");
      const dadosQuestao = await listar(token);
      setQuestoes(dadosQuestao);
      setExibirBanco(true);
      setQuestaoSelecionada(null);
      setIndiceQuestaoAtual(0);
      setAlternativaSelecionada("");
      setRespostaEnviada(false);
    } catch (error) {
      setErroQuestoes("Erro ao carregar as questões do banco.");
    } finally {
      setCarregandoQuestoes(false);
    }
  };

  const handleResponderQuestao = async (e) => {
    e.preventDefault();
    if (!alternativaSelecionada) {
      setModalConfig({
        isOpen: true,
        type: "error",
        message: "Selecione uma alternativa antes de responder!",
      });
      return;
    }

    const tempoFinal = Date.now();
    const tempoGastoSegundos = tempoInicio
      ? Math.floor((tempoFinal - tempoInicio) / 1000)
      : 0;

    const payload = {
      questaoId: Number(questaoSelecionada?.id),
      alternativaId: Number(alternativaSelecionada),
      tempoGasto: Number(tempoGastoSegundos),
    };

    try {
      await criarResposta(payload);
      setRespostaEnviada(true);
      await carregarEstatisticasUsuario();
    } catch (error) {
      setModalConfig({
        isOpen: true,
        type: "error",
        message: "Erro ao salvar sua resposta: " + (error.message || error),
      });
    }
  };

  const handleProximaQuestao = () => {
    const proximoIndice = indiceQuestaoAtual + 1;
    if (proximoIndice < questoes.length) {
      setIndiceQuestaoAtual(proximoIndice);
      setQuestaoSelecionada(questoes[proximoIndice]);
      setAlternativaSelecionada("");
      setRespostaEnviada(false);
      setTempoInicio(Date.now());
      const containerScroll = document.querySelector(".custom-scrollbar");
      if (containerScroll) containerScroll.scrollTop = 0;
    } else {
      setModalConfig({
        isOpen: true,
        type: "success",
        message: "Você concluiu todas as questões deste bloco!",
      });
      setQuestaoSelecionada(null);
      setAlternativaSelecionada("");
      setRespostaEnviada(false);
    }
  };

  const handleVoltarBanco = () => {
    setQuestaoSelecionada(null);
    setIndiceQuestaoAtual(0);
    setAlternativaSelecionada("");
    setRespostaEnviada(false);
    setExibirBanco(false);
  };

  if (loading && !erroAuth) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center">
        <h1 className="text-2xl font-black text-slate-900 animate-pulse uppercase tracking-wider">
          Carregando plataforma...
        </h1>
      </div>
    );
  }

  if (erroAuth) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center p-4">
        <div className="rounded-2xl border-[3px] border-black bg-[#FF6B6B] p-6 text-center font-bold text-black shadow-[6px_6px_0px_#000] max-w-sm w-full">
          {erroAuth}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4EFE6] font-sans flex flex-col">
      <Navbar usuario={usuario} />

      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 bg-gradient-to-tr from-[#00D2DF] via-[#7B5CFA] to-[#FF42DE] border-b-2 border-black lg:overflow-hidden">
        {/* CONTAINER 1 */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 order-1 lg:order-3">
          <div className="min-h-[200px] lg:flex-1 flex order-1 lg:order-1">
            <DailyQuestions className="w-full h-full" />
          </div>

          <div className="min-h-[220px] lg:flex-1 flex order-2 lg:order-2">
            <EvolutionChart
              percentage={userStats.evolutionPercentage}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* CONTAINER 2 */}
        <div className="flex-1 flex flex-col order-2 lg:order-2 w-full">
          <Card className="flex-1 flex flex-col bg-[#F4EFE6] h-full overflow-hidden !p-0 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl">
            <div className="px-5 py-4 border-b-2 border-black bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {questaoSelecionada ? "✍️" : exibirBanco ? "📂" : "📚"}
                </span>
                <h2 className="text-slate-900 text-base md:text-lg font-black tracking-wide uppercase">
                  {questaoSelecionada
                    ? `Responder Questão (${indiceQuestaoAtual + 1}/${
                        questoes.length
                      })`
                    : exibirBanco
                    ? "Banco de Questões"
                    : "Cursos disponíveis"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {questaoSelecionada ? (
                  <button
                    onClick={() => {
                      setQuestaoSelecionada(null);
                      setAlternativaSelecionada("");
                      setRespostaEnviada(false);
                    }}
                    className="bg-slate-200 text-black text-xs font-bold px-2.5 py-1 rounded-md border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-300 cursor-pointer"
                  >
                    Voltar à Lista
                  </button>
                ) : exibirBanco ? (
                  <button
                    onClick={handleVoltarBanco}
                    className="bg-slate-200 text-black text-xs font-bold px-2.5 py-1 rounded-md border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-300 cursor-pointer"
                  >
                    Voltar
                  </button>
                ) : null}
                <span className="bg-[#7B5CFA] text-white text-xs font-bold px-2.5 py-1 rounded-md border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  {questaoSelecionada
                    ? `Questão #${questaoSelecionada.id || "Detalhe"}`
                    : exibirBanco
                    ? `${questoes.length} Questões`
                    : `${cursos.length} Cursos`}
                </span>
              </div>
            </div>

            <div className="flex-1 relative p-5 overflow-hidden">
              <div
                className="h-full flex flex-col gap-3 max-h-[350px] sm:max-h-[400px] lg:max-h-[calc(100vh-270px)] overflow-y-auto pr-2 lg:pr-4 custom-scrollbar pb-8"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, black 85%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black 85%, transparent 100%)",
                }}
              >
                {questaoSelecionada ? (
                  <form
                    onSubmit={handleResponderQuestao}
                    className="flex flex-col gap-4 bg-white p-5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div>
                      <span className="text-xs font-black uppercase text-[#7B5CFA] bg-[#7B5CFA]/10 px-2 py-1 rounded border border-[#7B5CFA]/30">
                        {questaoSelecionada.tema || "Questão de Português"}
                      </span>
                      <p className="font-bold text-slate-900 text-base mt-3 leading-relaxed">
                        {questaoSelecionada.enunciado}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-xs font-black uppercase text-slate-700">
                        Alternativas:
                      </span>
                      {questaoSelecionada.alternativas &&
                      questaoSelecionada.alternativas.length > 0 ? (
                        questaoSelecionada.alternativas.map((alt) => {
                          const isCorreta = alt.correta;
                          const identificadorAlt = alt.id;
                          const letra = alt.letra || alt.id;
                          const textoAlt = alt.texto || alt.descricao;
                          const isSelecionada =
                            alternativaSelecionada === identificadorAlt;

                          let corFundo = "bg-white hover:bg-slate-50";
                          if (respostaEnviada) {
                            if (isCorreta) {
                              corFundo =
                                "bg-emerald-100 border-emerald-600 text-emerald-900";
                            } else if (isSelecionada && !isCorreta) {
                              corFundo =
                                "bg-red-100 border-red-600 text-red-900";
                            }
                          } else if (isSelecionada) {
                            corFundo = "bg-cyan-50 border-cyan-500";
                          }

                          return (
                            <label
                              key={identificadorAlt}
                              className={`flex items-start gap-3 p-3 rounded-xl border-2 border-black cursor-pointer transition ${corFundo}`}
                            >
                              <input
                                type="radio"
                                name="alternativa"
                                value={identificadorAlt}
                                checked={isSelecionada}
                                onChange={() => {
                                  if (respostaEnviada) return;
                                  const idNumerico = Number(alt.id);
                                  setAlternativaSelecionada(
                                    isNaN(idNumerico) ? alt.id : idNumerico
                                  );
                                }}
                                disabled={respostaEnviada}
                                className="mt-1"
                              />
                              <div className="font-bold text-sm text-slate-800">
                                <span className="font-black mr-2">
                                  ({letra})
                                </span>
                                {textoAlt}
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <div className="text-sm font-bold text-slate-500 italic p-2">
                          Nenhuma alternativa cadastrada para esta questão.
                        </div>
                      )}
                    </div>

                    {!respostaEnviada ? (
                      <button
                        type="submit"
                        className="mt-4 bg-[#7B5CFA] text-white border-2 border-black rounded-xl py-3 font-black shadow-[3px_3px_0_black] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
                      >
                        RESPONDER
                      </button>
                    ) : (
                      <div className="mt-4 flex flex-col gap-3">
                        <div
                          className={`p-3 rounded-xl border-2 border-black text-center font-black text-sm ${
                            alternativaSelecionada &&
                            questaoSelecionada.alternativas?.find(
                              (a) => a.id === alternativaSelecionada
                            )?.correta
                              ? "bg-emerald-300 text-emerald-950"
                              : "bg-red-300 text-red-950"
                          }`}
                        >
                          {alternativaSelecionada &&
                          questaoSelecionada.alternativas?.find(
                            (a) => a.id === alternativaSelecionada
                          )?.correta
                            ? "🎉 Resposta Correta!"
                            : "❌ Resposta Incorreta!"}
                        </div>
                        {questaoSelecionada.explicacao && (
                          <div className="bg-slate-100 p-4 rounded-xl border-2 border-black">
                            <span className="block text-xs font-black uppercase text-slate-700 mb-1">
                              Explicação:
                            </span>
                            <p className="text-sm font-bold text-slate-800">
                              {questaoSelecionada.explicacao}
                            </p>
                          </div>
                        )}
                        <div ref={fimRespostaRef} className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setQuestaoSelecionada(null);
                              setIndiceQuestaoAtual(0);
                              setAlternativaSelecionada("");
                              setRespostaEnviada(false);
                            }}
                            className="flex-1 bg-slate-200 text-black border-2 border-black rounded-xl py-3 font-black shadow-[3px_3px_0_black] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer text-xs"
                          >
                            VOLTAR À LISTA
                          </button>

                          <button
                            type="button"
                            onClick={handleProximaQuestao}
                            className="flex-1 bg-[#00D2DF] text-black border-2 border-black rounded-xl py-3 font-black shadow-[3px_3px_0_black] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer text-xs"
                          >
                            {indiceQuestaoAtual + 1 < questoes.length
                              ? "PRÓXIMA QUESTÃO ➔"
                              : "CONCLUIR "}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                ) : exibirBanco ? (
                  questoes.length > 0 ? (
                    questoes.map((q, index) => (
                      <div
                        key={q.id || Math.random()}
                        onClick={() => {
                          setQuestaoSelecionada(q);
                          setIndiceQuestaoAtual(index);
                          setAlternativaSelecionada("");
                          setRespostaEnviada(false);
                          setTempoInicio(Date.now());
                        }}
                        className="bg-white p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2 cursor-pointer hover:bg-slate-50 transition"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase text-[#7B5CFA]">
                            {q.tema || "Questão de Português"}
                          </span>
                          <span className="bg-[#FFD700] text-black text-[10px] font-black px-2 py-0.5 rounded border border-black">
                            Resolver →
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 text-sm line-clamp-2">
                          {q.enunciado}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center font-bold text-slate-600 py-10">
                      Nenhuma questão encontrada no banco.
                    </div>
                  )
                ) : (
                  <>
                    {/* Renderizando os cursos vindos da API dinamicamente com verificação de acesso limpa e correta */}
                    {cursos.length > 0 ? (
                      cursos.map((curso) => {
                        const temAcesso = curso.temAcesso === true;

                        const precoFormatado = curso.preco
                          ? `R$ ${Number(curso.preco)
                              .toFixed(2)
                              .replace(".", ",")}`
                          : curso.valor
                          ? `R$ ${Number(curso.valor)
                              .toFixed(2)
                              .replace(".", ",")}`
                          : "R$ 97,00";

                        const precoNumVal = Number(
                          curso.preco || curso.valor || 97.0
                        );

                        const cursoFormatado = {
                          id: curso.id,
                          title:
                            curso.titulo || curso.nome || "Curso sem título",
                          description:
                            curso.descricao || "Sem descrição disponível.",
                          progress: temAcesso
                            ? curso.progresso !== undefined
                              ? curso.progresso
                              : curso.progressoGeral || 0
                            : 0,
                          comprado: temAcesso,
                          preco: precoFormatado,
                          precoNum: precoNumVal,
                          checkoutUrl:
                            curso.checkoutUrl || curso.linkPagamento || null,
                        };

                        return (
                          <div
                            key={curso.id}
                            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 rounded-xl border border-slate-300 bg-white/50 transition mb-2"
                          >
                            <div className="flex-1 relative">
                              {!temAcesso && (
                                <div className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-md border border-slate-300 shadow-sm flex items-center gap-1">
                                  <span>🔒</span>
                                  <span>{precoFormatado}</span>
                                </div>
                              )}
                              <ModuleProgress
                                currentModule={cursoFormatado}
                                onAdquirir={() =>
                                  handleAdquirirCurso(cursoFormatado)
                                }
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center font-bold text-slate-600 py-10 text-xs">
                        Nenhum curso cadastrado na API no momento.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* CONTAINER 3 */}
        <div className="w-full lg:w-80 shrink-0 order-3 lg:order-1 flex flex-col gap-3">
          <button
            onClick={handleCarregarBancoQuestoes}
            disabled={carregandoQuestoes}
            className="bg-cyan-300 border-2 border-black rounded-full py-2.5 px-4 text-center font-extrabold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer active:translate-x-1 active:translate-y-1"
          >
            {carregandoQuestoes ? "CARREGANDO..." : "ABRIR BANCO DE QUESTÕES"}
          </button>

          <SidebarStats stats={userStats} className="w-full h-full" />

          {erroQuestoes && (
            <span className="text-xs font-bold text-red-700 bg-red-100 p-2 rounded border border-black text-center">
              {erroQuestoes}
            </span>
          )}
        </div>
      </main>

      <footer className="bg-[#F4EFE6] py-4 text-center text-xs font-bold text-slate-700 flex justify-center gap-6 px-4">
        <a href="about" className="hover:underline">
          Sobre a Plataforma
        </a>
        <a href="terms" className="hover:underline">
          Termos
        </a>
      </footer>

      <AlertModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        message={modalConfig.message}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
