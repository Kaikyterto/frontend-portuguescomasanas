import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo-sem-fundo.png";
import { login } from "../service/auth";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    senha: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      setLoading(true);

      await login(form.email, form.senha);

      setSuccessMessage("Login realizado com sucesso! Entrando...");

      setTimeout(() => {
        navigate("/user");
      }, 1500);
    } catch (error) {
      setErrorMessage(error.message || "E-mail ou senha incorretos.");
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
            Bem-vindo!
          </h1>

          <p className="mt-5 max-w-sm text-center text-gray-600 leading-7">
            Estude Português de forma organizada, acompanhe sua evolução e
            alcance sua aprovação.
          </p>
        </div>

        <div className="flex items-center justify-center bg-gradient-to-br from-[#1B63D6] to-[#57C2FF] p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md rounded-3xl border-[3px] border-black bg-[#FDF9F1] p-6 sm:p-8 lg:p-10 shadow-[6px_6px_0px_#000]">
            <h2 className="text-3xl sm:text-4xl font-black mb-2">Entrar</h2>

            <p className="mb-8 text-gray-600">
              Faça login para acessar sua plataforma.
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="font-semibold block mb-1.5 text-gray-800">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="Digite seu email"
                  className="w-full rounded-2xl border-[3px] border-black px-5 py-3 sm:py-4 outline-none transition focus:border-[#57C2FF]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1.5 text-gray-800">
                  Senha
                </label>
                <input
                  type="password"
                  name="senha"
                  value={form.senha}
                  onChange={handleChange}
                  required
                  placeholder="Digite sua senha"
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
                {loading ? "ENTRANDO..." : "ENTRAR"}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-3 text-center text-sm sm:flex-row sm:justify-between">
              <button type="button" className="font-medium hover:underline">
                Esqueci minha senha
              </button>

              <button
                type="button"
                onClick={() => navigate("/register")}
                className="font-medium hover:underline text-[#1B63D6]"
              >
                Criar conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
