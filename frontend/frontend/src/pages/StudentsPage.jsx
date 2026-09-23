import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Card from "../components/Card";
import AlertModal from "../components/AlertModal";
import { links } from "../ultils/linksAdmin";
import {
  listar as listarUsuarios,
  buscarDadosUsuarioLogado,
} from "../service/user";
import { cursoService } from "../service/curso";
import { listarMinhasRespostas } from "../service/answer";

export default function StudentsPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("@PortuguessComAnas:token");

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erroAuth, setErroAuth] = useState("");

  const [courses, setCourses] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedUserToEnroll, setSelectedUserToEnroll] = useState("");

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "success",
    message: "",
    onConfirm: null,
  });

  const fetchCourses = async (authToken) => {
    try {
      const coursesData = await cursoService.listar(authToken);
      setCourses(coursesData || []);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
    }
  };

  const fetchAllUsers = async (authToken) => {
    try {
      const data = await listarUsuarios(authToken);
      setAllUsers(data || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  useEffect(() => {
    async function verificarAutenticacao() {
      if (!token) {
        setErroAuth("Acesso negado. Redirecionando para a página de login...");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      try {
        setLoading(true);
        const dadosUsuario = await buscarDadosUsuarioLogado(token);
        setUsuario(dadosUsuario);

        await Promise.all([fetchCourses(token), fetchAllUsers(token)]);
      } catch (error) {
        console.error("Erro de autenticação:", error);
        localStorage.removeItem("@PortuguessComAnas:token");
        setErroAuth("Sessão expirada. Faça login novamente.");
        setTimeout(() => navigate("/login"), 2000);
      } finally {
        setLoading(false);
      }
    }

    verificarAutenticacao();
  }, [navigate, token]);

  const handleOpenCourseDetails = async (course) => {
    setSelectedCourse(course);
    setLoadingStudents(true);
    try {
      const courseId = course.id || course._id;
      const alunosMatriculas = await cursoService.listarAlunosDoCurso(
        courseId,
        token
      );
      setEnrolledStudents(alunosMatriculas || []);
    } catch (error) {
      console.error("Erro ao carregar alunos do curso:", error);
      setEnrolledStudents([]);
      setModalConfig({
        isOpen: true,
        type: "error",
        message:
          error.message || "Erro ao carregar alunos matriculados neste curso.",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenStudentDetails = async (matriculaItem) => {
    const studentId =
      matriculaItem.usuarioId ||
      matriculaItem.id ||
      matriculaItem._id ||
      matriculaItem.usuario?.id ||
      matriculaItem.aluno?.id;

    const fullUser = allUsers.find(
      (u) => String(u.id || u._id) === String(studentId)
    );

    const studentName =
      matriculaItem.nomeUsuario ||
      matriculaItem.nome ||
      matriculaItem.usuario?.nome ||
      fullUser?.nome ||
      "Aluno sem nome";

    const studentEmail =
      matriculaItem.emailUsuario ||
      matriculaItem.email ||
      matriculaItem.usuario?.email ||
      fullUser?.email ||
      "E-mail não informado";

    const targetStudent = fullUser || {
      id: studentId,
      nome: studentName,
      email: studentEmail,
    };

    setSelectedStudent({
      ...targetStudent,
      nome: studentName,
      email: studentEmail,
      courses: [
        selectedCourse?.titulo || selectedCourse?.nome || "Curso atual",
      ],
      joinedDate: targetStudent.joinedDate || "Não informado",
      lastActive: targetStudent.lastActive || "Não informado",
      lessonsWatched: targetStudent.lessonsWatched ?? 0,
      questionsAnswered: 0,
      correctRate: "0%",
      correctCount: 0,
      wrongCount: 0,
      respostasDetalhadas: [],
      progress: "0%",
    });

    setLoadingStudentDetails(true);

    try {
      const todasRespostasGerais = await listarMinhasRespostas(token);

      const respostasAluno = (todasRespostasGerais || []).filter(
        (r) =>
          String(r.usuarioId || r.userId || r.alunoId || r.aluno?.id) ===
          String(studentId)
      );

      const totalRespondidas = respostasAluno.length;
      const acertos = respostasAluno.filter((r) => r.acertou === true).length;
      const erros = totalRespondidas - acertos;
      const taxaAcertoNum =
        totalRespondidas > 0
          ? Math.round((acertos / totalRespondidas) * 100)
          : 0;

      setSelectedStudent((prev) => ({
        ...prev,
        questionsAnswered: totalRespondidas,
        correctCount: acertos,
        wrongCount: erros,
        correctRate: `${taxaAcertoNum}%`,
        progress: `${taxaAcertoNum}%`,
        respostasDetalhadas: respostasAluno,
      }));
    } catch (error) {
      console.error("Erro ao carregar respostas específicas do aluno:", error);
    } finally {
      setLoadingStudentDetails(false);
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      (course.titulo &&
        course.titulo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.nome &&
        course.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!selectedUserToEnroll || !selectedCourse) return;

    const courseId = selectedCourse.id || selectedCourse._id;

    try {
      await cursoService.matricular(courseId, selectedUserToEnroll, token);
      const alunosAtualizados = await cursoService.listarAlunosDoCurso(
        courseId,
        token
      );
      setEnrolledStudents(alunosAtualizados || []);

      setSelectedUserToEnroll("");
      setIsEnrollModalOpen(false);
      setModalConfig({
        isOpen: true,
        type: "success",
        message: "Aluno matriculado com sucesso!",
      });
    } catch (error) {
      setModalConfig({
        isOpen: true,
        type: "error",
        message: error.message || "Erro ao matricular aluno.",
      });
    }
  };

  const handleRemoveEnrollment = (usuarioId, studentName) => {
    const courseId = selectedCourse.id || selectedCourse._id;

    setModalConfig({
      isOpen: true,
      type: "confirm",
      message: `Deseja realmente remover o acesso do aluno "${studentName}" deste curso?`,
      onConfirm: async () => {
        try {
          await cursoService.removerMatricula(courseId, usuarioId, token);

          setEnrolledStudents((prev) =>
            prev.filter(
              (s) =>
                Number(s.usuarioId || s.id || s._id || s.usuario?.id) !==
                Number(usuarioId)
            )
          );

          setModalConfig({
            isOpen: true,
            type: "success",
            message: "Acesso removido com sucesso!",
          });
        } catch (error) {
          setModalConfig({
            isOpen: true,
            type: "error",
            message: error.message || "Erro ao remover matrícula.",
          });
        }
      },
    });
  };

  if (loading && !erroAuth) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center">
        <h1 className="text-2xl font-black text-slate-900 animate-pulse uppercase tracking-wider">
          Carregando painel...
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
    <div className="min-h-screen bg-[#F4EFE6] flex flex-col relative font-sans">
      <Navbar usuario={usuario} links={links} />

      <main className="flex-1 p-5 md:p-8 bg-gradient-to-br from-[#00D2DF] via-[#7B5CFA] to-[#FF42DE]">
        <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-6 shadow-[6px_6px_0_black] mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase">
              Gerenciar Cursos e Alunos
            </h1>
            <p className="font-bold text-slate-600">
              Selecione um curso para ver os matriculados e acessar os insights
              individuais.
            </p>
          </div>

          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Buscar curso por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white shadow-[3px_3px_0_black] focus:outline-none"
            />
          </div>
        </div>

        <Card className="bg-[#F4EFE6] border-2 border-black rounded-2xl shadow-[6px_6px_0_black]">
          <h2 className="font-black uppercase mb-5">
            Cursos Disponíveis ({filteredCourses.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.map((course) => (
              <div
                key={course.id || course._id}
                className="bg-white border-2 border-black rounded-xl p-5 flex flex-col justify-between gap-4 transition shadow-[3px_3px_0_black]"
              >
                <div>
                  <h3 className="font-black text-lg text-slate-900 mb-1">
                    📘 {course.titulo || course.nome}
                  </h3>
                  <p className="text-sm font-bold text-slate-500 line-clamp-2">
                    {course.descricao || "Sem descrição informada."}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenCourseDetails(course)}
                  className="w-full bg-[#7B5CFA] text-white border-2 border-black rounded-xl px-4 py-2.5 font-black shadow-[3px_3px_0_black] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer text-center"
                >
                  Ver Alunos Matriculados 👥
                </button>
              </div>
            ))}
          </div>
        </Card>
      </main>

      {/* Modal de Alunos do Curso */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl my-auto">
            <Card className="bg-[#F4EFE6] border-2 border-black rounded-2xl shadow-[8px_8px_0_black] p-6 max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="flex justify-between items-start mb-4 border-b-2 border-black pb-3">
                <div>
                  <span className="text-xs font-black bg-[#00D2DF] border border-black px-2 py-0.5 rounded uppercase">
                    Curso Selecionado
                  </span>
                  <h2 className="font-black uppercase text-xl mt-1">
                    {selectedCourse.titulo || selectedCourse.nome}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="bg-white border-2 border-black rounded-lg px-3 py-1 font-black hover:bg-rose-400 shadow-[2px_2px_0_black] transition cursor-pointer"
                >
                  Fechar X
                </button>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-sm uppercase text-slate-700">
                  📚 Alunos Matriculados ({enrolledStudents.length})
                </h3>
                <button
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="bg-[#00D2DF] text-black border-2 border-black rounded-lg px-3 py-1.5 text-xs font-black shadow-[2px_2px_0_black] transition cursor-pointer"
                >
                  + Matricular Aluno
                </button>
              </div>

              {loadingStudents ? (
                <p className="text-center font-bold py-8 animate-pulse text-slate-600">
                  Carregando alunos...
                </p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1 mb-4">
                  {enrolledStudents.length > 0 ? (
                    enrolledStudents.map((matricula) => {
                      // Garantindo a captura correta do ID do usuário correspondente à matrícula
                      const studentId =
                        matricula.usuarioId ||
                        matricula.usuario?.id ||
                        matricula.aluno?.id;

                      const fullUser = allUsers.find(
                        (u) => String(u.id || u._id) === String(studentId)
                      );
                      const studentName =
                        matricula.nomeUsuario ||
                        matricula.nome ||
                        fullUser?.nome ||
                        "Aluno";
                      const studentEmail =
                        matricula.emailUsuario ||
                        matricula.email ||
                        fullUser?.email ||
                        "E-mail";

                      return (
                        <div
                          key={matricula.id || studentId || Math.random()}
                          className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border-2 border-black rounded-xl p-3 shadow-[3px_3px_0_black] gap-3"
                        >
                          <div>
                            <p className="font-black text-sm text-slate-800">
                              {studentName}
                            </p>
                            <p className="text-xs font-bold text-slate-500">
                              {studentEmail}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            <button
                              onClick={() =>
                                handleOpenStudentDetails(matricula)
                              }
                              className="bg-[#7B5CFA] text-white border-2 border-black px-2.5 py-1 rounded-lg text-xs font-black shadow-[2px_2px_0_black] hover:shadow-none transition cursor-pointer"
                            >
                              Ver Detalhes 🔍
                            </button>
                            <button
                              onClick={() =>
                                handleRemoveEnrollment(studentId, studentName)
                              }
                              className="bg-rose-400 text-black border-2 border-black px-2.5 py-1 rounded-lg text-xs font-black shadow-[2px_2px_0_black] hover:shadow-none transition cursor-pointer"
                            >
                              Remover Acesso
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs font-bold text-slate-500 text-center py-6 bg-white border-2 border-dashed border-black rounded-xl">
                      Nenhum aluno matriculado.
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Modal de Insights Individuais do Aluno */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl my-auto">
            <Card className="bg-[#F4EFE6] border-2 border-black rounded-2xl shadow-[8px_8px_0_black] p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4 border-b-2 border-black pb-3">
                <div>
                  <span className="text-xs font-black bg-[#FF42DE] text-white border border-black px-2 py-0.5 rounded uppercase">
                    Painel de Insights
                  </span>
                  <h2 className="font-black uppercase text-xl mt-1">
                    📊 {selectedStudent.nome}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="bg-white border-2 border-black rounded-lg px-3 py-1 font-black hover:bg-rose-400 shadow-[2px_2px_0_black] transition cursor-pointer"
                >
                  Fechar X
                </button>
              </div>

              {/* Informações básicas */}
              <div className="bg-white border-2 border-black rounded-xl p-4 mb-4 shadow-[3px_3px_0_black] space-y-1">
                <p className="text-xs font-black text-slate-400 uppercase">
                  E-mail
                </p>
                <p className="font-bold text-sm text-slate-700">
                  {selectedStudent.email}
                </p>
              </div>

              {loadingStudentDetails ? (
                <div className="py-12 text-center font-black text-slate-600 animate-pulse">
                  Buscando respostas e calculando insights do aluno...
                </div>
              ) : (
                <>
                  {/* Estatísticas e Desempenho (Insights) */}
                  <h3 className="font-black text-xs uppercase text-slate-700 mb-2">
                    Desempenho em Questões
                  </h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white border-2 border-black rounded-xl p-3 font-black text-center shadow-[3px_3px_0_black]">
                      <span className="text-xs text-slate-500 block">
                        Respondidas
                      </span>
                      <span className="text-xl text-slate-800">
                        {selectedStudent.questionsAnswered}
                      </span>
                    </div>
                    <div className="bg-emerald-100 border-2 border-black rounded-xl p-3 font-black text-center shadow-[3px_3px_0_black]">
                      <span className="text-xs text-emerald-800 block">
                        Acertos
                      </span>
                      <span className="text-xl text-emerald-900">
                        {selectedStudent.correctCount}
                      </span>
                    </div>
                    <div className="bg-rose-100 border-2 border-black rounded-xl p-3 font-black text-center shadow-[3px_3px_0_black]">
                      <span className="text-xs text-rose-800 block">Erros</span>
                      <span className="text-xl text-rose-900">
                        {selectedStudent.wrongCount}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="bg-white border-2 border-black rounded-xl p-4 font-black flex justify-between items-center shadow-[3px_3px_0_black]">
                      <span>🏆 Taxa de Aproveitamento (Acertos):</span>
                      <span className="bg-[#00D2DF] border-2 border-black rounded-lg px-3 py-1 text-sm text-black shadow-[2px_2px_0_black]">
                        {selectedStudent.correctRate}
                      </span>
                    </div>

                    <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0_black]">
                      <div className="flex justify-between font-black text-xs uppercase mb-1">
                        <span>Progresso Baseado em Acertos</span>
                        <span>{selectedStudent.progress}</span>
                      </div>
                      <div className="w-full bg-slate-200 border-2 border-black h-4 rounded-full overflow-hidden">
                        <div
                          className="bg-[#7B5CFA] h-full"
                          style={{ width: selectedStudent.progress }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Histórico de Respostas Detalhado do Aluno */}
                  <div className="bg-white border-2 border-black rounded-xl p-4 mb-5 shadow-[3px_3px_0_black]">
                    <h3 className="font-black text-xs uppercase text-slate-700 mb-2">
                      📝 Histórico de Respostas do Aluno (
                      {selectedStudent.respostasDetalhadas?.length || 0})
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {selectedStudent.respostasDetalhadas &&
                      selectedStudent.respostasDetalhadas.length > 0 ? (
                        selectedStudent.respostasDetalhadas.map((resp, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-[#F4EFE6] border border-black rounded-lg p-2.5 text-xs font-bold"
                          >
                            <span>
                              Questão ID: {resp.questaoId || resp.id || "N/A"}
                            </span>
                            <span
                              className={
                                resp.acertou
                                  ? "text-emerald-700 font-black"
                                  : "text-rose-700 font-black"
                              }
                            >
                              {resp.acertou ? "Acertou ✅" : "Errou ❌"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs font-bold text-slate-400 text-center py-4">
                          Nenhum registro de resposta encontrado para este aluno
                          na API.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={() => setSelectedStudent(null)}
                className="w-full bg-black text-white border-2 border-black rounded-xl py-2.5 text-xs font-black shadow-[3px_3px_0_black] hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
              >
                Fechar Painel de Insights
              </button>
            </Card>
          </div>
        </div>
      )}

      {/* Modal de Matrícula */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm">
            <Card className="bg-[#F4EFE6] border-2 border-black rounded-2xl shadow-[8px_8px_0_black] p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black uppercase text-sm">
                  📘 Matricular Aluno
                </h3>
                <button
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="bg-white border-2 border-black rounded-lg px-2 py-0.5 text-xs font-black"
                >
                  X
                </button>
              </div>

              <form onSubmit={handleEnrollStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                    Selecione o Aluno:
                  </label>
                  <select
                    value={selectedUserToEnroll}
                    onChange={(e) => setSelectedUserToEnroll(e.target.value)}
                    required
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white shadow-[3px_3px_0_black] focus:outline-none text-sm cursor-pointer"
                  >
                    <option value="" disabled>
                      Escolha um usuário...
                    </option>
                    {allUsers.map((user) => (
                      <option
                        key={user.id || user._id}
                        value={user.id || user._id}
                      >
                        {user.nome} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#00D2DF] text-black border-2 border-black rounded-xl py-2.5 text-xs font-black shadow-[3px_3px_0_black]"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEnrollModalOpen(false)}
                    className="bg-white text-black border-2 border-black rounded-xl px-3 py-2.5 text-xs font-black shadow-[3px_3px_0_black]"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        message={modalConfig.message}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
}
