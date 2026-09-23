import { API_URL } from "../config/api";

export async function register(userData) {
  const response = await fetch(`${API_URL}/api/usuario/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao criar conta.");
  }

  return data;
}
