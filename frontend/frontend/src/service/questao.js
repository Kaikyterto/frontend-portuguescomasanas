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
      const error = new Error(
        data.message || `Erro ao cadastrar questão (Status: ${response.status})`
      );
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro em criarQuestao:", error);
    throw error;
  }
}

export async function listar(token, page = 0, size = 20) {
  try {
    const response = await fetch(
      `${API_URL}/api/questoes?page=${page}&size=${size}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : [];

    if (!response.ok) {
      const error = new Error(
        data.message || `Erro ao listar questões (Status: ${response.status})`
      );
      error.status = response.status;
      throw error;
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
      const error = new Error(
        data.message || `Erro ao atualizar questão (Status: ${response.status})`
      );
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro em atualizar questão:", error);
    throw error;
  }
}

export async function deletar(id, deleteRequestData, token) {
  try {
    const response = await fetch(`${API_URL}/api/questoes/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(deleteRequestData), // Envia a senha e os dados de confirmação no corpo
    });

    // Se retornar 204 No Content, a resposta pode vir vazia
    if (response.status === 204) {
      return true;
    }

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      const error = new Error(
        data.message ||
          data.error ||
          `Erro ao deletar questão (Status: ${response.status})`
      );
      // Anexa o status HTTP no objeto de erro para facilitar o tratamento na Page
      error.status = response.status;
      error.data = data;
      throw error;
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
