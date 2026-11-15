import { API_URL } from "../config/api";

export async function confirmarEmail(token) {
  try {
    const response = await fetch(`${API_URL}/api/usuario/email/confirmar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || data.error || `Erro ao confirmar e-mail (Status: ${response.status})`
      );
    }

    return true;
  } catch (error) {
    console.error("Erro em confirmarEmail:", error);
    throw error;
  }
}