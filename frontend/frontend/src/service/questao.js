import { API_URL } from "../config/api";

export async function criarQuestao(questaoData, token) {
  try {
    const response = await fetch(`${API_URL}/api/questoes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(questaoData),
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao cadastrar questão (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em criarQuestao:", error);
    throw error;
  }
}

export async function listar(token) {
  try {
    const response = await fetch(`${API_URL}/api/questoes`, {
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
        data.message || `Erro ao listar questões (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em listar questões:", error);
    throw error;
  }
}

export async function atualizar(id, questaoData, token) {
  try {
    const response = await fetch(`${API_URL}/api/questoes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(questaoData),
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao atualizar questão (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em atualizar questão:", error);
    throw error;
  }
}

export async function deletar(id, token) {
  try {
    const response = await fetch(`${API_URL}/api/questoes/${id}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};
      throw new Error(
        data.message || `Erro ao deletar questão (Status: ${response.status})`
      );
    }

    return true;
  } catch (error) {
    console.error("Erro em deletar questão:", error);
    throw error;
  }
}

export const questaoService = {
  criarQuestao,
  listar,
  atualizar,
  deletar,
};
