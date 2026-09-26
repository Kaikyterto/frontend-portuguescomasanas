import { API_URL } from "../config/api";

export async function listarGravacoes(token) {
  try {
    const response = await fetch(`${API_URL}/api/gravacoes`, {
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
        data.message || `Erro ao listar gravações (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em listarGravacoes:", error);
    throw error;
  }
}

export async function criarGravacao(gravacaoData, token) {
  try {
    const response = await fetch(`${API_URL}/api/gravacoes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(gravacaoData),
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message ||
          `Erro ao cadastrar gravação (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em criarGravacao:", error);
    throw error;
  }
}

export const gravacaoService = {
  listar: listarGravacoes,
  criar: criarGravacao,
};
