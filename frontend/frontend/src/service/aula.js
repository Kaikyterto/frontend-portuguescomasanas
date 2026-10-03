import { API_URL } from "../config/api";

export async function listarAulasPorModulo(cursoId, moduloId, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/modulos/${moduloId}/aulas`,
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
      throw new Error(
        data.message ||
          `Erro ao listar aulas do módulo (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em listarAulasPorModulo:", error);
    throw error;
  }
}

export async function criarAula(cursoId, moduloId, aulaData, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/modulos/${moduloId}/aulas`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(aulaData),
      }
    );

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao criar aula (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em criarAula:", error);
    throw error;
  }
}

export const aulaService = {
  listar: listarAulasPorModulo,
  criar: criarAula,
};
