import { API_URL } from "../config/api";

// Função auxiliar para montar os headers de requisição
function getHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Helper para parse de respostas mantendo o padrão do seu projeto
async function handleResponse(response, defaultMessage) {
  const responseText = await response.text();
  const data = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    throw new Error(
      data?.message || `${defaultMessage} (Status: ${response.status})`
    );
  }

  return data;
}

/**
 * Criar um novo link do Google Meet para um curso
 */
export async function criarMeetLink(cursoId, requestData, token) {
  try {
    const response = await fetch(`${API_URL}/api/cursos/${cursoId}/links-meet`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(requestData),
    });

    return await handleResponse(response, "Erro ao criar link do Meet");
  } catch (error) {
    console.error("Erro em criarMeetLink:", error);
    throw error;
  }
}

/**
 * Listar links do Meet de um curso (suporta paginação via params)
 * @param {number|string} cursoId 
 * @param {object} params - Objeto com paginação ex: { page: 0, size: 10 }
 * @param {string} token 
 */
export async function listarMeetLinks(cursoId, params = {}, token) {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_URL}/api/cursos/${cursoId}/links-meet${queryParams ? `?${queryParams}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(token),
    });

    return await handleResponse(response, "Erro ao listar links do Meet");
  } catch (error) {
    console.error("Erro em listarMeetLinks:", error);
    throw error;
  }
}

/**
 * Buscar detalhes de um link específico
 */
export async function buscarMeetLink(cursoId, linkId, token) {
  try {
    const response = await fetch(`${API_URL}/api/cursos/${cursoId}/links-meet/${linkId}`, {
      method: "GET",
      headers: getHeaders(token),
    });

    return await handleResponse(response, "Erro ao buscar link do Meet");
  } catch (error) {
    console.error("Erro em buscarMeetLink:", error);
    throw error;
  }
}


export async function obterUrlAcessoMeet(cursoId, linkId, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/links-meet/${linkId}/acessar`,
      {
        method: "GET",
        headers: getHeaders(token),
        redirect: "manual", // Impede que o browser siga o 302 automaticamente na chamada de API
      }
    );

    if (response.type === "opaqueredirect" || response.status === 302 || response.status === 301) {
      const location = response.headers.get("Location");
      if (location) return location;
    }

    if (!response.ok) {
      throw new Error(`Erro ao obter URL de acesso (Status: ${response.status})`);
    }

    return response.url;
  } catch (error) {
    console.error("Erro em obterUrlAcessoMeet:", error);
    throw error;
  }
}

/**
 * Atualizar um link do Meet existente
 */
export async function atualizarMeetLink(cursoId, linkId, requestData, token) {
  try {
    const response = await fetch(`${API_URL}/api/cursos/${cursoId}/links-meet/${linkId}`, {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify(requestData),
    });

    return await handleResponse(response, "Erro ao atualizar link do Meet");
  } catch (error) {
    console.error("Erro em atualizarMeetLink:", error);
    throw error;
  }
}

/**
 * Excluir um link do Meet (Retorna status 204 No Content)
 */
export async function excluirMeetLink(cursoId, linkId, token) {
  try {
    const response = await fetch(`${API_URL}/api/cursos/${cursoId}/links-meet/${linkId}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });

    if (!response.ok) {
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};
      throw new Error(
        data.message || `Erro ao excluir link do Meet (Status: ${response.status})`
      );
    }

    return true;
  } catch (error) {
    console.error("Erro em excluirMeetLink:", error);
    throw error;
  }
}

// Exportação consolidada igual ao gravacaoService
export const meetService = {
  criar: criarMeetLink,
  listar: listarMeetLinks,
  buscar: buscarMeetLink,
  obterUrlAcesso: obterUrlAcessoMeet,
  atualizar: atualizarMeetLink,
  excluir: excluirMeetLink,
};