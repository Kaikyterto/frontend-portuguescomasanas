import { API_URL } from "../config/api";

export async function buscarDadosUsuarioLogado(token) {
  try {
    const response = await fetch(`${API_URL}/api/usuario/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("@PortuguessComAnas:token");
      }
      throw new Error(
        data.message ||
          `Sessão expirada ou não autorizada (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em buscarDadosUsuarioLogado:", error);
    throw error;
  }
}

export async function listar(token) {
  try {
    const response = await fetch(`${API_URL}/api/usuario/listar`, {
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
        data.message || `Erro ao listar usuários (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em listar usuários:", error);
    throw error;
  }
}

// Nova função para buscar os cursos do usuário logado (correspondente ao endpoint /api/cursos/meus)
export async function listarMeusCursos(token) {
  try {
    const response = await fetch(`${API_URL}/api/cursos/meus`, {
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
        data.message ||
          `Erro ao buscar seus cursos (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em listarMeusCursos:", error);
    throw error;
  }
}

// Nova função para verificar se o usuário tem acesso a um curso específico (correspondente ao endpoint /api/cursos/{id}/tenho-acesso)
export async function verificarAcessoCurso(cursoId, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/tenho-acesso`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message ||
          `Erro ao verificar acesso ao curso (Status: ${response.status})`
      );
    }

    return data.temAcesso ?? false;
  } catch (error) {
    console.error(`Erro em verificarAcessoCurso para o ID ${cursoId}:`, error);
    return false;
  }
}

export const usuarioService = {
  buscarDadosUsuarioLogado,
  listar,
  listarMeusCursos,
  verificarAcessoCurso,
};
