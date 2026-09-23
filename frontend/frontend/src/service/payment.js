import { API_URL } from "../config/api";

export async function createCheckout(courseId) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/payments/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ courseId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao iniciar o processo de pagamento.");
  }

  return data;
}
