import { API_URL } from "../config/api";

export async function listarModulos(cursoId, token) {
  try {
    const response = await fetch(`${API_URL}/api/cursos/${cursoId}/modulos`, {
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
        data.message || `Erro ao listar módulos (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em listarModulos:", error);
    throw error;
  }
}

export async function buscarModulo(cursoId, id, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/modulos/${id}`,
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
        data.message || `Erro ao buscar módulo (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error(`Erro em buscarModulo (ID: ${id}):`, error);
    throw error;
  }
}

export async function criarModulo(cursoId, moduloData, token) {
  try {
    const response = await fetch(`${API_URL}/api/cursos/${cursoId}/modulos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(moduloData),
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao cadastrar módulo (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em criarModulo:", error);
    throw error;
  }
}

export async function atualizarModulo(cursoId, id, moduloData, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/modulos/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(moduloData),
      }
    );

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao atualizar módulo (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error(`Erro em atualizarModulo (ID: ${id}):`, error);
    throw error;
  }
}

export async function deletarModulo(cursoId, id, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/modulos/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    // Como o backend retorna HttpStatus.NO_CONTENT (204), o body virá vazio.
    if (!response.ok) {
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};
      throw new Error(
        data.message || `Erro ao deletar módulo (Status: ${response.status})`
      );
    }

    return true;
  } catch (error) {
    console.error(`Erro em deletarModulo (ID: ${id}):`, error);
    throw error;
  }
}

export const moduloService = {
  listarModulos,
  buscarModulo,
  criarModulo,
  atualizarModulo,
  deletarModulo,
};
