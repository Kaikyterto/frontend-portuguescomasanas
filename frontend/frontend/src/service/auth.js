import { API_URL } from "../config/api";

export async function login(email, senha) {
  const response = await fetch(`${API_URL}/api/usuario/authenticate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, senha }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "E-mail ou senha incorretos.");
  }

  const token = await response.text();

  localStorage.setItem("@PortuguessComAnas:token", token);

  return token;
}
