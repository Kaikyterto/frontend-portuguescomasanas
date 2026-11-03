import { API_URL } from "../config/api";

export async function solicitarRedefinicao(email) {
  try {
    const response = await fetch(`${API_URL}/api/usuario/senha/solicitar-redefinicao`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao solicitar redefinição de senha (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em solicitarRedefinicao:", error);
    throw error;
  }
}

export async function redefinirSenha(token, novaSenha) {
  try {
    const response = await fetch(`${API_URL}/api/usuario/senha/redefinir`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, novaSenha }),
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao redefinir senha (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em redefinirSenha:", error);
    throw error;
  }
}

export const redefinicaoSenhaService = {
  solicitarRedefinicao,
  redefinirSenha,
};