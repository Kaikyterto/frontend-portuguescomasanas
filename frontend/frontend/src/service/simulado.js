import { API_URL } from "../config/api";

export async function criar(simuladoData, token) {
  try {
    const response = await fetch(`${API_URL}/api/simulados`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(simuladoData),
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      const error = new Error(
        data.message || `Erro ao criar simulado (Status: ${response.status})`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro em criar simulado:", error);
    throw error;
  }
}

export async function listar(token, page = 0, size = 10) {
  try {
    const params = new URLSearchParams({
      page: page,
      size: size,
    });

    const response = await fetch(
      `${API_URL}/api/simulados?${params.toString()}`,
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
      const error = new Error(
        data.message || `Erro ao listar simulados (Status: ${response.status})`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro em listar simulados:", error);
    throw error;
  }
}

export async function detalhar(id, token) {
  try {
    const response = await fetch(`${API_URL}/api/simulados/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      const error = new Error(
        data.message || `Erro ao detalhar simulado (Status: ${response.status})`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro em detalhar simulado:", error);
    throw error;
  }
}

export async function atualizar(id, simuladoData, token) {
  try {
    const response = await fetch(`${API_URL}/api/simulados/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(simuladoData),
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      const error = new Error(
        data.message ||
          `Erro ao atualizar simulado (Status: ${response.status})`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro em atualizar simulado:", error);
    throw error;
  }
}

export async function alterarAtivo(id, ativo, token) {
  try {
    const response = await fetch(`${API_URL}/api/simulados/${id}/ativo`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ativo }),
    });

    if (response.status === 204) {
      return true;
    }

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      const error = new Error(
        data.message ||
          `Erro ao alterar status do simulado (Status: ${response.status})`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Erro em alterarAtivo:", error);
    throw error;
  }
}

export async function deletar(id, token) {
  try {
    const response = await fetch(`${API_URL}/api/simulados/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 204) {
      return true;
    }

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      const error = new Error(
        data.message || `Erro ao deletar simulado (Status: ${response.status})`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Erro em deletar simulado:", error);
    throw error;
  }
}

// --- Métodos de Tentativas e Resolução do Aluno ---

export async function iniciarTentativa(simuladoId, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/simulados/${simuladoId}/tentativas`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      const error = new Error(
        data.message || `Erro ao iniciar tentativa (Status: ${response.status})`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro em iniciarTentativa:", error);
    throw error;
  }
}

export async function listarHistorico(
  simuladoId,
  alunoId = null,
  token,
  page = 0,
  size = 10
) {
  try {
    const params = new URLSearchParams({
      page: page,
      size: size,
    });
    if (alunoId) params.append("alunoId", alunoId);

    const response = await fetch(
      `${API_URL}/api/simulados/${simuladoId}/tentativas?${params.toString()}`,
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
    console.log("listarHistorico response:", data);

    if (!response.ok) {
      const error = new Error(
        data.message ||
          `Erro ao buscar histórico de tentativas (Status: ${response.status})`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro em listarHistorico:", error);
    throw error;
  }
}

export async function buscarTentativa(tentativaId, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/simulados/tentativas/${tentativaId}`,
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
      const error = new Error(
        data.message || `Erro ao buscar tentativa (Status: ${response.status})`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro em buscarTentativa:", error);
    throw error;
  }
}

export async function responderQuestao(
  tentativaId,
  questaoId,
  alternativaId,
  token
) {
  try {
    const response = await fetch(
      `${API_URL}/api/simulados/tentativas/${tentativaId}/respostas`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ questaoId, alternativaId }),
      }
    );

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      const error = new Error(
        data.message || `Erro ao salvar resposta (Status: ${response.status})`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro em responderQuestao:", error);
    throw error;
  }
}

export async function finalizarTentativa(tentativaId, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/simulados/tentativas/${tentativaId}/finalizar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      const error = new Error(
        data.message ||
          `Erro ao finalizar tentativa (Status: ${response.status})`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro em finalizarTentativa:", error);
    throw error;
  }
}

// --- Novo Método de Ranking para Equipe (Admin/Professor) ---

export async function obterRanking(simuladoId, token, page = 0, size = 10) {
  try {
    const params = new URLSearchParams({
      page: page,
      size: size,
    });

    const response = await fetch(
      `${API_URL}/api/simulados/${simuladoId}/ranking?${params.toString()}`,
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
      const error = new Error(
        data.message ||
          `Erro ao obter ranking do simulado (Status: ${response.status})`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro em obterRanking:", error);
    throw error;
  }
}

export const simuladoService = {
  criar,
  listar,
  detalhar,
  atualizar,
  alterarAtivo,
  deletar,
  iniciarTentativa,
  listarHistorico,
  buscarTentativa,
  responderQuestao,
  finalizarTentativa,
  obterRanking,
};
