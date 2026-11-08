import { API_URL } from "../config/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("@PortuguessComAnas:token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getMercadoPagoConfig() {
  const response = await fetch(`${API_URL}/api/payments/orders/config`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao buscar configurações de pagamento.");
  }

  return data;
}

export async function getQuoteOptions() {
  const response = await fetch(`${API_URL}/api/payments/quotes/options`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao buscar opções de cotação.");
  }

  return data;
}

export async function createQuote(quoteData) {
  const response = await fetch(`${API_URL}/api/payments/quotes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(quoteData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao criar cotação de pagamento.");
  }

  return data;
}

export async function createOrder(orderData) {
  let deviceSessionId = window.MP_DEVICE_SESSION_ID;
  if (orderData.method === "CREDIT_CARD") {
    const deadline = Date.now() + 3000;
    while (!deviceSessionId && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      deviceSessionId = window.MP_DEVICE_SESSION_ID;
    }
    if (!deviceSessionId) {
      throw new Error("Não foi possível validar este dispositivo. Atualize a página e tente novamente.");
    }
  }
  const response = await fetch(`${API_URL}/api/payments/orders`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ ...orderData, ...(deviceSessionId ? { deviceSessionId } : {}) }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao criar ordem de pagamento.");
  }

  return data;
}

export async function getOrderStatus(orderId) {
  const response = await fetch(`${API_URL}/api/payments/orders/${orderId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao consultar status da ordem.");
  }

  return data;
}

export const paymentService = {
  getMercadoPagoConfig,
  getQuoteOptions,
  createQuote,
  createOrder,
  getOrderStatus,
};
