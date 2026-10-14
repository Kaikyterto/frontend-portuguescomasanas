import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Card from "../components/Card";
import AlertModal from "../components/AlertModal";
import { simuladoService } from "../service/simulado";
import { questaoService } from "../service/questao";
import { buscarDadosUsuarioLogado } from "../service/user";
import { links } from "../ultils/linksAdmin";

export default function SimuladosAdminPage() {
  const token = localStorage.getItem("@PortuguessComAnas:token");

  const [usuario, setUsuario] = useState(null);

  // Estados de Carregamento e Submissão
  const [simulados, setSimulados] = useState([]);
  const [loadingSimulados, setLoadingSimulados] = useState(false);
  const [isSubmittingSimulado, setIsSubmittingSimulado] = useState(false);

  // Paginação de Simulados
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // Lista de Questões disponíveis para compor o simulado
  const [questoesDisponiveis, setQuestoesDisponiveis] = useState([]);
  const [loadingQuestoes, setLoadingQuestoes] = useState(false);

  // Modal de Criação / Edição de Simulado
  const [showSimuladoModal, setShowSimuladoModal] = useState(false);
  const [editingSimuladoId, setEditingSimuladoId] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, descricaoSet] = useState("");
  const [duracaoMinutos, setDuracaoMinutos] = useState(60);
  const [ativo, setAtivo] = useState(true);
  const [questaoIdsSelecionadas, setQuestaoIdsSelecionadas] = useState([]);

  // Modal de Detalhes / Histórico do Simulado
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [simuladoSelecionado, setSimuladoSelecionado] = useState(null);

  // Alerta Modal
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "success",
    message: "",
    onConfirm: null,
  });

  const showAlert = (message, type = "success", onConfirm = null) => {
    setAlertConfig({ isOpen: true, type, message, onConfirm });
  };

  // Carregar dados do usuário e lista de simulados
  const fetchData = async (page = 0) => {
    if (!token) return;
    setLoadingSimulados(true);
    try {
      const [dadosUsuario, dataSimuladosRes] = await Promise.all([
        buscarDadosUsuarioLogado(token),
        simuladoService.listar(token, page, pageSize),
      ]);

      setUsuario(dadosUsuario);

      if (Array.isArray(dataSimuladosRes)) {
        setSimulados(dataSimuladosRes);
        setTotalPages(1);
        setTotalElements(dataSimuladosRes.length);
      } else {
        setSimulados(dataSimuladosRes?.content || []);
        setTotalPages(dataSimuladosRes?.totalPages || 0);
        setCurrentPage(dataSimuladosRes?.number || page);
        setTotalElements(dataSimuladosRes?.totalElements || 0);
      }
    } catch (error) {
      console.error("Erro ao carregar simulados:", error);
    } finally {
      setLoadingSimulados(false);
    }
  };

  // Carregar questões para seleção na hora de montar o simulado
  const fetchQuestoesParaSelecao = async () => {
    try {
      setLoadingQuestoes(true);
      // Busca uma quantidade razoável de questões ativas para seleção
      const res = await questaoService.listar(token, 0, 100, { ativa: true });
      const lista = Array.isArray(res) ? res : res?.content || [];
      setQuestoesDisponiveis(lista);
    } catch (error) {
      console.error("Erro ao carregar questões para simulado:", error);
    } finally {
      setLoadingQuestoes(false);
    }
  };

  useEffect(() => {
    fetchData(0);
    fetchQuestoesParaSelecao();
  }, [token]);

  // Resetar Formulário do Simulado
  const handleResetForm = () => {
    setEditingSimuladoId(null);
    setTitulo("");
    descricaoSet("");
    setDuracaoMinutos(60);
    setAtivo(true);
    setQuestaoIdsSelecionadas([]);
    setShowSimuladoModal(false);
  };

  const handleOpenCreateModal = () => {
    handleResetForm();
    setShowSimuladoModal(true);
  };

  // Salvar (Criar ou Atualizar) Simulado
  const handleSaveSimulado = async (e) => {
    e.preventDefault();
    if (isSubmittingSimulado) return;

    if (!titulo.trim()) {
      showAlert("O título do simulado é obrigatório.", "error");
      return;
    }

    if (
      questaoIdsSelecionadas.length === 0 ||
      questaoIdsSelecionadas.length > 100
    ) {
      showAlert(
        "Selecione de 1 a 100 questões para compor o simulado.",
        "error"
      );
      return;
    }

    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      duracaoMinutos: parseInt(duracaoMinutos) || 60,
      ativo: Boolean(ativo),
      questaoIds: questaoIdsSelecionadas,
    };

    setIsSubmittingSimulado(true);
    try {
      if (editingSimuladoId) {
        await simuladoService.atualizar(editingSimuladoId, payload, token);
        showAlert("Simulado atualizado com sucesso!");
      } else {
        await simuladoService.criar(payload, token);
        showAlert("Simulado criado com sucesso!");
      }
      handleResetForm();
      fetchData(currentPage);
    } catch (error) {
      showAlert(`Erro ao salvar simulado: ${error.message || error}`, "error");
    } finally {
      setIsSubmittingSimulado(false);
    }
  };

  // Abrir modal para edição
  const handleEditSimulado = async (simuladoResumo) => {
    try {
      // Busca os detalhes completos para obter as questões já vinculadas
      const detalhe = await simuladoService.detalhar(simuladoResumo.id, token);
      setEditingSimuladoId(detalhe.id);
      setTitulo(detalhe.titulo || "");
      descricaoSet(detalhe.descricao || "");
      setDuracaoMinutos(detalhe.duracaoMinutos || 60);
      setAtivo(detalhe.ativo);
      setQuestaoIdsSelecionadas(
        detalhe.questoes
          ? detalhe.questoes.map((q) => q.questaoOrigemId || q.id)
          : []
      );
      setShowSimuladoModal(true);
    } catch (error) {
      showAlert("Erro ao carregar detalhes para edição.", "error");
    }
  };

  // Alternar Status Ativo / Inativo via Patch
  const handleToggleAtivo = async (id, statusAtual) => {
    try {
      await simuladoService.alterarAtivo(id, !statusAtual, token);
      showAlert("Status do simulado alterado com sucesso!");
      fetchData(currentPage);
    } catch (error) {
      showAlert(`Erro ao alterar status: ${error.message || error}`, "error");
    }
  };

  // Excluir Simulado
  const handleDeleteSimulado = (id) => {
    showAlert(
      "Deseja realmente excluir este simulado?",
      "confirm",
      async () => {
        try {
          await simuladoService.deletar(id, token);
          showAlert("Simulado excluído com sucesso!");
          fetchData(currentPage);
        } catch (error) {
          if (
            error.status === 409 ||
            (error.message && error.message.includes("409"))
          ) {
            showAlert(
              "Simulado com tentativas possui histórico. Desative-o em vez de excluir.",
              "error"
            );
          } else {
            showAlert(
              `Erro ao excluir simulado: ${error.message || error}`,
              "error"
            );
          }
        }
      }
    );
  };

  // Visualizar Detalhes do Simulado
  const handleOpenDetalhes = async (simuladoResumo) => {
    try {
      const detalhe = await simuladoService.detalhar(simuladoResumo.id, token);
      setSimuladoSelecionado(detalhe);
      setShowDetalhesModal(true);
    } catch (error) {
      showAlert("Erro ao carregar detalhes do simulado.", "error");
    }
  };

  // Controle de Seleção de Questões na lista do Modal
  const handleToggleQuestaoSelecao = (id) => {
    if (questaoIdsSelecionadas.includes(id)) {
      setQuestaoIdsSelecionadas(
        questaoIdsSelecionadas.filter((qId) => qId !== id)
      );
    } else {
      if (questaoIdsSelecionadas.length >= 100) {
        showAlert("O limite máximo é de 100 questões por simulado.", "error");
        return;
      }
      setQuestaoIdsSelecionadas([...questaoIdsSelecionadas, id]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar usuario={usuario} links={links} />

      <main className="flex-1 p-4 sm:p-6 md:p-8 bg-gradient-to-br from-[#00D2DF] via-[#7B5CFA] to-[#FF42DE]">
        {/* Cabeçalho */}
        <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-5 sm:p-6 shadow-[6px_6px_0_black] mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase">
              Gerenciar Simulados
            </h1>
            <p className="font-bold text-slate-600 text-sm sm:text-base">
              Crie avaliações, configure prazos e selecione questões do banco
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="bg-[#7B5CFA] text-white border-2 border-black px-5 py-3 font-black rounded-xl shadow-[3px_3px_0_black] text-sm uppercase hover:translate-y-[-2px] transition-transform"
          >
            + Novo Simulado
          </button>
        </div>

        {/* MODAL DE CRIAÇÃO / EDIÇÃO DE SIMULADO */}
        {showSimuladoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-6 max-w-3xl w-full shadow-[8px_8px_0_black] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black uppercase">
                  {editingSimuladoId
                    ? "📝 Editar Simulado"
                    : "📝 Novo Simulado"}
                </h3>
                <button
                  onClick={handleResetForm}
                  disabled={isSubmittingSimulado}
                  className="bg-red-400 text-white border-2 border-black px-3 py-1 font-black rounded-lg disabled:opacity-50"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSimulado} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-black text-xs uppercase mb-1">
                      Título do Simulado
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Simulado Avançado CESPE"
                      value={titulo}
                      disabled={isSubmittingSimulado}
                      onChange={(e) => setTitulo(e.target.value)}
                      className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block font-black text-xs uppercase mb-1">
                      Duração (Minutos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={duracaoMinutos}
                      disabled={isSubmittingSimulado}
                      onChange={(e) => setDuracaoMinutos(e.target.value)}
                      className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-black text-xs uppercase mb-1">
                    Descrição
                  </label>
                  <textarea
                    placeholder="Descrição detalhada sobre o simulado..."
                    value={descricao}
                    disabled={isSubmittingSimulado}
                    onChange={(e) => descricaoSet(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ativoCheckbox"
                    checked={ativo}
                    disabled={isSubmittingSimulado}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="w-5 h-5 border-2 border-black rounded cursor-pointer"
                  />
                  <label
                    htmlFor="ativoCheckbox"
                    className="font-black text-sm cursor-pointer uppercase"
                  >
                    Simulado Ativo para os Alunos
                  </label>
                </div>

                {/* Seleção de Questões */}
                <div className="border-2 border-black rounded-xl p-4 bg-white">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-black text-sm uppercase">
                      Selecionar Questões ({questaoIdsSelecionadas.length}/100)
                    </h4>
                    <span className="text-xs font-bold text-slate-500">
                      Clique para selecionar/remover
                    </span>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {loadingQuestoes ? (
                    <p className="text-xs font-bold text-slate-500">
                      Carregando questões disponíveis...
                    </p>
                  ) : questoesDisponiveis.length === 0 ? (
                    <p className="text-xs font-bold text-slate-500">
                      Nenhuma questão encontrada.
                    </p>
                  ) : (
                    questoesDisponiveis.map((q) => {
                      const selecionada = questaoIdsSelecionadas.includes(q.id);
                      return (
                        <div
                          key={q.id}
                          onClick={() => handleToggleQuestaoSelecao(q.id)}
                          className={`border-2 border-black rounded-xl p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                            selecionada
                              ? "bg-[#00D2DF]/30 font-black"
                              : "bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          <div className="text-xs truncate">
                            <span className="bg-black text-white px-1.5 py-0.5 rounded mr-2">
                              ID {q.id}
                            </span>
                            {q.enunciado}
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded border border-black font-black shrink-0 ${
                              selecionada ? "bg-[#00D2DF]" : "bg-white"
                            }`}
                          >
                            {selecionada ? "Selecionada" : "Selecionar"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingSimulado}
                    className="flex-1 bg-[#00D2DF] border-2 border-black rounded-xl py-3 font-black shadow-[3px_3px_0_black] disabled:opacity-60 disabled:cursor-not-allowed uppercase text-sm"
                  >
                    {isSubmittingSimulado
                      ? "Salvando..."
                      : editingSimuladoId
                      ? "Atualizar Simulado"
                      : "Cadastrar Simulado"}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingSimulado}
                    onClick={handleResetForm}
                    className="bg-slate-200 border-2 border-black rounded-xl px-6 py-3 font-black disabled:opacity-50 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE DETALHES DO SIMULADO */}
        {showDetalhesModal && simuladoSelecionado && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-6 max-w-2xl w-full shadow-[8px_8px_0_black] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black uppercase">
                  Detalhes do Simulado
                </h3>
                <button
                  onClick={() => setShowDetalhesModal(false)}
                  className="bg-red-400 text-white border-2 border-black px-3 py-1 font-black rounded-lg"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3 bg-white border-2 border-black rounded-xl p-4 mb-4">
                <h4 className="font-black text-lg">
                  {simuladoSelecionado.titulo}
                </h4>
                <p className="text-sm font-bold text-slate-600">
                  {simuladoSelecionado.descricao || "Sem descrição."}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="bg-[#FFD700] border-2 border-black px-2.5 py-0.5 text-xs font-black rounded-lg">
                    Duração: {simuladoSelecionado.duracaoMinutos} min
                  </span>
                  <span className="bg-[#00D2DF] border-2 border-black px-2.5 py-0.5 text-xs font-black rounded-lg">
                    Total de Questões: {simuladoSelecionado.totalQuestoes}
                  </span>
                  <span
                    className={`border-2 border-black px-2.5 py-0.5 text-xs font-black rounded-lg ${
                      simuladoSelecionado.ativo ? "bg-green-300" : "bg-red-300"
                    }`}
                  >
                    {simuladoSelecionado.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>

              <h4 className="font-black uppercase text-sm mb-2">
                Questões Vinculadas
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {simuladoSelecionado.questoes?.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="bg-white border-2 border-black rounded-xl p-3 text-xs"
                  >
                    <span className="font-black bg-slate-200 px-2 py-0.5 rounded border border-black mr-2">
                      Q#{q.ordem}
                    </span>
                    <span className="font-bold">{q.enunciado}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LISTAGEM DE SIMULADOS */}
        <Card className="bg-[#F4EFE6] border-2 border-black rounded-2xl shadow-[6px_6px_0_black] p-6">
          <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
            <h2 className="font-black uppercase text-xl">
              Simulados Cadastrados ({totalElements})
            </h2>
          </div>

          <div className="space-y-4">
            {loadingSimulados ? (
              <p className="font-bold text-slate-500">
                Carregando simulados...
              </p>
            ) : simulados.length === 0 ? (
              <p className="font-bold text-slate-500">
                Nenhum simulado cadastrado no banco de dados.
              </p>
            ) : (
              simulados.map((simulado) => (
                <div
                  key={simulado.id}
                  className="bg-white border-2 border-black rounded-xl p-5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-[#00D2DF] border-2 border-black px-2 py-0.5 text-xs font-black rounded-lg">
                        ID: {simulado.id}
                      </span>
                      <span className="bg-[#FFD700] border-2 border-black px-2 py-0.5 text-xs font-black rounded-lg">
                        {simulado.duracaoMinutos} min
                      </span>
                      <span className="bg-slate-200 border-2 border-black px-2 py-0.5 text-xs font-black rounded-lg">
                        {simulado.totalQuestoes} Questões
                      </span>
                      <span
                        className={`border-2 border-black px-2 py-0.5 text-xs font-black rounded-lg ${
                          simulado.ativo ? "bg-green-300" : "bg-red-300"
                        }`}
                      >
                        {simulado.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <h3 className="font-black text-lg mt-1">
                      {simulado.titulo}
                    </h3>
                    <p className="font-bold text-sm text-slate-600 line-clamp-1">
                      {simulado.descricao}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenDetalhes(simulado)}
                      className="bg-[#00D2DF] border-2 border-black px-3 py-1.5 text-xs font-black rounded-xl shadow-[2px_2px_0_black]"
                    >
                      Ver Detalhes
                    </button>
                    <button
                      onClick={() =>
                        handleToggleAtivo(simulado.id, simulado.ativo)
                      }
                      className={`border-2 border-black px-3 py-1.5 text-xs font-black rounded-xl shadow-[2px_2px_0_black] ${
                        simulado.ativo ? "bg-amber-300" : "bg-green-300"
                      }`}
                    >
                      {simulado.ativo ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => handleEditSimulado(simulado)}
                      className="bg-[#FFD700] border-2 border-black px-3 py-1.5 text-xs font-black rounded-xl shadow-[2px_2px_0_black]"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteSimulado(simulado.id)}
                      className="bg-red-400 text-white border-2 border-black px-3 py-1.5 text-xs font-black rounded-xl shadow-[2px_2px_0_black]"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PAGINAÇÃO */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t-2 border-black flex-wrap gap-4">
              <button
                onClick={() => fetchData(currentPage - 1)}
                disabled={currentPage === 0 || loadingSimulados}
                className="bg-white border-2 border-black px-4 py-2 font-black text-sm rounded-xl shadow-[2px_2px_0_black] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Página Anterior
              </button>

              <span className="font-black text-sm">
                Página {currentPage + 1} de {totalPages}
              </span>

              <button
                onClick={() => fetchData(currentPage + 1)}
                disabled={currentPage + 1 >= totalPages || loadingSimulados}
                className="bg-white border-2 border-black px-4 py-2 font-black text-sm rounded-xl shadow-[2px_2px_0_black] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Próxima Página →
              </button>
            </div>
          )}
        </Card>
      </main>

      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
      />
    </div>
  );
}
