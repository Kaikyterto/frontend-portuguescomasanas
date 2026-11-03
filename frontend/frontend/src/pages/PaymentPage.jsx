import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { buscarPorId } from "../service/curso";
import { paymentService } from "../service/payment";

export default function PaymentPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const cursoId = id || searchParams.get("id");

  const [curso, setCurso] = useState(null);
  const [carregandoCurso, setCarregandoCurso] = useState(true);
  const [erroCurso, setErroCurso] = useState("");

  const [method, setMethod] = useState("PIX");
  const [installments, setInstallments] = useState(1);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [installmentOptions, setInstallmentOptions] = useState([]);
  
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [createdOrder, setCreatedOrder] = useState(null);
  const [mpPublicKey, setMpPublicKey] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    cpf: "",
    cardNumber: "",
    cardHolder: "",
    cardExpiry: "",
    cardCvv: "",
    paymentMethodId: "visa",
    streetName: "",
    streetNumber: "",
    zipCode: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const formatMoney = (val) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);
  };

  useEffect(() => {
    async function carregarDadosIniciais() {
      if (!cursoId) {
        setErroCurso("Nenhum curso especificado na URL.");
        setCarregandoCurso(false);
        return;
      }

      try {
        setCarregandoCurso(true);
        setErroCurso("");
        const token = localStorage.getItem("token") || localStorage.getItem("@PortuguessComAnas:token");

        const dadosCurso = await buscarPorId(cursoId, token);
        const precoNumerico = Number(
          dadosCurso.preco ?? dadosCurso.valor ?? dadosCurso.precoNum ?? 0
        );

        setCurso({
          id: dadosCurso.id,
          title: dadosCurso.titulo || dadosCurso.nome || dadosCurso.title || "Curso Sem Título",
          description: dadosCurso.descricao || dadosCurso.description || "Sem descrição disponível.",
          precoNum: precoNumerico,
        });

        try {
          const config = await paymentService.getMercadoPagoConfig();
          if (config?.publicKey) {
            setMpPublicKey(config.publicKey);
          }
        } catch (e) {
          console.warn("Não foi possível carregar a publicKey do Mercado Pago", e);
        }

        try {
          const options = await paymentService.getQuoteOptions();
          if (options) {
            setAvailableMethods(options.methods || ["PIX", "BOLETO", "CREDIT_CARD"]);
            setInstallmentOptions(options.installments || [1]);
          }
        } catch (e) {
          console.warn("Não foi possível carregar as opções de cotação", e);
        }

      } catch (err) {
        console.error("Erro ao carregar curso:", err);
        setErroCurso(err.message || "Não foi possível carregar os dados do curso.");
      } finally {
        setCarregandoCurso(false);
      }
    }

    carregarDadosIniciais();
  }, [cursoId]);

  const totalAmount = curso?.precoNum || 0;

  useEffect(() => {
    if (!curso?.id) return;

    async function atualizarCotacao() {
      try {
        setLoadingQuote(true);
        setErrorMessage("");

        const quoteResp = await paymentService.createQuote({
          cursoId: Number(curso.id),
          method: method,
          installments: method === "CREDIT_CARD" ? Number(installments) : 1,
        });

        setQuote(quoteResp);
      } catch (err) {
        console.error("Erro ao criar cotação:", err);
        setErrorMessage("Erro ao atualizar cotação do pagamento.");
      } finally {
        setLoadingQuote(false);
      }
    }

    atualizarCotacao();
  }, [curso?.id, method, installments]);

  useEffect(() => {
    let intervalId = null;

    if (createdOrder?.id && !paymentSuccess) {
      intervalId = setInterval(async () => {
        try {
          const statusResp = await paymentService.getOrderStatus(createdOrder.id);
          const currentStatus = statusResp.status || statusResp.orderStatus;

          if (currentStatus === "APPROVED" || currentStatus === "PAID" || currentStatus === "CONFIRMED") {
            setPaymentSuccess(true);
            setLoading(false);
            clearInterval(intervalId);
          } else if (currentStatus === "REJECTED" || currentStatus === "CANCELLED" || currentStatus === "EXPIRED") {
            setErrorMessage("O pagamento foi recusado ou expirou. Tente novamente.");
            setLoading(false);
            setCreatedOrder(null);
            clearInterval(intervalId);
          }
        } catch (err) {
          console.error("Erro ao consultar status da ordem:", err);
        }
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [createdOrder, paymentSuccess]);

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
    } else if (name === "cpf") {
      formattedVal = value.replace(/\D/g, "").slice(0, 11);
      formattedVal = formattedVal.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (name === "state") {
      formattedVal = value.toUpperCase().slice(0, 2);
    }

    setFormData((prev) => ({ ...prev, [name]: formattedVal }));
  };

  const handleCopyPix = () => {
    const pixCode = createdOrder?.pixCode;
    if (!pixCode) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pixCode);
    } else {
      const el = document.createElement("textarea");
      el.value = pixCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }

    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  const tokenizeCard = async () => {
    if (!window.MercadoPago) {
      throw new Error("SDK do Mercado Pago não encontrado no navegador.");
    }

    const mp = new window.MercadoPago(mpPublicKey);

    const [expirationMonth, expirationYear] = formData.cardExpiry.split("/");

    const tokenResult = await mp.createCardToken({
      cardNumber: formData.cardNumber.replace(/\s+/g, ""),
      cardholderName: formData.cardHolder || `${formData.firstName} ${formData.lastName}`,
      cardExpirationMonth: expirationMonth,
      cardExpirationYear: expirationYear?.length === 2 ? `20${expirationYear}` : expirationYear,
      securityCode: formData.cardCvv,
      identification: {
        type: "CPF",
        number: formData.cpf.replace(/\D/g, ""),
      },
    });

    const deviceSessionId = mp.getDeviceSessionId ? mp.getDeviceSessionId() : undefined;

    return {
      cardToken: tokenResult.id,
      deviceSessionId,
    };
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!quote?.id && !quote?.quoteId) {
      setErrorMessage("Cotação inválida ou não carregada.");
      return;
    }

    setLoading(true);

    try {
      const cleanCpf = formData.cpf.replace(/\D/g, "");
      const quoteId = quote.quoteId || quote.id;

      let payload = {
        quoteId,
        cursoId: Number(curso.id),
        method,
        installments: method === "CREDIT_CARD" ? Number(installments) : 1,
      };

      if (method === "PIX") {
        payload.paymentMethodId = "pix";
      } else if (method === "BOLETO") {
        payload.paymentMethodId = "boleto";
        payload.boletoPayer = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          cpf: cleanCpf,
          streetName: formData.streetName,
          streetNumber: formData.streetNumber,
          zipCode: formData.zipCode.replace(/\D/g, ""),
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
        };
      } else if (method === "CREDIT_CARD") {
        payload.paymentMethodId = formData.paymentMethodId || "visa";
        const { cardToken, deviceSessionId } = await tokenizeCard();
        payload.cardToken = cardToken;
        if (deviceSessionId) {
          payload.deviceSessionId = deviceSessionId;
        }
      }

      const orderResp = await paymentService.createOrder(payload);

      if (orderResp?.challengeUrl) {
        window.location.href = orderResp.challengeUrl;
        return;
      }

      setCreatedOrder(orderResp);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setErrorMessage(err.message || "Não foi possível concluir o pagamento. Tente novamente.");
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
          <h2 className="text-xl font-black text-black uppercase mb-2">Erro ao carregar curso</h2>
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

  const finalAmount = quote?.totalAmount ?? totalAmount;
  const taxAmount = Number((finalAmount - totalAmount).toFixed(2));
  const taxPercentage = totalAmount > 0 ? ((taxAmount / totalAmount) * 100).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-[#F4EFE6] font-sans p-4 md:p-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-4xl bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
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
          <div className="grid grid-cols-1 lg:grid-cols-12">
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

                  <div className="mt-4 pt-3 border-t-2 border-slate-200 space-y-2">
                    <div className="flex justify-between items-baseline text-xs font-bold text-slate-600">
                      <span>Valor do Curso:</span>
                      <span>{formatMoney(totalAmount)}</span>
                    </div>

                    <div className="flex justify-between items-baseline text-xs font-bold text-slate-600">
                      <span>Taxa Mercado Pago ({taxPercentage}%):</span>
                      <span>{formatMoney(taxAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-black">
                <div className="flex justify-between items-center text-lg font-black text-slate-900">
                  <span>Total Final:</span>
                  <span className="text-xl text-[#7B5CFA]">
                    {loadingQuote ? "Atualizando..." : formatMoney(finalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 p-6 bg-white flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-3">
                  Escolha o Método de Pagamento
                </h2>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setMethod("CREDIT_CARD")}
                    className={`p-3 rounded-xl border-3 border-black font-black text-xs md:text-sm flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      method === "CREDIT_CARD"
                        ? "bg-[#00D2DF] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                        : "bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    <span>💳 Cartão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("PIX")}
                    className={`p-3 rounded-xl border-3 border-black font-black text-xs md:text-sm flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      method === "PIX"
                        ? "bg-[#00D2DF] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                        : "bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    <span> Pix</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("BOLETO")}
                    className={`p-3 rounded-xl border-3 border-black font-black text-xs md:text-sm flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      method === "BOLETO"
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

                {createdOrder ? (
                  <div className="space-y-4">
                    {method === "PIX" && (
                      <div className="p-4 bg-[#00D2DF]/10 border-2 border-black rounded-xl text-center space-y-3">
                        <p className="text-xs font-bold text-slate-800">
                          Escaneie o QR Code ou copie o código Pix abaixo:
                        </p>
                        {createdOrder.qrCodeBase64 && (
                          <img
                            src={`data:image/png;base64,${createdOrder.qrCodeBase64}`}
                            alt="QR Code Pix"
                            className="w-48 h-48 mx-auto border-2 border-black rounded-lg"
                          />
                        )}
                        {createdOrder.pixCode && (
                          <button
                            type="button"
                            onClick={handleCopyPix}
                            className="bg-[#FFD700] text-black text-xs font-black px-4 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-400 cursor-pointer"
                          >
                            {pixCopied ? "✓ CÓDIGO PIX COPIADO!" : "📋 COPIAR CÓDIGO PIX"}
                          </button>
                        )}
                        <p className="text-xs text-slate-500 font-bold animate-pulse">
                          Aguardando confirmação do pagamento pelo servidor...
                        </p>
                      </div>
                    )}

                    {method === "BOLETO" && (
                      <div className="p-4 bg-slate-100 border-2 border-black rounded-xl text-center space-y-3">
                        <p className="text-xs font-bold text-slate-800">
                          Seu boleto foi gerado com sucesso!
                        </p>
                        {createdOrder.ticketUrl && (
                          <a
                            href={createdOrder.ticketUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-[#7B5CFA] text-white text-xs font-black px-4 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-purple-600"
                          >
                            ABRIR BOLETO BANCÁRIO ➔
                          </a>
                        )}
                        <p className="text-xs text-slate-500 font-bold animate-pulse">
                          Aguardando compensação bancária...
                        </p>
                      </div>
                    )}

                    {method === "CREDIT_CARD" && (
                      <div className="p-4 bg-slate-100 border-2 border-black rounded-xl text-center space-y-2">
                        <p className="text-xs font-bold text-slate-800">
                          Processando pagamento com cartão de crédito...
                        </p>
                        <p className="text-xs text-slate-500 font-bold animate-pulse">
                          Consultando validação da operadora...
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmitPayment} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black uppercase mb-1 text-slate-800">
                          Nome
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          required
                          placeholder="Maria"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full border-2 border-black rounded-lg p-2 font-bold text-xs bg-slate-50 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase mb-1 text-slate-800">
                          Sobrenome
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          required
                          placeholder="Silva"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full border-2 border-black rounded-lg p-2 font-bold text-xs bg-slate-50 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase mb-1 text-slate-800">
                        CPF
                      </label>
                      <input
                        type="text"
                        name="cpf"
                        required
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={handleInputChange}
                        className="w-full border-2 border-black rounded-lg p-2 font-bold text-xs bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>

                    {method === "BOLETO" && (
                      <div className="space-y-3 pt-2 border-t-2 border-slate-200">
                        <h3 className="text-xs font-black uppercase text-slate-700">
                          Endereço para emissão do Boleto
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase text-slate-800">
                              Rua / Logradouro
                            </label>
                            <input
                              type="text"
                              name="streetName"
                              required
                              placeholder="Rua Exemplo"
                              value={formData.streetName}
                              onChange={handleInputChange}
                              className="w-full border-2 border-black rounded-lg p-2 font-bold text-xs bg-slate-50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-800">
                              Número
                            </label>
                            <input
                              type="text"
                              name="streetNumber"
                              required
                              placeholder="123"
                              value={formData.streetNumber}
                              onChange={handleInputChange}
                              className="w-full border-2 border-black rounded-lg p-2 font-bold text-xs bg-slate-50"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-800">
                              CEP
                            </label>
                            <input
                              type="text"
                              name="zipCode"
                              required
                              placeholder="00000000"
                              value={formData.zipCode}
                              onChange={handleInputChange}
                              className="w-full border-2 border-black rounded-lg p-2 font-bold text-xs bg-slate-50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-800">
                              Bairro
                            </label>
                            <input
                              type="text"
                              name="neighborhood"
                              required
                              placeholder="Centro"
                              value={formData.neighborhood}
                              onChange={handleInputChange}
                              className="w-full border-2 border-black rounded-lg p-2 font-bold text-xs bg-slate-50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-800">
                              Cidade / UF
                            </label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                name="city"
                                required
                                placeholder="Cidade"
                                value={formData.city}
                                onChange={handleInputChange}
                                className="w-full border-2 border-black rounded-lg p-2 font-bold text-xs bg-slate-50"
                              />
                              <input
                                type="text"
                                name="state"
                                required
                                placeholder="SP"
                                value={formData.state}
                                onChange={handleInputChange}
                                className="w-12 border-2 border-black rounded-lg p-2 font-bold text-xs bg-slate-50 text-center"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {method === "CREDIT_CARD" && (
                      <div className="space-y-3 pt-2 border-t-2 border-slate-200">
                        <div>
                          <label className="block text-xs font-black uppercase mb-1 text-slate-800">
                            Nome Impresso no Cartão
                          </label>
                          <input
                            type="text"
                            name="cardHolder"
                            required
                            placeholder="MARIA SILVA"
                            value={formData.cardHolder}
                            onChange={handleInputChange}
                            className="w-full border-2 border-black rounded-lg p-2 font-bold text-xs bg-slate-50 focus:bg-white focus:outline-none"
                          />
                        </div>

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
                            onChange={(e) => setInstallments(Number(e.target.value))}
                            className="w-full border-2 border-black rounded-lg p-2.5 font-bold text-xs bg-white cursor-pointer"
                          >
                            {installmentOptions.map((opt) => {
                              const count = typeof opt === "object" ? opt.installments : opt;
                              return (
                                <option key={count} value={count}>
                                  {count}x {count === 1 ? "(À vista)" : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || loadingQuote}
                      className="w-full mt-6 bg-[#7B5CFA] text-white border-3 border-black rounded-xl py-3.5 font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer disabled:opacity-50"
                    >
                      {loading
                        ? "PROCESSANDO..."
                        : method === "CREDIT_CARD"
                        ? `PAGAR ${formatMoney(finalAmount)}`
                        : method === "PIX"
                        ? "GERAR PIX ➔"
                        : "GERAR BOLETO BANCÁRIO ➔"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}