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
    let todasAsRespostas = [];
    let pagina = 0;
    let tamanhoPorPagina = 100; // Buscamos blocos de 100 por vez para ser rápido e eficiente
    let temMaisPaginas = true;

    while (temMaisPaginas) {
      const response = await fetch(
        `${API_URL}/api/respostas/minhas?page=${pagina}&size=${tamanhoPorPagina}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Erro ao carregar o histórico de respostas."
        );
      }

      const dados = response.json ? await response.json() : response;

      // O Spring Data retorna um objeto PaginaResponse ou Page contendo 'content'
      const conteudo = dados.content || dados.dados || (Array.isArray(dados) ? dados : []);

      if (conteudo.length > 0) {
        todasAsRespostas.push(...conteudo);
      }

      // Verifica se chegamos na última página com base nas flags do Spring Data ou se a lista veio menor que o tamanho
      if (dados.last === true || conteudo.length < tamanhoPorPagina || conteudo.length === 0) {
        temMaisPaginas = false;
      } else {
        pagina++;
      }
    }

    return todasAsRespostas;
  } catch (error) {
    console.error("Erro em listarMinhasRespostas:", error);
    throw error;
  }
}
/**
 * Busca o histórico de respostas de um aluno específico (Para uso do Admin/Professor)
 * @param {Number|String} alunoId
 */
export async function listarRespostasPorAluno(alunoId) {
  try {
    const response = await fetch(`${API_URL}/api/respostas/aluno/${alunoId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          "Erro ao carregar o histórico de respostas do aluno."
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Erro em listarRespostasPorAluno:", error);
    throw error;
  }
}
