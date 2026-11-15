import api from "./api"; // Substitua pelo caminho da sua instância configurada do Axios

/**
 * Confirma o cadastro do usuário através do token recebido via hash na URL.
 * @param {string} token - Token alfanumérico com traços/sublinhados.
 * @returns {Promise<void>}
 */
export async function confirmarEmail(token) {
  try {
    // O backend espera um POST na rota /api/usuario/email/confirmar 
    // enviando um objeto com a propriedade { token }
    await api.post("/api/usuario/email/confirmar", { token });
  } catch (error) {
    // Extrai a mensagem de erro formatada pelo backend, se houver
    const mensagemErro =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Token inválido, expirado ou já utilizado.";
      
    throw new Error(mensagemErro);
  }
}