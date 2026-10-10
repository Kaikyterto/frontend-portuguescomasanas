import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { buscarDadosUsuarioLogado, listarMeusCursos } from "../service/user";
import { criarResposta, listarMinhasRespostas } from "../service/answer";
import { cursoService } from "../service/curso";
import ReactMarkdown from "react-markdown";
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

  // Estados para lidar com o Banco de Questões e Paginação
  const [questoes, setQuestoes] = useState([]);
  const [carregandoQuestoes, setCarregandoQuestoes] = useState(false);
  const [erroQuestoes, setErroQuestoes] = useState("");
  const [exibirBanco, setExibirBanco] = useState(false);

  // Estados de Filtros (Assuntos, Bancas, etc.)
  const [assuntos, setAssuntos] = useState([]);
  const [bancas, setBancas] = useState([]);
  const [filtroAssunto, setFiltroAssunto] = useState("");
  const [filtroBanca, setFiltroBanca] = useState("");

  // Estados de paginação (Zero-based)
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [tamanhoPagina] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isFirst, setIsFirst] = useState(true);
  const [isLast, setIsLast] = useState(false);

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

  // Função de Adquirir Curso com Integração Real ao Backend e Mercado Pago
  const handleAdquirirCurso = async (curso) => {
    const titulo = curso?.title || "o curso";

    setModalConfig({
      isOpen: true,
      type: "success",
      message: `Gerando link de pagamento seguro para "${titulo}"...`,
    });

    try {
      const token = localStorage.getItem("@PortuguessComAnas:token");

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

        const [dadosUsuario, dadosCursos, meusCursosRes] = await Promise.all([
          buscarDadosUsuarioLogado(token),
          cursoService.listar(token),
          listarMeusCursos(token).catch(() => []),
        ]);

        setUsuario(dadosUsuario);

        const idsCursosComAcesso = new Set(
          (meusCursosRes || []).map((m) => m.cursoId || m.curso?.id || m.id)
        );

        const cursosComStatus = (dadosCursos || []).map((curso) => ({
          ...curso,
          temAcesso:
            idsCursosComAcesso.has(curso.id) ||
            curso.comprado === true ||
            curso.liberado === true,
        }));

        setCursos(cursosComStatus);
        await carregarEstatisticasUsuario();

        // Buscar lista de assuntos e bancas para os filtros (opcional / tolerante a falhas)
        fetch("https://backend-portugues-anas-9ffe.onrender.com/api/assuntos", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => (res.ok ? res.json() : []))
          .then((data) => setAssuntos(Array.isArray(data) ? data : []))
          .catch(() => setAssuntos([]));

        fetch("https://backend-portugues-anas-9ffe.onrender.com/api/bancas", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => (res.ok ? res.json() : []))
          .then((data) => setBancas(Array.isArray(data) ? data : []))
          .catch(() => setBancas([]));
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

  // Função para carregar o banco de questões com suporte a paginação e filtros
  const handleCarregarBancoQuestoes = async (paginaDesejada = 0) => {
    try {
      setCarregandoQuestoes(true);
      setErroQuestoes("");
      const token = localStorage.getItem("@PortuguessComAnas:token");

      // Passando parâmetros de filtro caso existam
      const dadosRetorno = await listar(
        token,
        paginaDesejada,
        tamanhoPagina,
        filtroAssunto,
        filtroBanca
      );

      if (dadosRetorno && Array.isArray(dadosRetorno.content)) {
        setQuestoes(dadosRetorno.content);
        setPaginaAtual(dadosRetorno.page);
        setTotalPages(dadosRetorno.totalPages);
        setTotalElements(dadosRetorno.totalElements);
        setIsFirst(dadosRetorno.first);
        setIsLast(dadosRetorno.last);
      } else if (Array.isArray(dadosRetorno)) {
        setQuestoes(dadosRetorno);
        setPaginaAtual(0);
        setTotalPages(1);
        setTotalElements(dadosRetorno.length);
        setIsFirst(true);
        setIsLast(true);
      } else {
        setQuestoes([]);
      }

      setExibirBanco(true);
      setQuestaoSelecionada(null);
      setIndiceQuestaoAtual(0);
      setAlternativaSelecionada("");
      setRespostaEnviada(false);
    } catch (error) {
      setErroQuestoes(
        "Você não tem acesso ao banco de questões. Adquira algum curso para desbloquear!"
      );
    } finally {
      setCarregandoQuestoes(false);
    }
  };

  const handleMudarPagina = (novaPagina) => {
    if (novaPagina >= 0 && novaPagina < totalPages) {
      handleCarregarBancoQuestoes(novaPagina);
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
        message: "Você concluiu todas as questões desta página!",
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
        {/* CONTAINER 1 (Ordem Original) */}
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

        {/* CONTAINER 2 (Ordem Original) */}
        <div className="flex-1 flex flex-col order-2 lg:order-2 w-full min-w-0">
          <Card className="flex-1 flex flex-col bg-[#F4EFE6] h-full !overflow-x-hidden overflow-x-hidden !p-0 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl">
            <div className="px-4 py-3 md:px-5 md:py-4 border-b-2 border-black bg-white flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 ">
                <span className="text-lg md:text-xl">
                  {questaoSelecionada ? "✍️" : exibirBanco ? "📂" : "📚"}
                </span>
                <h2 className="text-slate-900 text-sm md:text-lg font-black tracking-wide uppercase truncate">
                  {questaoSelecionada
                    ? `Responder Questão (${indiceQuestaoAtual + 1}/${
                        questoes.length
                      })`
                    : exibirBanco
                    ? `Banco de Questões (Pág. ${paginaAtual + 1} de ${
                        totalPages || 1
                      })`
                    : "Cursos disponíveis"}
                </h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
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
                    ? `${totalElements} Total`
                    : `${cursos.length} Cursos`}
                </span>
              </div>
            </div>

            <div className="flex-1 relative p-3 md:p-5 overflow-hidden flex flex-col">
              <div
                className="flex-1 flex flex-col gap-3 max-h-[300px] sm:max-h-[350px] lg:max-h-[calc(100vh-320px)] overflow-y-auto pr-1 md:pr-4 custom-scrollbar pb-4"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, black 85%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black 85%, transparent 100%)",
                }}
              >
                {carregandoQuestoes && exibirBanco ? (
                  <div className="text-center font-bold text-slate-700 py-10 animate-pulse">
                    Carregando questões...
                  </div>
                ) : questaoSelecionada ? (
                  <form
                    onSubmit={handleResponderQuestao}
                    className="flex flex-col gap-4 bg-white p-4 md:p-5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div>
                      <span className="text-xs font-black uppercase text-[#7B5CFA] bg-[#7B5CFA]/10 px-2 py-1 rounded border border-[#7B5CFA]/30">
                        {questaoSelecionada.tema || "Questão de Português"}
                      </span>
                      <div className=" text-slate-900 text-sm md:text-base mt-3 leading-relaxed markdown-content">
                        <ReactMarkdown>
                          {questaoSelecionada.enunciado}
                        </ReactMarkdown>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-xs font-black uppercase text-slate-700">
                        Alternativas:
                      </span>
                      {questaoSelecionada.alternativas &&
                      questaoSelecionada.alternativas.length > 0 ? (
                        questaoSelecionada.alternativas.map((alt, index) => {
                          const isCorreta = alt.correta;
                          const identificadorAlt = String(
                            alt.id ?? alt.letra ?? index
                          );
                          const letra = alt.letra || alt.id || index + 1;
                          const textoAlt = alt.texto || alt.descricao;

                          // Comparação blindada com String() em ambos os lados
                          const isSelecionada =
                            String(alternativaSelecionada) === identificadorAlt;

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
                            <div
                              key={identificadorAlt}
                              onClick={() => {
                                if (respostaEnviada) return;
                                setAlternativaSelecionada(identificadorAlt);
                              }}
                              className={`flex items-start gap-3 p-3 rounded-xl border-2 border-black cursor-pointer transition select-none ${corFundo}`}
                            >
                              <input
                                type="radio"
                                name="alternativa"
                                checked={isSelecionada}
                                readOnly
                                disabled={respostaEnviada}
                                className="mt-1 shrink-0 pointer-events-none accent-[#7B5CFA]"
                              />
                              <div className="font-bold text-xs md:text-sm text-slate-800 break-words flex-1 pointer-events-none">
                                <span className="font-black mr-2">
                                  ({letra})
                                </span>
                                <ReactMarkdown components={{ p: "span" }}>
                                  {textoAlt}
                                </ReactMarkdown>
                              </div>
                            </div>
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
                            questaoSelecionada.alternativas?.find(
                              (a) =>
                                String(a.id) === String(alternativaSelecionada)
                            )?.correta
                              ? "bg-emerald-300 text-emerald-950"
                              : "bg-red-300 text-red-950"
                          }`}
                        >
                          {questaoSelecionada.alternativas?.find(
                            (a) =>
                              String(a.id) === String(alternativaSelecionada)
                          )?.correta
                            ? "🎉 Resposta Correta!"
                            : "❌ Resposta Incorreta!"}
                        </div>
                        {questaoSelecionada.explicacao && (
                          <div className="bg-slate-100 p-4 rounded-xl border-2 border-black">
                            <span className="block text-xs font-black uppercase text-slate-700 mb-1">
                              Explicação:
                            </span>
                            <div className="text-xs md:text-sm font-bold text-slate-800 markdown-content">
                              <ReactMarkdown>
                                {questaoSelecionada.explicacao}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                        <div
                          ref={fimRespostaRef}
                          className="flex flex-col sm:flex-row gap-3 pt-2"
                        >
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
                        className="bg-white p-3 md:p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2 cursor-pointer hover:bg-slate-50 transition"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] md:text-xs font-black uppercase text-[#7B5CFA] truncate">
                            {q.tema || "Questão de Português"}
                          </span>
                          <span className="bg-[#FFD700] text-black text-[10px] font-black px-2 py-0.5 rounded border border-black shrink-0">
                            Resolver →
                          </span>
                        </div>
                        <div className="font-bold text-slate-800 text-xs md:text-sm line-clamp-2">
                          <ReactMarkdown components={{ p: "span" }}>
                            {q.enunciado}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center font-bold text-slate-600 py-10 ">
                      Nenhuma questão encontrada com esses filtros.
                    </div>
                  )
                ) : (
                  <>
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
                        Nenhum curso cadastrado no momento.
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Rodapé de Paginação do Banco de Questões */}
              {exibirBanco && !questaoSelecionada && totalPages > 1 && (
                <div className="pt-3 border-t-2 border-black flex items-center justify-between bg-white px-3 py-2 rounded-xl mt-2">
                  <button
                    onClick={() => handleMudarPagina(paginaAtual - 1)}
                    disabled={isFirst || carregandoQuestoes}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition ${
                      isFirst || carregandoQuestoes
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                        : "bg-[#00D2DF] text-black hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none cursor-pointer"
                    }`}
                  >
                    ← Anterior
                  </button>

                  <span className="text-xs font-black text-slate-800">
                    Página {paginaAtual + 1}/{totalPages}
                  </span>

                  <button
                    onClick={() => handleMudarPagina(paginaAtual + 1)}
                    disabled={isLast || carregandoQuestoes}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition ${
                      isLast || carregandoQuestoes
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                        : "bg-[#7B5CFA] text-white hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none cursor-pointer"
                    }`}
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* CONTAINER 3 (Filtros e Botão de Abertura) */}
        <div className="w-full lg:w-80 shrink-0 order-3 lg:order-1 flex flex-col gap-3">
          {/* Card de Filtros */}
          <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3">
            <span className="text-xs font-black uppercase text-slate-900">
              🔍 Filtrar Questões
            </span>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-600">
                Assunto:
              </label>
              <select
                value={filtroAssunto}
                onChange={(e) => setFiltroAssunto(e.target.value)}
                className="w-full text-xs font-bold p-2 rounded-lg border-2 border-black bg-[#F4EFE6] outline-none cursor-pointer"
              >
                <option value="">Todos os Assuntos</option>
                {assuntos.map((assunto) => (
                  <option
                    key={assunto.id || assunto}
                    value={assunto.id || assunto}
                  >
                    {assunto.nome || assunto.descricao || assunto}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-600">
                Banca:
              </label>
              <select
                value={filtroBanca}
                onChange={(e) => setFiltroBanca(e.target.value)}
                className="w-full text-xs font-bold p-2 rounded-lg border-2 border-black bg-[#F4EFE6] outline-none cursor-pointer"
              >
                <option value="">Todas as Bancas</option>
                {bancas.map((banca) => (
                  <option key={banca.id || banca} value={banca.id || banca}>
                    {banca.nome || banca}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => handleCarregarBancoQuestoes(0)}
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
