import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Card from "../components/Card";
import AlertModal from "../components/AlertModal";
import { questaoService } from "../service/questao";
import { bancaService } from "../service/banca";
import { cursoService } from "../service/curso";
import { moduloService } from "../service/module";

import { buscarDadosUsuarioLogado } from "../service/user";
import { links } from "../ultils/linksAdmin";
import { API_URL } from "../config/api";

// ==========================================
// SERVIÇOS DE ASSUNTOS (API)
// ==========================================

export async function listarAssuntos(token) {
  try {
    const response = await fetch(`${API_URL}/api/assuntos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : [];
    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao listar assuntos (Status: ${response.status})`
      );
    }
    return data.content || data;
  } catch (error) {
    console.error("Erro em listarAssuntos:", error);
    throw error;
  }
}

export async function criarAssunto(assuntoData, token) {
  try {
    const response = await fetch(`${API_URL}/api/assuntos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(assuntoData),
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};
    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao cadastrar assunto (Status: ${response.status})`
      );
    }
    return data;
  } catch (error) {
    console.error("Erro em criarAssunto:", error);
    throw error;
  }
}

export async function atualizarAssunto(id, assuntoData, token) {
  try {
    const response = await fetch(`${API_URL}/api/assuntos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(assuntoData),
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};
    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao atualizar assunto (Status: ${response.status})`
      );
    }
    return data;
  } catch (error) {
    console.error(`Erro em atualizarAssunto (ID: ${id}):`, error);
    throw error;
  }
}

export async function deletarAssunto(id, token) {
  try {
    const response = await fetch(`${API_URL}/api/assuntos/${id}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};
    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao deletar assunto (Status: ${response.status})`
      );
    }
    return true;
  } catch (error) {
    console.error(`Erro em deletarAssunto (ID: ${id}):`, error);
    throw error;
  }
}

export const assuntoService = {
  listarAssuntos,
  criarAssunto,
  atualizarAssunto,
  deletarAssunto,
};

// ==========================================
// SERVIÇO DE AULAS (API)
// ==========================================

