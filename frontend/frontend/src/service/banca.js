import { API_URL } from "../config/api";

export async function listar(token) {
  try {
    const response = await fetch(`${API_URL}/api/bancas`, {
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
        data.message || `Erro ao listar bancas (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em listar bancas:", error);
    throw error;
  }
}

export async function criarBanca(bancaData, token) {
  try {
    const response = await fetch(`${API_URL}/api/bancas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(bancaData),
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao cadastrar banca (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em criarBanca:", error);
    throw error;
  }
}

export const bancaService = {
  listar,
  criarBanca,
};
