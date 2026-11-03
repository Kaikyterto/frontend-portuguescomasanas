import { useEffect, useRef, useState } from "react";
import { paymentService } from "../service/payment";

const CONTAINER_ID = "checkout-card-payment";
let brickLifecycle = Promise.resolve();

export default function CardPaymentBrick({ publicKey, quote, courseId, onOrder, onError, onExpired, payerAddress, payerIdentification, payerPhone }) {
  const submitting = useRef(false);
  const onOrderRef = useRef(onOrder);
  const payerAddressRef = useRef(payerAddress);
  const payerIdentificationRef = useRef(payerIdentification);
  const payerPhoneRef = useRef(payerPhone);
  const onErrorRef = useRef(onError);
  const onExpiredRef = useRef(onExpired);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onOrderRef.current = onOrder;
    payerAddressRef.current = payerAddress;
    payerIdentificationRef.current = payerIdentification;
    payerPhoneRef.current = payerPhone;
    onErrorRef.current = onError;
    onExpiredRef.current = onExpired;
  }, [onOrder, onError, onExpired, payerAddress, payerIdentification, payerPhone]);

  useEffect(() => {
    if (!publicKey || !quote?.quoteId) return undefined;

    const sdk = window.MercadoPago;
    if (typeof sdk !== "function") {
      onErrorRef.current("Não foi possível carregar o formulário seguro do Mercado Pago.");
      return undefined;
    }

    let active = true;
    let controller;
    const mp = new sdk(publicKey, { locale: "pt-BR" });
    const bricks = mp.bricks();
    const installments = Number(quote.installments);

    const settings = {
      initialization: { amount: Number(quote.totalAmount) },
      customization: {
        paymentMethods: {
          types: { excluded: ["debit_card", "prepaid_card"] },
          minInstallments: installments,
          maxInstallments: installments,
        },
      },
      callbacks: {
        onReady: () => { if (active) setReady(true); },
        onError: () => { if (active) onErrorRef.current("Verifique os dados do cartão e tente novamente."); },
        onSubmit: async (cardData, additionalData) => {
          if (!payerAddressRef.current) {
            onErrorRef.current("Preencha o endereço real do pagador antes de pagar.");
            throw new Error("Endereço do pagador incompleto");
          }
          if (!payerIdentificationRef.current?.number) {
            onErrorRef.current("Informe o CPF do pagador antes de pagar.");
            throw new Error("Identificação do pagador incompleta");
          }
          if (submitting.current) throw new Error("Pagamento em processamento.");
          if (!active || Date.parse(quote.expiresAt) <= Date.now()) {
            onErrorRef.current("A cotação expirou. Atualize o pagamento antes de tentar novamente.");
            onExpiredRef.current();
            throw new Error("Cotação expirada");
          }
          if (additionalData?.paymentTypeId !== "credit_card"
              || Number(cardData.installments) !== installments
              || Math.abs(Number(cardData.transaction_amount) - Number(quote.totalAmount)) > 0.001
              || !cardData.token || !cardData.payment_method_id) {
            onErrorRef.current("Cartão ou parcelamento não corresponde à cotação selecionada.");
            throw new Error("Cartão ou parcelamento incompatível");
          }

          submitting.current = true;
          try {
            const order = await paymentService.createOrder({
              quoteId: quote.quoteId,
              cursoId: Number(courseId),
              method: "CREDIT_CARD",
              installments,
              paymentMethodId: cardData.payment_method_id,
              cardToken: cardData.token,
              payerAddress: payerAddressRef.current,
              payerIdentification: payerIdentificationRef.current,
              payerPhone: payerPhoneRef.current,
            });
            if (active) onOrderRef.current(order);
          } catch (error) {
            if (active) onErrorRef.current(error.message || "Não foi possível processar o cartão.");
            throw error;
          } finally {
            submitting.current = false;
          }
        },
      },
    };

    brickLifecycle = brickLifecycle.catch(() => {}).then(async () => {
      if (!active) return;
      try {
        controller = await bricks.create("cardPayment", CONTAINER_ID, settings);
      } catch {
        if (active) onErrorRef.current("Não foi possível iniciar o formulário seguro do cartão.");
      }
    });

    return () => {
      active = false;
      brickLifecycle = brickLifecycle.catch(() => {}).then(() => controller?.unmount());
    };
  }, [publicKey, quote, courseId]);

  return (
    <div>
      {!ready && <p className="text-xs font-bold">Carregando formulário seguro do cartão...</p>}
      <div id={CONTAINER_ID} />
    </div>
  );
}
