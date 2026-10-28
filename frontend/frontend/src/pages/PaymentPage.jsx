import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { buscarPorId } from "../service/curso"; 
import { createCheckout } from "../service/payment"; 

export default function PaymentPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Obtém o ID do curso vindo do parâmetro de rota (:id) ou query string (?id=)
  const cursoId = id || searchParams.get("id");

  
  const [curso, setCurso] = useState(null);
  const [carregandoCurso, setCarregandoCurso] = useState(true);
  const [erroCurso, setErroCurso] = useState("");

  
  const [method, setMethod] = useState("credit_card"); // 'credit_card' | 'pix' | 'boleto'
  const [installments, setInstallments] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

 
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardHolder: "",
    cardExpiry: "",
    cardCvv: "",
    cpfCnpjs: "",
    email: "",
    fullName: "",
    zipCode: "",
    address: "",
  });

  
  useEffect(() => {
    async function carregarCurso() {
      if (!cursoId) {
        setErroCurso("Nenhum curso especificado na URL.");
        setCarregandoCurso(false);
        return;
      }

      try {
        setCarregandoCurso(true);
        setErroCurso("");
        const token = localStorage.getItem("token") || localStorage.getItem("@PortuguessComAnas:token");

        // Chamada à API
        const dados = await buscarPorId(cursoId, token);

        // Trata os campos retornado do backend
        const precoNumerico = Number(
          dados.preco ?? dados.valor ?? dados.precoNum ?? 0
        );

        setCurso({
          id: dados.id,
          title:
            dados.titulo || dados.nome || dados.title || "Curso Sem Título",
          description:
            dados.descricao || dados.description || "Sem descrição disponível.",
          precoNum: precoNumerico,
        });
      } catch (err) {
        console.error("Erro ao carregar curso:", err);
        setErroCurso(
          err.message || "Não foi possível carregar os dados do curso."
        );
      } finally {
        setCarregandoCurso(false);
      }
    }

    carregarCurso();
  }, [cursoId]);

  
  const totalAmount = curso?.precoNum || 0;

  // Formatação em Moeda Real (BRL)
  const formatMoney = (val) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);
  };

  // Tabela de cálculo de parcelamento (1x a 12x)
  const getInstallmentOptions = () => {
    const options = [];
    const interestRate = 0.0199; // Exemplo: 1.99% ao mês para parcelas acima de 1x

    for (let i = 1; i <= 12; i++) {
      if (i === 1) {
        options.push({
          count: 1,
          label: `1x de ${formatMoney(totalAmount)} (À vista)`,
          total: totalAmount,
          monthly: totalAmount,
        });
      } else {
        const totalWithInterest =
          totalAmount * Math.pow(1 + interestRate, i - 1);
        const monthly = totalWithInterest / i;
        options.push({
          count: i,
          label: `${i}x de ${formatMoney(monthly)} (${formatMoney(
            totalWithInterest
          )})`,
          total: totalWithInterest,
          monthly: monthly,
        });
      }
    }
    return options;
  };

  const installmentOptions = getInstallmentOptions();
  const selectedInstallmentObj =
    installmentOptions.find((o) => o.count === Number(installments)) ||
    installmentOptions[0];

  // Máscaras de entrada do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedVal = value;

    if (name === "cardNumber") {
      formattedVal = value
        .replace(/\D/g, "")
        .replace(/(.{4})/g, "$1 ")
        .trim()
        .slice(0, 19);
    } else if (name === "cardExpiry") {
      formattedVal = value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "$1/$2")
        .slice(0, 5);
    } else if (name === "cardCvv") {
      formattedVal = value.replace(/\D/g, "").slice(0, 4);
    } else if (name === "cpfCnpjs") {
      formattedVal = value.replace(/\D/g, "").slice(0, 14);
      if (formattedVal.length <= 11) {
        formattedVal = formattedVal.replace(
          /(\d{3})(\d{3})(\d{3})(\d{2})/,
          "$1.$2.$3-$4"
        );
      }
    }

    setFormData((prev) => ({ ...prev, [name]: formattedVal }));
  };

  // Copiar código do PIX
  const handleCopyPix = () => {
    const mockPixCode =
      "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-4266141740005204000053039865405197.005802BR5925PORTUGUES COM ANAS LTDA6009SAO PAULO62070503***6304E2CA";

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(mockPixCode);
    } else {
      const el = document.createElement("textarea");
      el.value = mockPixCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }

    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  // Processamento do pagamento integrado ao backend
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      // Chama a função createCheckout passando o ID do curso
      const response = await createCheckout(curso?.id);

      // Se o backend retornar URL de preferência/checkout (ex: Mercado Pago), redireciona
      if (response?.checkoutUrl || response?.initPoint || response?.url) {
        window.location.href = response.checkoutUrl || response.initPoint || response.url;
        return;
      }

      setLoading(false);
      setPaymentSuccess(true);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setErrorMessage(
        err.message || "Não foi possível concluir o pagamento. Tente novamente."
      );
    }
  };

  if (carregandoCurso) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex flex-col items-center justify-center p-4">
        <div className="text-xl font-black text-slate-900 uppercase tracking-wide animate-pulse">
          Carregando informações do curso...
        </div>
      </div>
    );
  }

  if (erroCurso) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center p-4">
        <div className="bg-[#FF6B6B] border-4 border-black p-6 rounded-2xl shadow-[6px_6px_0px_#000] max-w-md text-center">
          <h2 className="text-xl font-black text-black uppercase mb-2">
            Erro ao carregar curso
          </h2>
          <p className="font-bold text-black text-sm mb-4">{erroCurso}</p>
          <button
            onClick={() => navigate("/user")}
            className="bg-white border-2 border-black font-black px-4 py-2 rounded-xl text-xs uppercase shadow-[2px_2px_0px_#000] hover:bg-slate-100"
          >
            Voltar para Meus Cursos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4EFE6] font-sans p-4 md:p-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-4xl bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#7B5CFA] border-b-4 border-black p-4 md:p-6 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wide">
            Finalize sua Inscrição
          </h1>
          <button
            onClick={() => navigate("/user")}
            className="bg-white text-black text-xs font-black px-4 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-100 transition cursor-pointer"
          >
            ✕ Cancelar
          </button>
        </div>

        {paymentSuccess ? (
          /* Tela de Sucesso */
          <div className="p-8 md:p-12 text-center flex flex-col items-center justify-center bg-[#00D2DF]/10">
            <div className="w-20 h-20 bg-[#00D2DF] border-4 border-black rounded-full flex items-center justify-center text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 animate-bounce">
              🎉
            </div>
            <h2 className="text-3xl font-black text-slate-900 uppercase mb-2">
              Pagamento Confirmado!
            </h2>
            <p className="text-slate-700 font-bold max-w-md mb-6">
              Parabéns! Seu acesso ao curso{" "}
              <strong className="underline decoration-[#7B5CFA] decoration-4">
                {curso?.title}
              </strong>{" "}
              já foi liberado na sua conta.
            </p>
            <button
              onClick={() => navigate("/user")}
              className="bg-[#FF42DE] text-white font-black px-8 py-3 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
            >
              IR PARA MEUS CURSOS ➔
            </button>
          </div>
        ) : (
          /* Formulário de Checkout */
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Coluna Esquerda: Resumo do Curso */}
            <div className="lg:col-span-5 bg-[#F4EFE6] border-b-4 lg:border-b-0 lg:border-r-4 border-black p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                  Resumo da Compra
                </h2>

                <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
                  <span className="bg-[#7B5CFA] text-white text-[10px] font-black px-2 py-0.5 rounded border border-black uppercase">
                    Curso Online
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-2 leading-tight">
                    {curso?.title}
                  </h3>
                  <p className="text-xs font-bold text-slate-600 mt-2 line-clamp-3">
                    {curso?.description}
                  </p>

                  <div className="mt-4 pt-3 border-t-2 border-slate-200 flex justify-between items-baseline">
                    <span className="text-xs font-black text-slate-500 uppercase">
                      Preço Total:
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      {formatMoney(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Final */}
              <div className="mt-6 pt-4 border-t-2 border-black">
                <div className="flex justify-between items-center text-lg font-black text-slate-900">
                  <span>Total Final:</span>
                  <span className="text-xl text-[#7B5CFA]">
                    {formatMoney(
                      method === "credit_card"
                        ? selectedInstallmentObj.total
                        : totalAmount
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Opções e Formulário */}
            <div className="lg:col-span-7 p-6 bg-white flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-3">
                  Escolha o Método de Pagamento
                </h2>

                {/* Métodos */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setMethod("credit_card")}
                    className={`p-3 rounded-xl border-3 border-black font-black text-xs md:text-sm flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      method === "credit_card"
                        ? "bg-[#00D2DF] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                        : "bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    <span>💳 Cartão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("pix")}
                    className={`p-3 rounded-xl border-3 border-black font-black text-xs md:text-sm flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      method === "pix"
                        ? "bg-[#00D2DF] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                        : "bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    <span> Pix</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("boleto")}
                    className={`p-3 rounded-xl border-3 border-black font-black text-xs md:text-sm flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      method === "boleto"
                        ? "bg-[#00D2DF] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                        : "bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    <span>📄 Boleto</span>
                  </button>
                </div>

                {errorMessage && (
                  <div className="mb-4 p-3 bg-[#FF6B6B] border-2 border-black rounded-xl font-bold text-xs text-black">
                    ⚠️ {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  {/* Dados do Pagador */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase mb-1 text-slate-800">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        placeholder="Ex: Maria Silva"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full border-2 border-black rounded-lg p-2 font-bold text-xs bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase mb-1 text-slate-800">
                        CPF / CNPJ
                      </label>
                      <input
                        type="text"
                        name="cpfCnpjs"
                        required
                        placeholder="000.000.000-00"
                        value={formData.cpfCnpjs}
                        onChange={handleInputChange}
                        className="w-full border-2 border-black rounded-lg p-2 font-bold text-xs bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Cartão de Crédito */}
                  {method === "credit_card" && (
                    <div className="space-y-3 pt-2 border-t-2 border-slate-200">
                      <div>
                        <label className="block text-xs font-black uppercase mb-1 text-slate-800">
                          Número do Cartão
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          required
                          placeholder="0000 0000 0000 0000"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          className="w-full border-2 border-black rounded-lg p-2 font-bold text-xs bg-slate-50 focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-black uppercase mb-1 text-slate-800">
                            Validade (MM/AA)
                          </label>
                          <input
                            type="text"
                            name="cardExpiry"
                            required
                            placeholder="12/28"
                            value={formData.cardExpiry}
                            onChange={handleInputChange}
                            className="w-full border-2 border-black rounded-lg p-2 font-bold text-xs bg-slate-50 text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase mb-1 text-slate-800">
                            CVV
                          </label>
                          <input
                            type="text"
                            name="cardCvv"
                            required
                            placeholder="123"
                            value={formData.cardCvv}
                            onChange={handleInputChange}
                            className="w-full border-2 border-black rounded-lg p-2 font-bold text-xs bg-slate-50 text-center"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase mb-1 text-slate-800">
                          Opções de Parcelamento
                        </label>
                        <select
                          value={installments}
                          onChange={(e) =>
                            setInstallments(Number(e.target.value))
                          }
                          className="w-full border-2 border-black rounded-lg p-2.5 font-bold text-xs bg-white cursor-pointer"
                        >
                          {installmentOptions.map((opt) => (
                            <option key={opt.count} value={opt.count}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Pix */}
                  {method === "pix" && (
                    <div className="p-4 bg-[#00D2DF]/10 border-2 border-black rounded-xl text-center space-y-3">
                      <p className="text-xs font-bold text-slate-800">
                        Clique abaixo para copiar o código Pix e realizar o
                        pagamento no seu banco.
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="bg-[#FFD700] text-black text-xs font-black px-4 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-400 cursor-pointer"
                      >
                        {pixCopied
                          ? "✓ CÓDIGO PIX COPIADO!"
                          : "📋 COPIAR CÓDIGO PIX"}
                      </button>
                    </div>
                  )}

                  {/* Boleto */}
                  {method === "boleto" && (
                    <div className="p-4 bg-slate-100 border-2 border-black rounded-xl space-y-2 text-xs font-bold">
                      <p className="text-slate-600">
                        O boleto bancário pode levar até{" "}
                        <strong>3 dias úteis</strong> para ser compensado.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 bg-[#7B5CFA] text-white border-3 border-black rounded-xl py-3.5 font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {loading
                      ? "PROCESSANDO..."
                      : method === "credit_card"
                      ? `PAGAR ${formatMoney(selectedInstallmentObj.total)}`
                      : method === "pix"
                      ? "JÁ FIZ O PAGAMENTO PIX ➔"
                      : "GERAR BOLETO BANCÁRIO ➔"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}