import { API_URL } from "../config/api";

export async function listarAssuntos(token) {
  try {
    const response = await fetch(`${API_URL}/api/assuntos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : [];

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao listar assuntos (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em listarAssuntos:", error);
    throw error;
  }
}

export async function criarAssunto(assuntoData, token) {
  try {
    const response = await fetch(`${API_URL}/api/assuntos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(assuntoData),
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao cadastrar assunto (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em criarAssunto:", error);
    throw error;
  }
}

export const assuntoService = {
  listarAssuntos,
  criarAssunto,
};
