import { API_URL } from "../config/api";

export async function listar(token) {
  try {
    const response = await fetch(`${API_URL}/api/cursos`, {
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
        data.message || `Erro ao listar cursos (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em listar Cursos:", error);
    throw error;
  }
}

export async function buscarPorId(id, token) {
  try {
    const response = await fetch(`${API_URL}/api/cursos/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao buscar curso (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error(`Erro em buscarPorId (Curso ${id}):`, error);
    throw error;
  }
}

export async function criar(cursoData, token) {
  try {
    const response = await fetch(`${API_URL}/api/cursos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(cursoData),
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao cadastrar curso (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em criar Curso:", error);
    throw error;
  }
}

export async function atualizar(id, cursoData, token) {
  try {
    const response = await fetch(`${API_URL}/api/cursos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(cursoData),
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao atualizar curso (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error(`Erro em atualizar Curso ${id}:`, error);
    throw error;
  }
}

export async function deletar(id, deleteRequestData, token) {
  const response = await fetch(`${API_URL}/api/cursos/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(deleteRequestData), // Deve conter { nomeCurso, senha, cienteConsequencias }
  });

  if (!response.ok) {
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    throw new Error(data.message || "Erro ao excluir curso");
  }
  return true;
}

export async function matricular(cursoId, usuarioId, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/matricular`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ usuarioId }),
      }
    );

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message ||
          `Erro ao conceder acesso ao curso (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em matricular:", error);
    throw error;
  }
}

export async function removerMatricula(cursoId, usuarioId, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/matricula/${usuarioId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "CANCELADA" }), // O DTO espera este objeto
      }
    );

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message ||
          `Erro ao remover acesso ao curso (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em removerMatricula:", error);
    throw error;
  }
}

export async function listarAlunosDoCurso(cursoId, page = 0, size = 10, token) {
  let actualPage = page;
  let actualSize = size;
  let actualToken = token;

  if (typeof page === "string" && !token) {
    actualToken = page;
    actualPage = 0;
    actualSize = 10;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/alunos?page=${actualPage}&size=${actualSize}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(actualToken ? { Authorization: `Bearer ${actualToken}` } : {}),
        },
      }
    );

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : [];

    if (!response.ok) {
      throw new Error(
        data.message ||
          `Erro ao listar alunos do curso (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em listarAlunosDoCurso:", error);
    throw error;
  }
}

export const cursoService = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  deletar,
  matricular,
  removerMatricula,
  listarAlunosDoCurso,
};
