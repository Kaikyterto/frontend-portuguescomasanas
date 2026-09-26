import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Card from "../components/Card";
import { listar as listarQuestoes } from "../service/questao";
import { listar as listarCursos } from "../service/curso";
import { listar as listarUsuarios } from "../service/user";
import { gravacaoService } from "../service/gravacao";
import { buscarDadosUsuarioLogado } from "../service/user";
import { links } from "../ultils/linksAdmin";

export default function AdminPage() {
  const [totalQuestoes, setTotalQuestoes] = useState(0);
  const [totalModulos, setTotalModulos] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [totalAulas, setTotalAulas] = useState(0);

  // Estados para contadores de hoje
  const [usuariosHoje, setUsuariosHoje] = useState(0);
  const [aulasHoje, setAulasHoje] = useState(0);
  const [questoesHoje, setQuestoesHoje] = useState(0);

  const [usuario, setUsuario] = useState(null);
  const [dadosCrescimento, setDadosCrescimento] = useState(Array(12).fill(0));

  useEffect(() => {
    async function carregarDados() {
      try {
        const token = localStorage.getItem("@PortuguessComAnas:token");

        const [questoes, cursos, usuarios, gravacoes, dadosUsuario] =
          await Promise.all([
            listarQuestoes(token),
            listarCursos(token),
            listarUsuarios(token),
            gravacaoService.listar(token),
            buscarDadosUsuarioLogado(token),
          ]);

        setTotalQuestoes(questoes.length);
        setTotalModulos(cursos.length);
        setTotalUsuarios(usuarios.length);
        setTotalAulas(gravacoes.length);
        setUsuario(dadosUsuario);

        // Data de hoje zerando as horas para comparação exata de dia/mês/ano
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        // Função utilitária para verificar se uma data string é igual ao dia de hoje
        const ehHoje = (dataStr) => {
          if (!dataStr) return false;
          const dataItem = new Date(dataStr);
          if (isNaN(dataItem.getTime())) return false;
          dataItem.setHours(0, 0, 0, 0);
          return dataItem.getTime() === hoje.getTime();
        };

        // Filtros de Atividade de Hoje
        let uHoje = 0;
        let aHoje = 0;
        let qHoje = 0;

        // Processa as datas de cadastro para o gráfico mensal e contagem de hoje de usuários
        const contagemMeses = Array(12).fill(0);

        usuarios.forEach((user) => {
          const dataStr = user.created_at || user.createdAt || user.dataCriacao;
          if (ehHoje(dataStr)) {
            uHoje++;
          }
          if (dataStr) {
            const data = new Date(dataStr);
            if (!isNaN(data.getTime())) {
              const mes = data.getMonth(); // 0 = Jan, 11 = Dez
              contagemMeses[mes]++;
            }
          }
        });

        // Contagem de aulas (gravações) criadas hoje
        gravacoes.forEach((aula) => {
          const dataStr =
            aula.cadastradaEm ||
            aula.created_at ||
            aula.createdAt ||
            aula.dataCriacao;
          if (ehHoje(dataStr)) {
            aHoje++;
          }
        });

        // Contagem de questões criadas hoje
        questoes.forEach((questao) => {
          const dataStr =
            questao.created_at || questao.createdAt || questao.dataCriacao;
          if (ehHoje(dataStr)) {
            qHoje++;
          }
        });

        setUsuariosHoje(uHoje);
        setAulasHoje(aHoje);
        setQuestoesHoje(qHoje);
        setDadosCrescimento(contagemMeses);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      }
    }

    carregarDados();
  }, []);

  const stats = [
    {
      icon: "👨‍🎓",
      title: "Alunos",
      value: totalUsuarios.toLocaleString("pt-BR"),
    },
    {
      icon: "📚",
      title: "Cursos",
      value: totalModulos.toLocaleString("pt-BR"),
    },
    {
      icon: "🎬",
      title: "Aulas",
      value: totalAulas.toLocaleString("pt-BR"),
    },
    {
      icon: "❓",
      title: "Questões",
      value: totalQuestoes.toLocaleString("pt-BR"),
    },
  ];

  const labels = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const maxMes = Math.max(...dadosCrescimento, 1);
  const alturaMaximaCss = 140;

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex flex-col">
      <Navbar links={links} usuario={usuario} />

      <main className="flex-1 p-5 md:p-8 bg-gradient-to-br from-[#00D2DF] via-[#7B5CFA] to-[#FF42DE]">
        <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-6 shadow-[6px_6px_0_black] mb-6">
          <h1 className="text-3xl font-black uppercase">
            Bem-vindo ao painel admin!
          </h1>
          <p className="font-bold text-slate-600">Visão geral da plataforma</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {stats.map((item) => (
            <Card
              key={item.title}
              className="bg-[#F4EFE6] border-2 border-black rounded-2xl shadow-[5px_5px_0_black] hover:-translate-y-1 transition"
            >
              <div className="text-3xl">{item.icon}</div>
              <p className="text-xs font-black uppercase text-slate-500 mt-4">
                {item.title}
              </p>
              <h2 className="text-3xl font-black">{item.value}</h2>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-[#F4EFE6] border-2 border-black rounded-2xl shadow-[6px_6px_0_black]">
            <h2 className="font-black mb-5">
              📊 Crescimento de alunos por mês
            </h2>
            <div className="h-60 flex items-end gap-2 border-l-2 border-b-2 border-black p-4">
              {dadosCrescimento.map((quantidade, i) => {
                const alturaCalculada = Math.max(
                  (quantidade / maxMes) * alturaMaximaCss,
                  quantidade > 0 ? 15 : 4
                );

                return (
                  <div
                    className="flex-1 h-full flex flex-col justify-end items-center gap-2 group relative"
                    key={i}
                  >
                    <span className="text-[11px] font-black text-slate-800 bg-white/80 border border-black/20 px-1 rounded shadow-sm">
                      {quantidade}
                    </span>
                    <span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition bg-black text-white text-[10px] font-black py-0.5 px-1.5 rounded pointer-events-none z-10 whitespace-nowrap">
                      {quantidade} aluno(s)
                    </span>

                    <div
                      className="w-full bg-[#00D2DF] border-2 border-black rounded-t-xl transition-all duration-300"
                      style={{ height: `${alturaCalculada}px` }}
                    />
                    <span className="text-[10px] font-black">{labels[i]}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="bg-[#F4EFE6] border-2 border-black rounded-2xl shadow-[6px_6px_0_black]">
            <h2 className="font-black mb-4">Atividade hoje</h2>
            <div className="space-y-3">
              <div className="bg-white border-2 border-black rounded-xl p-4 font-black">
                👨‍🎓 {usuariosHoje} usuário(s) cadastrado(s) hoje
              </div>
              <div className="bg-white border-2 border-black rounded-xl p-4 font-black">
                ▶️ {aulasHoje} aula(s) assistida(s) hoje
              </div>
              <div className="bg-white border-2 border-black rounded-xl p-4 font-black">
                📝 {questoesHoje} questão(ões) respondida(s) hoje
              </div>
            </div>
          </Card>
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
    </div>
  );
}
