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

export async function deletar(id, token) {
  try {
    const response = await fetch(`${API_URL}/api/cursos/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};
      throw new Error(
        data.message || `Erro ao excluir curso (Status: ${response.status})`
      );
    }

    return true;
  } catch (error) {
    console.error(`Erro em deletar Curso ${id}:`, error);
    throw error;
  }
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
    // Ajustado para PATCH conforme o backend que atualiza o status da matrícula para CANCELADA
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/matricula/${usuarioId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "CANCELADA" }),
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

export async function listarAlunosDoCurso(cursoId, token) {
  try {
    const response = await fetch(`${API_URL}/api/cursos/${cursoId}/alunos`, {
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
