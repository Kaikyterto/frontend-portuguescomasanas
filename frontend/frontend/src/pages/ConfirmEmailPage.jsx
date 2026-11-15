import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "../assets/logo-sem-fundo.png";
import { confirmarEmail } from "../service/confirmarEmail"; // Ajuste o caminho do seu service

export default function ConfirmEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRequested = useRef(false); // Evita dupla chamada no React StrictMode

  const [status, setStatus] = useState("loading"); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Extrai o hash da URL (ex: "#token=XB6fxvnL_...") removendo o '#' inicial
    const hashString = location.hash.startsWith("#")
      ? location.hash.substring(1)
      : location.hash;

    const hashParams = new URLSearchParams(hashString);
    const token = hashParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token de confirmação não encontrado na URL.");
      return;
    }

    if (hasRequested.current) return;
    hasRequested.current = true;

    const validarConta = async () => {
      try {
        await confirmarEmail(token.trim());
        setStatus("success");
        setMessage("E-mail confirmado com sucesso! Redirecionando para o login...");

        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error) {
        setStatus("error");
        setMessage(error.message || "Token inválido, expirado ou já utilizado.");
      }
    };

    validarConta();
  }, [location.hash, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B63D6] via-[#2E8AF5] to-[#57C2FF] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl overflow-hidden rounded-3xl border-[3px] border-black bg-[#FDF9F1] shadow-[8px_8px_0px_#000] grid grid-cols-1 lg:grid-cols-[420px_1fr]">
        {/* Coluna Esquerda (Logo e Título) */}
        <div className="flex flex-col items-center justify-center border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-black bg-white px-6 py-10 sm:px-10 sm:py-14">
          <img
            src={Logo}
            alt="Português com Anas"
            className="w-44 sm:w-56 lg:w-72 mb-8 object-contain"
          />

          <h1 className="text-3xl sm:text-4xl font-extrabold text-center">
            Verificação
          </h1>

          <p className="mt-5 max-w-sm text-center text-gray-600 leading-7">
            Estamos validando seu endereço de e-mail para liberar seu acesso completo à plataforma.
          </p>
        </div>

        {/* Coluna Direita (Card de Status) */}
        <div className="flex items-center justify-center bg-gradient-to-br from-[#1B63D6] to-[#57C2FF] p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md rounded-3xl border-[3px] border-black bg-[#FDF9F1] p-6 sm:p-8 lg:p-10 shadow-[6px_6px_0px_#000] text-center">
            
            {/* ESTADO: CARREGANDO */}
            {status === "loading" && (
              <div className="py-6 space-y-6">
                <div className="mx-auto h-14 w-14 animate-spin rounded-full border-[4px] border-black border-t-[#76D8F7]" />
                <h2 className="text-2xl sm:text-3xl font-black">
                  Confirmando e-mail...
                </h2>
                <p className="text-gray-600">
                  Aguarde um instante enquanto validamos seu token.
                </p>
              </div>
            )}

            {/* ESTADO: SUCESSO */}
            {status === "success" && (
              <div className="space-y-6">
                <h2 className="text-3xl sm:text-4xl font-black">
                  Tudo pronto!
                </h2>

                <div className="rounded-2xl border-[3px] border-black bg-[#4EFA94] p-4 font-bold text-black shadow-[4px_4px_0px_#000]">
                  {message}
                </div>

                <Link
                  to="/login"
                  className="block w-full rounded-full border-[3px] border-black bg-[#76D8F7] py-3 sm:py-4 text-lg sm:text-xl font-bold transition hover:scale-105 active:scale-95 shadow-[4px_4px_0px_#000] active:shadow-none"
                >
                  IR PARA O LOGIN AGORA
                </Link>
              </div>
            )}

            {/* ESTADO: ERRO */}
            {status === "error" && (
              <div className="space-y-6">
                <h2 className="text-3xl sm:text-4xl font-black">
                  Ops! Algo deu errado
                </h2>

                <div className="rounded-2xl border-[3px] border-black bg-[#FF6B6B] p-4 font-bold text-black shadow-[4px_4px_0px_#000]">
                  {message}
                </div>

                <p className="text-sm text-gray-600">
                  Verifique se o link foi copiado corretamente ou solicite um novo e-mail de ativação.
                </p>

                <Link
                  to="/login"
                  className="block w-full rounded-full border-[3px] border-black bg-[#76D8F7] py-3 sm:py-4 text-lg sm:text-xl font-bold transition hover:scale-105 active:scale-95 shadow-[4px_4px_0px_#000] active:shadow-none"
                >
                  VOLTAR PARA O LOGIN
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}