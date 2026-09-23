import { API_URL } from "../config/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("@PortuguessComAnas:token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Salva uma única resposta
 * @param {Object} data
 */
export async function criarResposta(data) {
  try {
    const response = await fetch(`${API_URL}/api/respostas`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Erro ao salvar a resposta.");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro em criarResposta:", error);
    throw error;
  }
}

/**
 * @param {Array} respostas - Lista de objetos de respostas
 */
export async function criarRespostasEmLote(respostas) {
  try {
    const response = await fetch(`${API_URL}/api/respostas/lote`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(respostas),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Erro ao salvar as respostas em lote."
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Erro em criarRespostasEmLote:", error);
    throw error;
  }
}

export async function listarMinhasRespostas() {
  try {
    const response = await fetch(`${API_URL}/api/respostas/minhas`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Erro ao carregar o histórico de respostas."
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Erro em listarMinhasRespostas:", error);
    throw error;
  }
}
