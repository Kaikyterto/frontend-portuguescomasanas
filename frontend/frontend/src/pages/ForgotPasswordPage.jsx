import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/logo-sem-fundo.png";
import { solicitarRedefinicao, redefinirSenha } from "../service/esqueciSenha";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  
  // Controla em qual passo estamos: 1 (Pedir e-mail) ou 2 (Digitar token e nova senha)
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Passo 1: Solicitar o envio do código/token
  const handleSolicitar = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      setLoading(true);
      await solicitarRedefinicao(email);
      setSuccessMessage("Instruções enviadas! Verifique seu e-mail.");
      
      // Avança para o passo 2 após 1.5s ou direto
      setTimeout(() => {
        setSuccessMessage("");
        setStep(2);
      }, 1500);
    } catch (error) {
      setErrorMessage(error.message || "Erro ao solicitar redefinição.");
    } finally {
      setLoading(false);
    }
  };

  // Passo 2: Enviar o token e a nova senha para o backend
  const handleRedefinir = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (novaSenha !== confirmarSenha) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);
      await redefinirSenha(token.trim(), novaSenha);
      setSuccessMessage("Senha redefinida com sucesso! Redirecionando para o login...");
      
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (error) {
      setErrorMessage(error.message || "Token inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B63D6] via-[#2E8AF5] to-[#57C2FF] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl overflow-hidden rounded-3xl border-[3px] border-black bg-[#FDF9F1] shadow-[8px_8px_0px_#000] grid grid-cols-1 lg:grid-cols-[420px_1fr]">
        <div className="flex flex-col items-center justify-center border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-black bg-white px-6 py-10 sm:px-10 sm:py-14">
          <img
            src={Logo}
            alt="Português com Anas"
            className="w-44 sm:w-56 lg:w-72 mb-8 object-contain"
          />

          <h1 className="text-3xl sm:text-4xl font-extrabold text-center">
            Recuperação
          </h1>

          <p className="mt-5 max-w-sm text-center text-gray-600 leading-7">
            {step === 1
              ? "Não se preocupe, vamos te ajudar a recuperar o acesso à sua conta de estudos."
              : "Insira o código recebido por e-mail e defina sua nova senha de acesso."}
          </p>
        </div>

        <div className="flex items-center justify-center bg-gradient-to-br from-[#1B63D6] to-[#57C2FF] p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md rounded-3xl border-[3px] border-black bg-[#FDF9F1] p-6 sm:p-8 lg:p-10 shadow-[6px_6px_0px_#000]">
            
            {/* PASSO 1: DIGITAR O E-MAIL */}
            {step === 1 && (
              <>
                <h2 className="text-3xl sm:text-4xl font-black mb-2">Esqueceu a senha?</h2>
                <p className="mb-8 text-gray-600">
                  Digite seu e-mail cadastrado para receber as instruções.
                </p>

                <form className="space-y-5" onSubmit={handleSolicitar}>
                  <div>
                    <label className="font-semibold block mb-1.5 text-gray-800">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Digite seu email"
                      className="w-full rounded-2xl border-[3px] border-black px-5 py-3 sm:py-4 outline-none transition focus:border-[#57C2FF]"
                    />
                  </div>

                  {errorMessage && (
                    <div className="rounded-2xl border-[3px] border-black bg-[#FF6B6B] p-3 text-center font-bold text-black shadow-[4px_4px_0px_#000]">
                      {errorMessage}
                    </div>
                  )}

                  {successMessage && (
                    <div className="rounded-2xl border-[3px] border-black bg-[#4EFA94] p-3 text-center font-bold text-black shadow-[4px_4px_0px_#000]">
                      {successMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-3 w-full rounded-full border-[3px] border-black bg-[#76D8F7] py-3 sm:py-4 text-lg sm:text-xl font-bold transition hover:scale-105 active:scale-95 shadow-[4px_4px_0px_#000] active:shadow-none disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? "ENVIANDO..." : "ENVIAR INSTRUÇÕES"}
                  </button>
                </form>
              </>
            )}

            {/* PASSO 2: DIGITAR O TOKEN E A NOVA SENHA */}
            {step === 2 && (
              <>
                <h2 className="text-3xl sm:text-4xl font-black mb-2">Nova Senha</h2>
                <p className="mb-8 text-gray-600">
                  Insira o código/token recebido e sua nova senha.
                </p>

                <form className="space-y-5" onSubmit={handleRedefinir}>
                  <div>
                    <label className="font-semibold block mb-1.5 text-gray-800">
                      Código / Token
                    </label>
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                      placeholder="Cole o código do e-mail"
                      className="w-full rounded-2xl border-[3px] border-black px-5 py-3 sm:py-4 outline-none transition focus:border-[#57C2FF]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1.5 text-gray-800">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      required
                      placeholder="Digite a nova senha"
                      className="w-full rounded-2xl border-[3px] border-black px-5 py-3 sm:py-4 outline-none transition focus:border-[#57C2FF]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1.5 text-gray-800">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      required
                      placeholder="Confirme a nova senha"
                      className="w-full rounded-2xl border-[3px] border-black px-5 py-3 sm:py-4 outline-none transition focus:border-[#57C2FF]"
                    />
                  </div>

                  {errorMessage && (
                    <div className="rounded-2xl border-[3px] border-black bg-[#FF6B6B] p-3 text-center font-bold text-black shadow-[4px_4px_0px_#000]">
                      {errorMessage}
                    </div>
                  )}

                  {successMessage && (
                    <div className="rounded-2xl border-[3px] border-black bg-[#4EFA94] p-3 text-center font-bold text-black shadow-[4px_4px_0px_#000]">
                      {successMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || successMessage}
                    className="mt-3 w-full rounded-full border-[3px] border-black bg-[#76D8F7] py-3 sm:py-4 text-lg sm:text-xl font-bold transition hover:scale-105 active:scale-95 shadow-[4px_4px_0px_#000] active:shadow-none disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? "SALVANDO..." : "SALVAR NOVA SENHA"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-true text-center text-sm font-medium hover:underline text-gray-700 block mx-auto mt-2"
                  >
                    ← Voltar e alterar e-mail
                  </button>
                </form>
              </>
            )}

            <div className="mt-6 text-center text-sm">
              <Link to="/login" className="font-medium hover:underline text-[#1B63D6]">
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}