export const aulaService = {
  async criar(cursoId, moduloId, aulaData, token) {
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/modulos/${moduloId}/aulas`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(aulaData),
      }
    );
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) throw new Error(data.message || "Erro ao criar aula");
    return data;
  },
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function ContentsPage() {
  const token = localStorage.getItem("@PortuguessComAnas:token");

  const [usuario, setUsuario] = useState(null);

  // Estados de Carregamento/Submissão
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);
  const [isSubmittingAssunto, setIsSubmittingAssunto] = useState(false);
  const [isSubmittingBanca, setIsSubmittingBanca] = useState(false);
  const [isSubmittingModulo, setIsSubmittingModulo] = useState(false);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [isSubmittingDeleteCurso, setIsSubmittingDeleteCurso] = useState(false);

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

  // Formulário do Curso
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleDescription, setNewModuleDescription] = useState("");
  const [newModulePrice, setNewModulePrice] = useState("");
  const [newModuleDataTermino, setNewModuleDataTermino] = useState("");

  const [cursos, setCursos] = useState([]);
  const [loadingCursos, setLoadingCursos] = useState(false);

  // Formulário de Aula
  const [selectedCursoForAula, setSelectedCursoForAula] = useState("");
  const [modulosDisponiveisParaAula, setModulosDisponiveisParaAula] = useState(
    []
  );
  const [selectedModuloForAula, setSelectedModuloForAula] = useState("");
  const [aulaTitulo, setAulaTitulo] = useState("");

  const [aulaOrdem, setAulaOrdem] = useState(1);
  const [aulaLinkVideo, setAulaLinkVideo] = useState("");

  // Modal de Módulos
  const [showModuloModal, setShowModuloModal] = useState(false);
  const [selectedCursoForModulo, setSelectedCursoForModulo] = useState(null);
  const [modulosDoCurso, setModulosDoCurso] = useState([]);
  const [moduloTitulo, setModuloTitulo] = useState("");
  const [moduloDescricao, setModuloDescricao] = useState("");
  const [moduloOrdem, setModuloOrdem] = useState(1);
  const [editingModuloId, setEditingModuloId] = useState(null);

  // Modal de Exclusão de Curso
  const [showDeleteCursoModal, setShowDeleteCursoModal] = useState(false);
  const [cursoParaExcluir, setCursoParaExcluir] = useState(null);
  const [nomeConfirmacaoInput, setNomeConfirmacaoInput] = useState("");
  const [senhaAdminInput, setSenhaAdminInput] = useState("");

  // Modal de Questão
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionStatement, setQuestionStatement] = useState("");
  const [questionAssuntoId, setQuestionAssuntoId] = useState("");
  const [questionBancaId, setQuestionBancaId] = useState("");
  const [questionAno, setQuestionAno] = useState(new Date().getFullYear());
  const [questionNivel, setQuestionNivel] = useState("MEDIO");
  const [questionExplicacao, setQuestionExplicacao] = useState("");
  const [questionFonte, setQuestionFonte] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");

  const [alternativas, setalternativas] = useState([
    { letra: "A", texto: "", correta: true },
    { letra: "B", texto: "", correta: false },
    { letra: "C", texto: "", correta: false },
    { letra: "D", texto: "", correta: false },
    { letra: "E", texto: "", correta: false },
  ]);

  // Estados de Questões e Paginação
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const [assuntos, setAssuntos] = useState([]);
  const [bancas, setBancas] = useState([]);

  // Modais de Assunto e Banca
  const [showAssuntoModal, setShowAssuntoModal] = useState(false);
  const [assuntoNome, setAssuntoNome] = useState("");
  const [assuntoDescricao, setAssuntoDescricao] = useState("");
  const [editingAssuntoId, setEditingAssuntoId] = useState(null);

  const [showBancaModal, setShowBancaModal] = useState(false);
  const [bancaNome, setBancaNome] = useState("");
  const [editingBancaId, setEditingBancaId] = useState(null);

  // Buscar Questões de forma paginada
  const fetchQuestions = async (page = 0) => {
    if (!token) return;
    setLoadingQuestions(true);
    try {
      const dataQuestionsRes = await questaoService.listar(
        token,
        page,
        pageSize
      );

      if (Array.isArray(dataQuestionsRes)) {
        setQuestions(dataQuestionsRes);
        setTotalPages(1);
        setTotalElements(dataQuestionsRes.length);
      } else {
        setQuestions(dataQuestionsRes?.content || []);
        setTotalPages(dataQuestionsRes?.totalPages || 0);
        setCurrentPage(dataQuestionsRes?.number || page);
        setTotalElements(dataQuestionsRes?.totalElements || 0);
      }
    } catch (error) {
      console.error("Erro ao carregar questões:", error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Carregar dados iniciais gerais
  const fetchData = async () => {
    if (!token) {
      console.warn("Token não encontrado no localStorage.");
      return;
    }

    setLoadingCursos(true);
    try {
      const [dadosUsuario, dataAssuntos, dataBancasRes, dataCursosRes] =
        await Promise.all([
          buscarDadosUsuarioLogado(token),
          assuntoService.listarAssuntos(token),
          bancaService.listar(token),
          cursoService.listar(token),
        ]);

      const dataCursos = Array.isArray(dataCursosRes)
        ? dataCursosRes
        : dataCursosRes?.content || [];
      const dataBancas = Array.isArray(dataBancasRes)
        ? dataBancasRes
        : dataBancasRes?.content || [];

      setUsuario(dadosUsuario);
      setAssuntos(dataAssuntos || []);
      setBancas(dataBancas);
      setCursos(dataCursos);

      await fetchQuestions(0);
    } catch (error) {
      console.error("Erro ao carregar dados do banco:", error);
    } finally {
      setLoadingCursos(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handlers para Aulas
  const handleCursoAulaChange = async (cursoId) => {
    setSelectedCursoForAula(cursoId);
    setSelectedModuloForAula("");
    setModulosDisponiveisParaAula([]);

    if (!cursoId) return;
    try {
      const modulos = await moduloService.listarModulos(cursoId, token);
      setModulosDisponiveisParaAula(modulos || []);
    } catch (error) {
      console.error("Erro ao carregar módulos para a aula:", error);
    }
  };

  const handleCreateAula = async (e) => {
    e.preventDefault();
    if (isSubmittingVideo) return;

    if (!selectedCursoForAula || !selectedModuloForAula || !aulaTitulo.trim()) {
      showAlert(
        "Por favor, selecione o curso, o módulo e informe o título da aula.",
        "error"
      );
      return;
    }
    setIsSubmittingVideo(true);
    try {
      const payload = {
        titulo: aulaTitulo.trim(),
        ordem: parseInt(aulaOrdem) || 1,
        linkVideo: aulaLinkVideo.trim() || null,
      };

      await aulaService.criar(
        selectedCursoForAula,
        selectedModuloForAula,
        payload,
        token
      );
      showAlert("Aula cadastrada com sucesso!");

      setAulaTitulo("");
      setAulaOrdem(1);
      setAulaLinkVideo("");
      setSelectedCursoForAula("");
      setSelectedModuloForAula("");
      setModulosDisponiveisParaAula([]);
    } catch (error) {
      showAlert(`Erro ao cadastrar aula: ${error.message || error}`, "error");
    } finally {
      setIsSubmittingVideo(false);
    }
  };

  // Handlers para Assuntos
  const handleSaveAssunto = async (e) => {
    e.preventDefault();
    if (isSubmittingAssunto) return;

    if (!assuntoNome.trim()) {
      showAlert("Digite o nome do assunto.", "error");
      return;
    }
    setIsSubmittingAssunto(true);
    try {
      const payload = {
        nome: assuntoNome.trim(),
        descricao: assuntoDescricao.trim() || null,
        disciplinaId: 1,
      };
      if (editingAssuntoId) {
        await assuntoService.atualizarAssunto(editingAssuntoId, payload, token);
        showAlert("Assunto atualizado com sucesso!");
      } else {
        await assuntoService.criarAssunto(payload, token);
        showAlert("Assunto criado com sucesso!");
      }
      setAssuntoNome("");
      setAssuntoDescricao("");
      setEditingAssuntoId(null);
      setShowAssuntoModal(false);
      fetchData();
    } catch (error) {
      showAlert(`Erro ao salvar assunto: ${error.message || error}`, "error");
    } finally {
      setIsSubmittingAssunto(false);
    }
  };

  const handleEditAssunto = (assunto) => {
    setEditingAssuntoId(assunto.id);
    setAssuntoNome(assunto.nome || assunto.titulo || "");
    setAssuntoDescricao(assunto.descricao || "");
    setShowAssuntoModal(true);
  };

  const handleDeleteAssunto = (id) => {
    showAlert("Deseja realmente excluir este assunto?", "confirm", async () => {
      try {
        await assuntoService.deletarAssunto(id, token);
        showAlert("Assunto excluído com sucesso!");
        fetchData();
      } catch (error) {
        showAlert("Erro ao excluir assunto.", "error");
      }
    });
  };

  // Handlers para Bancas
  const handleSaveBanca = async (e) => {
    e.preventDefault();
    if (isSubmittingBanca) return;

    if (!bancaNome.trim()) {
      showAlert("Digite o nome da banca.", "error");
      return;
    }
    setIsSubmittingBanca(true);
    try {
      if (editingBancaId) {
        await bancaService.atualizar(
          editingBancaId,
          { nome: bancaNome },
          token
        );
        showAlert("Banca atualizada com sucesso!");
      } else {
        await bancaService.criarBanca({ nome: bancaNome }, token);
        showAlert("Banca criada com sucesso!");
      }
      setBancaNome("");
      setEditingBancaId(null);
      setShowBancaModal(false);
      fetchData();
    } catch (error) {
      showAlert(`Erro ao salvar banca: ${error.message || error}`, "error");
    } finally {
      setIsSubmittingBanca(false);
    }
  };

  const handleEditBanca = (banca) => {
    setEditingBancaId(banca.id);
    setBancaNome(banca.nome || banca.titulo || "");
    setShowBancaModal(true);
  };

  const handleDeleteBanca = (id) => {
    showAlert("Deseja realmente excluir esta banca?", "confirm", async () => {
      try {
        await bancaService.deletar(id, token);
        showAlert("Banca excluída com sucesso!");
        fetchData();
      } catch (error) {
        showAlert("Erro ao excluir banca.", "error");
      }
    });
  };

  // Handlers para Cursos
  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (isSubmittingCourse) return;

    if (!newModuleTitle || !newModuleDescription) {
      showAlert("Por favor, preencha o nome e a descrição do curso!", "error");
      return;
    }
    setIsSubmittingCourse(true);
    try {
      const cursoData = {
        nome: newModuleTitle.trim(),
        descricao: newModuleDescription.trim(),
        preco: newModulePrice ? parseFloat(newModulePrice) : 0.0,
        dataTermino: newModuleDataTermino || null,
      };
      await cursoService.criar(cursoData, token);
      showAlert(`Curso "${newModuleTitle}" criado com sucesso!`);
      setNewModuleTitle("");
      setNewModuleDescription("");
      setNewModulePrice("");
      setNewModuleDataTermino("");
      fetchData();
    } catch (error) {
      showAlert(`Erro ao criar curso: ${error.message || error}`, "error");
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleDeleteCurso = (curso) => {
    setCursoParaExcluir(curso);
    setNomeConfirmacaoInput("");
    setSenhaAdminInput("");
    setShowDeleteCursoModal(true);
  };

  const handleConfirmDeleteCurso = async (e) => {
    e.preventDefault();
    if (!cursoParaExcluir) return;

    const nomeEsperado = cursoParaExcluir.nome || cursoParaExcluir.titulo;
    if (nomeConfirmacaoInput !== nomeEsperado) {
      showAlert(
        "O nome do curso digitado não confere. Tente novamente.",
        "error"
      );
      return;
    }

    if (!senhaAdminInput) {
      showAlert("Digite a sua senha de Administrador.", "error");
      return;
    }

    setIsSubmittingDeleteCurso(true);
    try {
      await cursoService.deletar(
        cursoParaExcluir.id,
        {
          nomeCurso: nomeConfirmacaoInput,
          senha: senhaAdminInput,
          cienteConsequencias: true,
        },
        token
      );

      showAlert("Curso excluído com sucesso!");
      setShowDeleteCursoModal(false);
      setCursoParaExcluir(null);
      fetchData();
    } catch (error) {
      showAlert(`Erro ao excluir curso: ${error.message || error}`, "error");
    } finally {
      setIsSubmittingDeleteCurso(false);
    }
  };

  // Handlers para Módulos de um Curso
  const handleOpenModulosModal = async (curso) => {
    setSelectedCursoForModulo(curso);
    setShowModuloModal(true);
    await carregarModulosDoCurso(curso.id);
  };

  const carregarModulosDoCurso = async (cursoId) => {
    try {
      const data = await moduloService.listarModulos(cursoId, token);
      setModulosDoCurso(data || []);
    } catch (error) {
      console.error("Erro ao listar módulos:", error);
    }
  };

  const handleSaveModulo = async (e) => {
    e.preventDefault();
    if (isSubmittingModulo) return;

    if (!moduloTitulo.trim() || !selectedCursoForModulo) {
      showAlert("Preencha o título do módulo.", "error");
      return;
    }
    setIsSubmittingModulo(true);
    try {
      const payload = {
        titulo: moduloTitulo.trim(),
        descricao: moduloDescricao.trim() || null,
        ordem: parseInt(moduloOrdem) || 1,
      };
      if (editingModuloId) {
        await moduloService.atualizarModulo(
          selectedCursoForModulo.id,
          editingModuloId,
          payload,
          token
        );
        showAlert("Módulo atualizado com sucesso!");
      } else {
        await moduloService.criarModulo(
          selectedCursoForModulo.id,
          payload,
          token
        );
        showAlert("Módulo criado com sucesso!");
      }
      setModuloTitulo("");
      setModuloDescricao("");
      setModuloOrdem(1);
      setEditingModuloId(null);
      await carregarModulosDoCurso(selectedCursoForModulo.id);
    } catch (error) {
      showAlert(`Erro ao salvar módulo: ${error.message || error}`, "error");
    } finally {
      setIsSubmittingModulo(false);
    }
  };

  const handleEditModulo = (modulo) => {
    setEditingModuloId(modulo.id);
    setModuloTitulo(modulo.titulo || "");
    setModuloDescricao(modulo.descricao || "");
    setModuloOrdem(modulo.ordem || 1);
  };

  const handleDeleteModulo = (moduloId) => {
    showAlert("Deseja realmente excluir este módulo?", "confirm", async () => {
      try {
        await moduloService.deletarModulo(
          selectedCursoForModulo.id,
          moduloId,
          token
        );
        showAlert("Módulo excluído com sucesso!");
        await carregarModulosDoCurso(selectedCursoForModulo.id);
      } catch (error) {
        showAlert("Erro ao excluir módulo.", "error");
      }
    });
  };

  // Handlers para Questões
  const handleResetQuestionForm = () => {
    setEditingQuestionId(null);
    setQuestionStatement("");
    setQuestionAssuntoId("");
    setQuestionBancaId("");
    setQuestionAno(new Date().getFullYear());
    setQuestionNivel("MEDIO");
    setQuestionExplicacao("");
    setQuestionFonte("");
    setCorrectAnswer("A");
    setalternativas([
      { letra: "A", texto: "", correta: true },
      { letra: "B", texto: "", correta: false },
      { letra: "C", texto: "", correta: false },
      { letra: "D", texto: "", correta: false },
      { letra: "E", texto: "", correta: false },
    ]);
    setShowQuestionModal(false);
  };

  const handleOpenCreateQuestion = () => {
    handleResetQuestionForm();
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (isSubmittingQuestion) return;

    if (!token) {
      showAlert(
        "Sessão não encontrada ou token ausente. Faça login novamente.",
        "error"
      );
      return;
    }
    const alternativasPreenchidas = alternativas.filter(
      (alt) => alt.texto && alt.texto.trim() !== ""
    );

    if (
      !questionStatement ||
      !questionAssuntoId ||
      alternativasPreenchidas.length < 2
    ) {
      showAlert(
        "Por favor, preencha o enunciado, o assunto e pelo menos duas alternativas!",
        "error"
      );
      return;
    }

    const questaoData = {
      assuntoId: parseInt(questionAssuntoId),
      bancaId: questionBancaId ? parseInt(questionBancaId) : null,
      enunciado: questionStatement,
      ano: parseInt(questionAno) || new Date().getFullYear(),
      nivel: questionNivel,
      explicacao: questionExplicacao,
      fonte: questionFonte,
      alternativas: alternativas.map((alt) => ({
        letra: alt.letra,
        texto: alt.texto,
        correta: alt.letra === correctAnswer,
      })),
    };

    setIsSubmittingQuestion(true);
    try {
      if (editingQuestionId) {
        await questaoService.atualizar(editingQuestionId, questaoData, token);
        showAlert("Questão atualizada com sucesso!");
      } else {
        await questaoService.criarQuestao(questaoData, token);
        showAlert("Questão criada com sucesso!");
      }
      handleResetQuestionForm();
      fetchQuestions(currentPage);
    } catch (error) {
      showAlert(`Erro ao salvar questão: ${error.message || error}`, "error");
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleEditQuestion = (q) => {
    const qId = q.id;
    setEditingQuestionId(qId);
    setQuestionStatement(q.enunciado || "");
    setQuestionAssuntoId(q.assuntoId || "");
    setQuestionBancaId(q.bancaId || "");
    setQuestionAno(q.ano || new Date().getFullYear());
    setQuestionNivel(q.nivel || "MEDIO");
    setQuestionExplicacao(q.explicacao || "");
    setQuestionFonte(q.fonte || "");

    const listaAlts = q.alternativas || [];
    if (listaAlts.length > 0) {
      const formattedAlts = listaAlts.map((a) => ({
        letra: a.letra,
        texto: a.texto,
        correta: Boolean(a.correta),
      }));
      setalternativas(formattedAlts);
      const corretaObj = formattedAlts.find((a) => a.correta === true);
      if (corretaObj) {
        setCorrectAnswer(corretaObj.letra);
      }
    }
    setShowQuestionModal(true);
  };

  const handleDeleteQuestion = (id) => {
    if (!token) {
      showAlert("Sessão não encontrada ou token ausente.", "error");
      return;
    }

    showAlert("Deseja realmente excluir esta questão?", "confirm", async () => {
      try {
        await questaoService.deletar(id, token);
        showAlert("Questão excluída com sucesso!");
        fetchQuestions(currentPage);
      } catch (error) {
        showAlert("Erro ao excluir questão.", "error");
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar usuario={usuario} links={links} />

      <main className="flex-1 p-4 sm:p-6 md:p-8 bg-gradient-to-br from-[#00D2DF] via-[#7B5CFA] to-[#FF42DE]">
        {/* Cabeçalho */}
        <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-5 sm:p-6 shadow-[6px_6px_0_black] mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase">
              Gerenciar Conteúdos
            </h1>
            <p className="font-bold text-slate-600 text-sm sm:text-base">
              Crie cursos, aulas, assuntos, bancas e questões integradas
            </p>
          </div>
        </div>

        {/* MODAL DE ASSUNTOS */}
        {showAssuntoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-6 max-w-lg w-full shadow-[8px_8px_0_black] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black uppercase">
                  {editingAssuntoId ? "Editar Assunto" : "Gerenciar Assuntos"}
                </h3>
                <button
                  onClick={() => setShowAssuntoModal(false)}
                  disabled={isSubmittingAssunto}
                  className="bg-red-400 text-white border-2 border-black px-3 py-1 font-black rounded-lg disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSaveAssunto} className="space-y-3 mb-6">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Nome do Assunto
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Sintaxe"
                    value={assuntoNome}
                    disabled={isSubmittingAssunto}
                    onChange={(e) => setAssuntoNome(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Descrição (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Estudo da estrutura das frases"
                    value={assuntoDescricao}
                    disabled={isSubmittingAssunto}
                    onChange={(e) => setAssuntoDescricao(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white disabled:opacity-50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingAssunto}
                    className="flex-1 bg-[#7B5CFA] text-white border-2 border-black rounded-xl py-3 font-black shadow-[3px_3px_0_black] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmittingAssunto
                      ? "Salvando..."
                      : editingAssuntoId
                      ? "Atualizar Assunto"
                      : "Cadastrar Assunto"}
                  </button>
                  {editingAssuntoId && (
                    <button
                      type="button"
                      disabled={isSubmittingAssunto}
                      onClick={() => {
                        setEditingAssuntoId(null);
                        setAssuntoNome("");
                        setAssuntoDescricao("");
                      }}
                      className="bg-slate-200 border-2 border-black rounded-xl px-4 py-3 font-black disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
              <hr className="border-2 border-black mb-4" />
              <h4 className="font-black uppercase text-sm mb-2">
                Assuntos Cadastrados
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {assuntos.length === 0 ? (
                  <p className="text-sm font-bold text-slate-500">
                    Nenhum assunto cadastrado.
                  </p>
                ) : (
                  assuntos.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border-2 border-black rounded-xl p-3 flex justify-between items-center gap-2"
                    >
                      <span className="font-bold text-sm truncate">
                        {item.nome || item.titulo}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleEditAssunto(item)}
                          className="bg-[#FFD700] border-2 border-black px-2 py-1 text-xs font-black rounded-lg"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteAssunto(item.id)}
                          className="bg-red-400 text-white border-2 border-black px-2 py-1 text-xs font-black rounded-lg"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE BANCAS */}
        {showBancaModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-6 max-w-lg w-full shadow-[8px_8px_0_black] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black uppercase">
                  {editingBancaId ? "Editar Banca" : "Gerenciar Bancas"}
                </h3>
                <button
                  onClick={() => setShowBancaModal(false)}
                  disabled={isSubmittingBanca}
                  className="bg-red-400 text-white border-2 border-black px-3 py-1 font-black rounded-lg disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSaveBanca} className="space-y-3 mb-6">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Nome da Banca
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: CESPE / CEBRASPE"
                    value={bancaNome}
                    disabled={isSubmittingBanca}
                    onChange={(e) => setBancaNome(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white disabled:opacity-50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingBanca}
                    className="flex-1 bg-[#00D2DF] border-2 border-black rounded-xl py-3 font-black shadow-[3px_3px_0_black] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmittingBanca
                      ? "Salvando..."
                      : editingBancaId
                      ? "Atualizar Banca"
                      : "Cadastrar Banca"}
                  </button>
                  {editingBancaId && (
                    <button
                      type="button"
                      disabled={isSubmittingBanca}
                      onClick={() => {
                        setEditingBancaId(null);
                        setBancaNome("");
                      }}
                      className="bg-slate-200 border-2 border-black rounded-xl px-4 py-3 font-black disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
              <hr className="border-2 border-black mb-4" />
              <h4 className="font-black uppercase text-sm mb-2">
                Bancas Cadastradas
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {bancas.length === 0 ? (
                  <p className="text-sm font-bold text-slate-500">
                    Nenhuma banca cadastrada.
                  </p>
                ) : (
                  bancas.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border-2 border-black rounded-xl p-3 flex justify-between items-center gap-2"
                    >
                      <span className="font-bold text-sm truncate">
                        {item.nome || item.titulo}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleEditBanca(item)}
                          className="bg-[#FFD700] border-2 border-black px-2 py-1 text-xs font-black rounded-lg"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteBanca(item.id)}
                          className="bg-red-400 text-white border-2 border-black px-2 py-1 text-xs font-black rounded-lg"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE MÓDULOS DE UM CURSO */}
        {showModuloModal && selectedCursoForModulo && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-6 max-w-xl w-full shadow-[8px_8px_0_black] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-black uppercase">
                    Módulos do Curso
                  </h3>
                  <p className="text-xs font-bold text-slate-600">
                    {selectedCursoForModulo.titulo ||
                      selectedCursoForModulo.nome}
                  </p>
                </div>
                <button
                  onClick={() => setShowModuloModal(false)}
                  disabled={isSubmittingModulo}
                  className="bg-red-400 text-white border-2 border-black px-3 py-1 font-black rounded-lg disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
              <form
                onSubmit={handleSaveModulo}
                className="space-y-3 mb-6 bg-white p-4 border-2 border-black rounded-xl"
              >
                <h4 className="font-black text-sm uppercase">
                  {editingModuloId ? "Editar Módulo" : "Adicionar Novo Módulo"}
                </h4>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Título do Módulo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Introdução à Gramática"
                    value={moduloTitulo}
                    disabled={isSubmittingModulo}
                    onChange={(e) => setModuloTitulo(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-2 font-bold text-sm bg-slate-50 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Conceitos fundamentais"
                    value={moduloDescricao}
                    disabled={isSubmittingModulo}
                    onChange={(e) => setModuloDescricao(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-2 font-bold text-sm bg-slate-50 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Ordem
                  </label>
                  <input
                    type="number"
                    value={moduloOrdem}
                    disabled={isSubmittingModulo}
                    onChange={(e) => setModuloOrdem(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-2 font-bold text-sm bg-slate-50 disabled:opacity-50"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingModulo}
                    className="flex-1 bg-[#00D2DF] border-2 border-black rounded-xl py-2 font-black shadow-[2px_2px_0_black] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmittingModulo
                      ? "Salvando..."
                      : editingModuloId
                      ? "Atualizar Módulo"
                      : "Salvar Módulo"}
                  </button>
                  {editingModuloId && (
                    <button
                      type="button"
                      disabled={isSubmittingModulo}
                      onClick={() => {
                        setEditingModuloId(null);
                        setModuloTitulo("");
                        setModuloDescricao("");
                        setModuloOrdem(1);
                      }}
                      className="bg-slate-200 border-2 border-black rounded-xl px-3 py-2 font-black text-sm disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              <h4 className="font-black uppercase text-sm mb-2">
                Módulos Existentes
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {modulosDoCurso.length === 0 ? (
                  <p className="text-sm font-bold text-slate-500">
                    Nenhum módulo cadastrado neste curso.
                  </p>
                ) : (
                  modulosDoCurso.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white border-2 border-black rounded-xl p-3 flex justify-between items-center gap-2"
                    >
                      <div>
                        <span className="font-black text-sm">
                          #{m.ordem} - {m.titulo}
                        </span>
                        <p className="text-xs text-slate-500 font-bold">
                          {m.descricao}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleEditModulo(m)}
                          className="bg-[#FFD700] border-2 border-black px-2 py-1 text-xs font-black rounded-lg"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteModulo(m.id)}
                          className="bg-red-400 text-white border-2 border-black px-2 py-1 text-xs font-black rounded-lg"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE CURSO */}
        {showDeleteCursoModal && cursoParaExcluir && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-6 max-w-md w-full shadow-[8px_8px_0_black]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black uppercase text-red-600">
                  ⚠️ Excluir Curso
                </h3>
                <button
                  onClick={() => setShowDeleteCursoModal(false)}
                  disabled={isSubmittingDeleteCurso}
                  className="bg-red-400 text-white border-2 border-black px-3 py-1 font-black rounded-lg disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
              <p className="font-bold text-sm text-slate-700 mb-4">
                Esta ação é irreversível e excluirá permanentemente o curso e
                todos os seus dados associados.
              </p>
              <form onSubmit={handleConfirmDeleteCurso} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Digite o nome exato:{" "}
                    <span className="text-red-600">
                      "{cursoParaExcluir.nome || cursoParaExcluir.titulo}"
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nome exato do curso"
                    value={nomeConfirmacaoInput}
                    disabled={isSubmittingDeleteCurso}
                    onChange={(e) => setNomeConfirmacaoInput(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Senha de Administrador
                  </label>
                  <input
                    type="password"
                    placeholder="Sua senha de admin"
                    value={senhaAdminInput}
                    disabled={isSubmittingDeleteCurso}
                    onChange={(e) => setSenhaAdminInput(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingDeleteCurso}
                    className="flex-1 bg-red-500 text-white border-2 border-black rounded-xl py-3 font-black shadow-[3px_3px_0_black] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmittingDeleteCurso
                      ? "Excluindo..."
                      : "Confirmar Exclusão"}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingDeleteCurso}
                    onClick={() => setShowDeleteCursoModal(false)}
                    className="bg-slate-200 border-2 border-black rounded-xl px-4 py-3 font-black text-sm disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE QUESTÃO */}
        {showQuestionModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-6 max-w-2xl w-full shadow-[8px_8px_0_black] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black uppercase">
                  {editingQuestionId ? "📝 Editar Questão" : "📝 Nova Questão"}
                </h3>
                <button
                  onClick={handleResetQuestionForm}
                  disabled={isSubmittingQuestion}
                  className="bg-red-400 text-white border-2 border-black px-3 py-1 font-black rounded-lg disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSaveQuestion} className="space-y-4">
                <div>
                  <label className="block font-black text-sm mb-1">
                    Enunciado da Questão
                  </label>
                  <textarea
                    placeholder="Digite o enunciado completo da questão..."
                    value={questionStatement}
                    disabled={isSubmittingQuestion}
                    onChange={(e) => setQuestionStatement(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold text-sm bg-white disabled:opacity-50"
                    rows={4}
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-black text-sm mb-1">
                      Assunto
                    </label>
                    <select
                      value={questionAssuntoId}
                      disabled={isSubmittingQuestion}
                      onChange={(e) => setQuestionAssuntoId(e.target.value)}
                      className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                    >
                      <option value="">Selecione o Assunto</option>
                      {assuntos.map((assunto) => (
                        <option key={assunto.id} value={assunto.id}>
                          {assunto.nome ||
                            assunto.titulo ||
                            `Assunto ${assunto.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-black text-sm mb-1">
                      Banca
                    </label>
                    <select
                      value={questionBancaId}
                      disabled={isSubmittingQuestion}
                      onChange={(e) => setQuestionBancaId(e.target.value)}
                      className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                    >
                      <option value="">Selecione a Banca (Opcional)</option>
                      {bancas.map((banca) => (
                        <option key={banca.id} value={banca.id}>
                          {banca.nome || banca.titulo || `Banca ${banca.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-black text-sm mb-1">Ano</label>
                    <input
                      type="number"
                      value={questionAno}
                      disabled={isSubmittingQuestion}
                      onChange={(e) => setQuestionAno(e.target.value)}
                      className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-black text-sm mb-1">
                      Nível
                    </label>
                    <select
                      value={questionNivel}
                      disabled={isSubmittingQuestion}
                      onChange={(e) => setQuestionNivel(e.target.value)}
                      className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                    >
                      <option value="FACIL">Fácil</option>
                      <option value="MEDIO">Médio</option>
                      <option value="DIFICIL">Difícil</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-black text-sm mb-1">
                      Fonte
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Prova CESPE 2023"
                      value={questionFonte}
                      disabled={isSubmittingQuestion}
                      onChange={(e) => setQuestionFonte(e.target.value)}
                      className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block font-black text-sm mb-1">
                      Alternativa Correta
                    </label>
                    <select
                      value={correctAnswer}
                      disabled={isSubmittingQuestion}
                      onChange={(e) => {
                        const novaLetra = e.target.value;
                        setCorrectAnswer(novaLetra);
                        setalternativas(
                          alternativas.map((alt) => ({
                            ...alt,
                            correta: alt.letra === novaLetra,
                          }))
                        );
                      }}
                      className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                    >
                      <option value="A">Alternativa A</option>
                      <option value="B">Alternativa B</option>
                      <option value="C">Alternativa C</option>
                      <option value="D">Alternativa D</option>
                      <option value="E">Alternativa E</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-black text-sm mb-1">
                    Explicação
                  </label>
                  <textarea
                    placeholder="Explicação detalhada da resolução..."
                    value={questionExplicacao}
                    disabled={isSubmittingQuestion}
                    onChange={(e) => setQuestionExplicacao(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold text-sm bg-white disabled:opacity-50"
                    rows={2}
                  />
                </div>
                <div className="space-y-2 pt-2">
                  <label className="block font-black text-sm">
                    Alternativas (A, B, C, D, E)
                  </label>
                  {alternativas.map((alt, index) => (
                    <div key={alt.letra} className="flex items-center gap-2">
                      <span className="font-black w-6 text-center">
                        {alt.letra}
                      </span>
                      <input
                        placeholder={`Texto da alternativa ${alt.letra}`}
                        value={alt.texto}
                        disabled={isSubmittingQuestion}
                        onChange={(e) => {
                          const updated = [...alternativas];
                          updated[index].texto = e.target.value;
                          setalternativas(updated);
                        }}
                        className="w-full border-2 border-black rounded-xl p-2 font-bold text-sm bg-white disabled:opacity-50"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingQuestion}
                    className="flex-1 bg-[#00D2DF] border-2 border-black rounded-xl px-6 py-3 font-black shadow-[3px_3px_0_black] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmittingQuestion
                      ? "SALVANDO..."
                      : editingQuestionId
                      ? "ATUALIZAR QUESTÃO"
                      : "SALVAR QUESTÃO"}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingQuestion}
                    onClick={handleResetQuestionForm}
                    className="bg-slate-200 border-2 border-black rounded-xl px-6 py-3 font-black disabled:opacity-50"
                  >
                    CANCELAR
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* LISTAGEM DE CURSOS E FORMULÁRIOS LATERAIS */}
        <div className="grid xl:grid-cols-3 gap-6 mb-6">
          <Card className="xl:col-span-2 bg-[#F4EFE6] border-2 border-black rounded-2xl shadow-[6px_6px_0_black] p-6">
            <h2 className="font-black uppercase mb-5 text-xl">
              📂 Cursos Cadastrados ({cursos.length})
            </h2>
            <div className="space-y-4">
              {loadingCursos ? (
                <p className="font-bold text-slate-500">Carregando cursos...</p>
              ) : cursos.length === 0 ? (
                <p className="font-bold text-slate-500">
                  Nenhum curso cadastrado no banco de dados.
                </p>
              ) : (
                cursos.map((curso) => (
                  <div
                    key={curso.id}
                    className="bg-white border-2 border-black rounded-xl p-5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center"
                  >
                    <div>
                      <h3 className="font-black text-lg">
                        {curso.titulo || curso.nome}
                      </h3>
                      <p className="text-sm font-bold text-slate-600">
                        {curso.descricao}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="bg-[#FFD700] border-2 border-black px-2.5 py-0.5 text-xs font-black rounded-lg">
                          Preço: R${" "}
                          {curso.preco ? curso.preco.toFixed(2) : "0.00"}
                        </span>
                        {curso.dataTermino && (
                          <span className="bg-[#00D2DF] border-2 border-black px-2.5 py-0.5 text-xs font-black rounded-lg">
                            Término: {curso.dataTermino}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenModulosModal(curso)}
                        className="bg-[#00D2DF] border-2 border-black px-3 py-1.5 text-xs font-black rounded-xl shadow-[2px_2px_0_black]"
                      >
                        Gerenciar Módulos
                      </button>
                      <button
                        onClick={() => handleDeleteCurso(curso)}
                        className="bg-red-400 text-white border-2 border-black px-3 py-1.5 text-xs font-black rounded-xl shadow-[2px_2px_0_black]"
                      >
                        Excluir Curso
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* PAINEL LATERAL (NOVO CURSO E NOVA AULA) */}
          <div className="flex flex-col gap-6">
            {/* Formulário Novo Curso */}
            <Card className="bg-[#F4EFE6] border-2 border-black rounded-2xl shadow-[6px_6px_0_black] p-6">
              <h2 className="font-black uppercase mb-5 text-xl">Novo Curso</h2>
              <form onSubmit={handleCreateModule} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Nome do Curso
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Português Avançado"
                    value={newModuleTitle}
                    disabled={isSubmittingCourse}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Descrição
                  </label>
                  <textarea
                    placeholder="Descrição detalhada do curso..."
                    value={newModuleDescription}
                    disabled={isSubmittingCourse}
                    onChange={(e) => setNewModuleDescription(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 199.90"
                    value={newModulePrice}
                    disabled={isSubmittingCourse}
                    onChange={(e) => setNewModulePrice(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Data de Término
                  </label>
                  <input
                    type="date"
                    value={newModuleDataTermino}
                    disabled={isSubmittingCourse}
                    onChange={(e) => setNewModuleDataTermino(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingCourse}
                  className="w-full bg-[#7B5CFA] text-white border-2 border-black rounded-xl py-3 font-black shadow-[3px_3px_0_black] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmittingCourse ? "Cadastrando..." : "Cadastrar Curso"}
                </button>
              </form>
            </Card>

            {/* Formulário Nova Aula com Link Direto do Vídeo */}
            <Card className="bg-[#F4EFE6] border-2 border-black rounded-2xl shadow-[6px_6px_0_black] p-6">
              <h2 className="font-black uppercase mb-5 text-xl">Nova Aula</h2>
              <form onSubmit={handleCreateAula} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Selecione o Curso
                  </label>
                  <select
                    value={selectedCursoForAula}
                    disabled={isSubmittingVideo}
                    onChange={(e) => handleCursoAulaChange(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                  >
                    <option value="">Escolha o curso...</option>
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.titulo || c.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Selecione o Módulo
                  </label>
                  <select
                    value={selectedModuloForAula}
                    onChange={(e) => setSelectedModuloForAula(e.target.value)}
                    disabled={
                      isSubmittingVideo ||
                      !selectedCursoForAula ||
                      modulosDisponiveisParaAula.length === 0
                    }
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:bg-slate-100 disabled:opacity-50"
                  >
                    <option value="">Escolha o módulo...</option>
                    {modulosDisponiveisParaAula.map((m) => (
                      <option key={m.id} value={m.id}>
                        #{m.ordem} - {m.titulo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Título da Aula
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Introdução aos Verbos"
                    value={aulaTitulo}
                    disabled={isSubmittingVideo}
                    onChange={(e) => setAulaTitulo(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Ordem da Aula
                  </label>
                  <input
                    type="number"
                    value={aulaOrdem}
                    disabled={isSubmittingVideo}
                    onChange={(e) => setAulaOrdem(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Link do Vídeo da Aula
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: https://youtube.com/watch?v=..."
                    value={aulaLinkVideo}
                    disabled={isSubmittingVideo}
                    onChange={(e) => setAulaLinkVideo(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white text-sm disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingVideo}
                  className="w-full bg-[#00D2DF] text-black border-2 border-black rounded-xl py-3 font-black shadow-[3px_3px_0_black] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmittingVideo ? "Cadastrando Aula..." : "Cadastrar Aula"}
                </button>
              </form>
            </Card>
          </div>
        </div>

        {/* LISTAGEM DE QUESTÕES COM PAGINAÇÃO */}
        <Card className="bg-[#F4EFE6] border-2 border-black rounded-2xl shadow-[6px_6px_0_black] p-6">
          <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
            <h2 className="font-black uppercase text-xl">
              Questões Cadastradas ({totalElements})
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowAssuntoModal(true)}
                className="bg-[#FFD700] border-2 border-black px-4 py-2 font-black rounded-xl shadow-[3px_3px_0_black] text-sm"
              >
                Gerenciar Assuntos
              </button>
              <button
                onClick={() => setShowBancaModal(true)}
                className="bg-[#00D2DF] border-2 border-black px-4 py-2 font-black rounded-xl shadow-[3px_3px_0_black] text-sm"
              >
                Gerenciar Bancas
              </button>
              <button
                onClick={handleOpenCreateQuestion}
                className="bg-[#7B5CFA] text-white border-2 border-black px-4 py-2 font-black rounded-xl shadow-[3px_3px_0_black] text-sm"
              >
                + Nova Questão
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {loadingQuestions ? (
              <p className="font-bold text-slate-500">Carregando questões...</p>
            ) : questions.length === 0 ? (
              <p className="font-bold text-slate-500">
                Nenhuma questão cadastrada no banco de dados.
              </p>
            ) : (
              questions.map((q) => (
                <div
                  key={q.id}
                  className="bg-white border-2 border-black rounded-xl p-5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-[#00D2DF] border-2 border-black px-2 py-0.5 text-xs font-black rounded-lg">
                        ID: {q.id}
                      </span>
                      <span className="bg-[#FFD700] border-2 border-black px-2 py-0.5 text-xs font-black rounded-lg">
                        Ano: {q.ano}
                      </span>
                      <span className="bg-slate-200 border-2 border-black px-2 py-0.5 text-xs font-black rounded-lg">
                        Nível: {q.nivel}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-slate-800 line-clamp-2 mt-2">
                      {q.enunciado}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      onClick={() => handleEditQuestion(q)}
                      className="bg-[#FFD700] border-2 border-black px-3 py-1.5 text-xs font-black rounded-xl shadow-[2px_2px_0_black]"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="bg-red-400 text-white border-2 border-black px-3 py-1.5 text-xs font-black rounded-xl shadow-[2px_2px_0_black]"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* CONTROLES DE PAGINAÇÃO */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t-2 border-black flex-wrap gap-4">
              <button
                onClick={() => fetchQuestions(currentPage - 1)}
                disabled={currentPage === 0 || loadingQuestions}
                className="bg-white border-2 border-black px-4 py-2 font-black text-sm rounded-xl shadow-[2px_2px_0_black] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Página Anterior
              </button>

              <span className="font-black text-sm">
                Página {currentPage + 1} de {totalPages}
              </span>

              <button
                onClick={() => fetchQuestions(currentPage + 1)}
                disabled={currentPage + 1 >= totalPages || loadingQuestions}
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
