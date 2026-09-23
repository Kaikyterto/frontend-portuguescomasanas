import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Card from "../components/Card";
import { buscarDadosUsuarioLogado } from "../service/user";
import { cursoService } from "../service/curso";
import { moduloService } from "../service/module";

export default function CursePage() {
  const navigate = useNavigate();
  const { id: cursoId } = useParams();
  const [usuario, setUsuario] = useState(null);
  const [cursoData, setCursoData] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // Estado para controlar qual módulo está expandido
  const [moduloAtivo, setModuloAtivo] = useState(null);

  useEffect(() => {
    async function carregarDadosPagina() {
      const token = localStorage.getItem("@PortuguessComAnas:token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        // Busca simultaneamente os dados do usuário, do curso e os módulos específicos via moduloService
        const [dadosUsuario, dadosCurso, dadosModulos] = await Promise.all([
          buscarDadosUsuarioLogado(token),
          cursoService.buscarPorId(cursoId, token),
          moduloService.listarModulos(cursoId, token),
        ]);

        setUsuario(dadosUsuario);
        setCursoData(dadosCurso);
        setModulos(dadosModulos);

        // Se houver módulos, define o primeiro da lista como ativo por padrão
        if (dadosModulos && dadosModulos.length > 0) {
          setModuloAtivo(dadosModulos[0].id);
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

  const toggleModulo = (id) => {
    setModuloAtivo(moduloAtivo === id ? null : id);
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
        {/* Barra superior de navegação */}
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="bg-white text-black text-xs font-black px-3.5 sm:px-4 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer flex items-center gap-2"
          >
            ← VOLTAR AO PAINEL
          </button>
        </div>

        {/* Cabeçalho e Conteúdo do Curso */}
        <div className="max-w-4xl w-full mx-auto flex flex-col gap-4 sm:gap-6">
          <Card className="bg-[#F4EFE6] !p-4 sm:!p-6 md:!p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl sm:rounded-2xl flex flex-col gap-4 sm:gap-6">
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

            {/* Barra de Progresso Geral do Curso (Caso a API retorne) */}
            {cursoData.progressoGeral !== undefined && (
              <div className="bg-white p-3 sm:p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-black uppercase text-slate-800 gap-1 sm:gap-0">
                  <span>Progresso Total do Curso</span>
                  <span>{cursoData.progressoGeral}% Concluído</span>
                </div>
                <div className="w-full bg-slate-200 h-3.5 sm:h-4 rounded-full border-2 border-black overflow-hidden">
                  <div
                    className="bg-[#00D2DF] h-full transition-all duration-500"
                    style={{ width: `${cursoData.progressoGeral}%` }}
                  ></div>
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

                    return (
                      <div
                        key={modulo.id}
                        className="bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition"
                      >
                        {/* Cabeçalho do Módulo */}
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
                              <p className="text-[11px] sm:text-xs font-bold text-slate-500 line-clamp-1 sm:line-clamp-none">
                                {modulo.descricao ||
                                  "Módulo estruturado do curso"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center self-end sm:self-auto gap-2">
                            <span className="text-[10px] sm:text-xs font-black bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-black">
                              {isOpen ? "▲ Ocultar" : "▼ Ver Detalhes"}
                            </span>
                          </div>
                        </div>

                        {/* Detalhes do Módulo (Expandido) */}
                        {isOpen && (
                          <div className="bg-slate-50 p-3 sm:p-4 border-t-2 border-black flex flex-col gap-3">
                            <div className="bg-white p-3 rounded-lg border-2 border-black flex flex-col gap-2">
                              <span className="text-[10px] sm:text-xs font-black uppercase text-[#7B5CFA]">
                                Sobre este módulo:
                              </span>
                              <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                                {modulo.descricao ||
                                  "Nenhuma descrição detalhada informada para este módulo."}
                              </p>
                              {modulo.dataCriacao && (
                                <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-1">
                                  Cadastrado em:{" "}
                                  {new Date(
                                    modulo.dataCriacao
                                  ).toLocaleDateString("pt-BR")}
                                </div>
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

      <footer className="bg-[#F4EFE6] py-4 text-center text-[11px] sm:text-xs font-bold text-slate-700 border-t-2 border-black">
        Português com Anas © 2026 - Todos os direitos reservados
      </footer>
    </div>
  );
}
