import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo-sem-fundo.png";
import { register } from "../service/register";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    aceitouTermos: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // ESTADO ADICIONADO PARA SUCESSO

  // Estados para controle do Modal e da validação real de leitura
  const [modalAberto, setModalAberto] = useState(false);
  const [termoRealmenteLido, setTermoRealmenteLido] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Se tentar marcar a caixinha direto sem ter lido, limpa erros anteriores e abre o modal
    if (type === "checkbox" && name === "termos" && !termoRealmenteLido) {
      setErrorMessage("");
      setModalAberto(true);
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Limpa as mensagens conforme o usuário digita ou altera os campos
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  };

  const handleAceitarPeloModal = () => {
    setTermoRealmenteLido(true);
    setForm((prev) => ({ ...prev, termos: true }));
    setErrorMessage("");
    setModalAberto(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage(""); // Limpa mensagens anteriores

    if (form.senha !== form.confirmarSenha) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    // Bloqueio definitivo se não abriu o termo
    if (!termoRealmenteLido || !form.termos) {
      setErrorMessage(
        "Para se cadastrar, você precisa abrir e aceitar o Termo de Consentimento."
      );
      setModalAberto(true);
      return;
    }

    try {
      setLoading(true);

      await register({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        aceitouTermos: true,
      });

      // Define a mensagem de sucesso na tela
      setSuccessMessage("Cadastro realizado com sucesso! Redirecionando...");

      // Aguarda 2 segundos para o usuário ver o aviso e depois navega para o login
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setErrorMessage(
        error.message || "Ocorreu um erro ao realizar o cadastro."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B63D6] via-[#2E8AF5] to-[#57C2FF] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl overflow-hidden rounded-3xl border-[3px] border-black bg-[#FDF9F1] shadow-[8px_8px_0px_#000] grid grid-cols-1 lg:grid-cols-[420px_1fr]">
        {/* LADO ESQUERDO */}
        <div className="flex flex-col items-center justify-center border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-black bg-white px-6 py-10 sm:px-10 sm:py-14">
          <img
            src={Logo}
            alt="Português com Anas"
            className="w-44 sm:w-56 lg:w-72 mb-8 object-contain"
          />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center">
            Comece Agora!
          </h1>
          <p className="mt-5 max-w-sm text-center text-gray-600 leading-7">
            Crie sua conta para organizar seus estudos, acompanhar seu progresso
            e garantir a sua aprovação no Português.
          </p>
        </div>

        {/* CADASTRO */}
        <div className="flex items-center justify-center bg-gradient-to-br from-[#1B63D6] to-[#57C2FF] p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md rounded-3xl border-[3px] border-black bg-[#FDF9F1] p-6 sm:p-8 lg:p-10 shadow-[6px_6px_0px_#000]">
            <h2 className="text-3xl sm:text-4xl font-black mb-2">
              Criar Conta
            </h2>
            <p className="mb-6 text-gray-600">
              Preencha os dados abaixo para se cadastrar na plataforma.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block font-semibold text-gray-800">
                  Nome
                </label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  required
                  placeholder="Digite seu nome completo"
                  className="w-full rounded-2xl border-[3px] border-black px-5 py-3 outline-none transition-all duration-200 focus:border-[#57C2FF] focus:shadow-md"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-semibold text-gray-800">
                  E-mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="Digite seu melhor e-mail"
                  className="w-full rounded-2xl border-[3px] border-black px-5 py-3 outline-none transition-all duration-200 focus:border-[#57C2FF] focus:shadow-md"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-semibold text-gray-800">
                  Senha
                </label>
                <input
                  type="password"
                  name="senha"
                  value={form.senha}
                  onChange={handleChange}
                  required
                  placeholder="Crie uma senha forte"
                  className="w-full rounded-2xl border-[3px] border-black px-5 py-3 outline-none transition-all duration-200 focus:border-[#57C2FF] focus:shadow-md"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-semibold text-gray-800">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  name="confirmarSenha"
                  value={form.confirmarSenha}
                  onChange={handleChange}
                  required
                  placeholder="Repita a senha criada"
                  className="w-full rounded-2xl border-[3px] border-black px-5 py-3 outline-none transition-all duration-200 focus:border-[#57C2FF] focus:shadow-md"
                />
              </div>

              {/* Caixa de Termos Customizada */}
              <div className="rounded-2xl border-2 border-black bg-white p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="termos"
                    checked={form.termos}
                    onChange={handleChange}
                    className="mt-1 h-5 w-5 accent-[#1B63D6]"
                  />
                  <span className="text-sm leading-6 text-gray-700">
                    Declaro que li e concordo com o{" "}
                    <button
                      type="button"
                      onClick={() => setModalAberto(true)}
                      className="font-bold text-[#1B63D6] hover:underline align-baseline inline"
                    >
                      Termo de Consentimento e Aceite de Uso
                    </button>{" "}
                    da plataforma, autorizando o tratamento dos meus dados
                    conforme a LGPD.
                  </span>
                </label>
              </div>

              {/* Box de Erro Estilizado Neo-brutalista */}
              {errorMessage && (
                <div className="rounded-2xl border-[3px] border-black bg-[#FF6B6B] p-3 text-center font-bold text-black shadow-[4px_4px_0px_#000]">
                  {errorMessage}
                </div>
              )}

              {/* BOX DE SUCESSO ESTILIZADO NEO-BRUTALISTA (VERDE) */}
              {successMessage && (
                <div className="rounded-2xl border-[3px] border-black bg-[#4EFA94] p-3 text-center font-bold text-black shadow-[4px_4px_0px_#000]">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || successMessage} // Desabilita também se já deu certo
                className="mt-2 w-full rounded-full border-[3px] border-black bg-[#76D8F7] py-3 sm:py-4 text-lg sm:text-xl font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] active:translate-y-0 active:shadow-[2px_2px_0px_#000] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "CADASTRANDO..." : "CADASTRAR"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-gray-600">Já tem uma conta? </span>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-bold hover:underline text-[#1B63D6]"
              >
                Fazer Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== CAIXA DO TERMO (MODAL POPUP) ==================== */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-3xl border-[3px] border-black bg-[#FDF9F1] p-6 sm:p-8 shadow-[8px_8px_0px_#000] flex flex-col">
            {/* Topo da Caixa */}
            <div className="border-b-2 border-black pb-4 mb-4">
              <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                Termo de Consentimento e Aceite de Uso
              </h3>
              <p className="text-sm font-bold text-[#1B63D6]">
                Plataforma Português com as Anas
              </p>
            </div>

            {/* Texto Rolável */}
            <div className="overflow-y-auto pr-2 space-y-4 text-sm text-gray-700 leading-relaxed max-h-[50vh] border-b-2 border-black pb-4 mb-4">
              <p className="font-bold text-black">
                Ao realizar seu cadastro e utilizar a plataforma Português com
                as Anas, o usuário declara que leu, compreendeu e concorda com
                os termos abaixo:
              </p>

              <div>
                <h4 className="font-extrabold text-black">
                  1. Aceitação dos Termos
                </h4>
                <p>
                  Ao acessar ou utilizar a plataforma, o usuário concorda em
                  cumprir este Termo de Consentimento e Aceite, bem como a
                  legislação brasileira aplicável.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-black">
                  2. Finalidade da Plataforma
                </h4>
                <p>
                  A plataforma Português com as Anas destina-se à oferta de
                  cursos, materiais didáticos, simulados, videoaulas, exercícios
                  e demais conteúdos voltados ao ensino da Língua Portuguesa e
                  preparação para concursos públicos.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-black">
                  3. Cadastro do Usuário
                </h4>
                <p>
                  O usuário declara que as informações fornecidas no cadastro
                  são verdadeiras, completas e atualizadas, comprometendo-se a
                  mantê-las corretas sempre que necessário.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-black">
                  4. Tratamento de Dados Pessoais
                </h4>
                <p>
                  Ao utilizar a plataforma, o usuário autoriza o tratamento de
                  seus dados pessoais para as seguintes finalidades: criação e
                  gerenciamento da conta; acesso aos cursos e conteúdos;
                  processamento de pagamentos; emissão de comprovantes;
                  comunicação sobre atualizações e suporte; cumprimento de
                  obrigações legais em conformidade com a LGPD (Lei nº
                  13.709/2018).
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-black">5. Comunicações</h4>
                <p>
                  O usuário autoriza o envio de comunicações relacionadas à
                  plataforma por e-mail, WhatsApp ou outros meios de contato
                  informados no cadastro.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-black">
                  6. Uso da Plataforma
                </h4>
                <p>
                  O usuário compromete-se a utilizar a plataforma de forma
                  ética, sendo proibido compartilhar sua conta com terceiros ou
                  copiar e distribuir conteúdos sem autorização.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-black">
                  7. Propriedade Intelectual
                </h4>
                <p>
                  Todo o conteúdo disponibilizado na plataforma (videoaulas,
                  apostilas, questões) é protegido pelas leis de direitos
                  autorais e pertence aos seus respectivos titulares.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-black">
                  8. Responsabilidades
                </h4>
                <p>
                  A plataforma envidará esforços para manter seus serviços
                  disponíveis, porém não garante funcionamento ininterrupto
                  devido a manutenções necessárias.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-black">
                  9. Alterações dos Termos
                </h4>
                <p>
                  Este Termo poderá ser atualizado sempre que necessário. As
                  alterações passarão a valer após sua publicação na plataforma.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-black">10. Foro</h4>
                <p>
                  Fica eleito o foro da comarca competente, conforme a
                  legislação brasileira, para dirimir quaisquer dúvidas oriundas
                  deste Termo.
                </p>
              </div>
            </div>

            {/* Ações da Caixa */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end items-center">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="w-full sm:w-auto px-6 py-2 rounded-full border-2 border-black bg-gray-200 text-sm font-bold transition-all hover:bg-gray-300"
              >
                FECHAR E NÃO ACEITAR
              </button>
              <button
                type="button"
                onClick={handleAceitarPeloModal}
                className="w-full sm:w-auto px-6 py-2 rounded-full border-[3px] border-black bg-[#76D8F7] text-sm font-black transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#000]"
              >
                LI E ACEITO O TERMO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
