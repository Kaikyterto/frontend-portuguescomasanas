import { API_URL } from "../config/api";

// ==========================================
// MÉTODOS DE ARQUIVOS PDF 
// ==========================================

export async function fazerUploadArquivoPdf(file, token) {
  try {
    const form = new FormData();
    form.append("arquivo", file);

    const response = await fetch(`${API_URL}/api/arquivos-pdf`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // ATENÇÃO: Não definir "Content-Type" ao usar FormData para que o navegador inclua o boundary.
      },
      body: form,
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao enviar arquivo PDF (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em fazerUploadArquivoPdf:", error);
    throw error;
  }
}

export async function listarArquivosPdf(page = 0, size = 20, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/arquivos-pdf?page=${page}&size=${size}`,
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
        data.message || `Erro ao listar arquivos PDF (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em listarArquivosPdf:", error);
    throw error;
  }
}

export async function deletarArquivoPdfPermanente(arquivoId, token) {
  try {
    const response = await fetch(`${API_URL}/api/arquivos-pdf/${arquivoId}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};
      throw new Error(
        data.message || `Erro ao excluir arquivo PDF do Drive (Status: ${response.status})`
      );
    }

    return true;
  } catch (error) {
    console.error("Erro em deletarArquivoPdfPermanente:", error);
    throw error;
  }
}

// ==========================================
// MÉTODOS DE MATERIAIS DE PDF VINCULADOS A CURSOS
// ==========================================

export async function listarMateriaisPdfCurso(cursoId, page = 0, size = 20, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/materiais-pdf?page=${page}&size=${size}`,
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
        data.message || `Erro ao listar materiais do curso (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em listarMateriaisPdfCurso:", error);
    throw error;
  }
}

export async function vincularMaterialPdfCurso(cursoId, materialData, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/materiais-pdf`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(materialData),
      }
    );

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao vincular material PDF ao curso (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em vincularMaterialPdfCurso:", error);
    throw error;
  }
}

export async function atualizarMaterialPdfCurso(cursoId, materialId, materialData, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/materiais-pdf/${materialId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(materialData),
      }
    );

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(
        data.message || `Erro ao atualizar material PDF (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em atualizarMaterialPdfCurso:", error);
    throw error;
  }
}

export async function desvincularMaterialPdfCurso(cursoId, materialId, token) {
  try {
    const response = await fetch(
      `${API_URL}/api/cursos/${cursoId}/materiais-pdf/${materialId}`,
      {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};
      throw new Error(
        data.message || `Erro ao desvincular material PDF (Status: ${response.status})`
      );
    }

    return true;
  } catch (error) {
    console.error("Erro em desvincularMaterialPdfCurso:", error);
    throw error;
  }
}

export async function baixarOuVisualizarConteudoPdf(conteudoUrl, token, download = false) {
  try {
    const urlFinal = `${API_URL}${conteudoUrl}${download ? "?download=true" : ""}`;
    const response = await fetch(urlFinal, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(
        responseText || `Erro ao carregar conteúdo do PDF (Status: ${response.status})`
      );
    }

    const blob = await response.blob();
    return window.URL.createObjectURL(blob);
  } catch (error) {
    console.error("Erro em baixarOuVisualizarConteudoPdf:", error);
    throw error;
  }
}

// ==========================================
// MÉTODOS DE INTEGRAÇÃO COM GOOGLE DRIVE (ADMIN)
// ==========================================

export async function obterStatusDrive(token) {
  try {
    const response = await fetch(`${API_URL}/api/admin/integracoes/drive/status`, {
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
        data.message || `Erro ao buscar status do Google Drive (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em obterStatusDrive:", error);
    throw error;
  }
}

export async function autorizarGoogleDrive(token) {
  try {
    const response = await fetch(`${API_URL}/api/admin/integracoes/drive/autorizar`, {
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
        data.message || `Erro ao gerar URL de autorização do Drive (Status: ${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("Erro em autorizarGoogleDrive:", error);
    throw error;
  }
}

export async function desconectarGoogleDrive(token) {
  try {
    const response = await fetch(`${API_URL}/api/admin/integracoes/drive`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};
      throw new Error(
        data.message || `Erro ao desconectar Google Drive (Status: ${response.status})`
      );
    }

    return true;
  } catch (error) {
    console.error("Erro em desconectarGoogleDrive:", error);
    throw error;
  }
}


export const pdfService = {
  uploadArquivo: fazerUploadArquivoPdf,
  listarArquivos: listarArquivosPdf,
  deletarArquivoPermanente: deletarArquivoPdfPermanente,
  listarMateriaisCurso: listarMateriaisPdfCurso,
  vincularMaterial: vincularMaterialPdfCurso,
  atualizarMaterial: atualizarMaterialPdfCurso,
  desvincularMaterial: desvincularMaterialPdfCurso,
  obterConteudoUrl: baixarOuVisualizarConteudoPdf,
  driveStatus: obterStatusDrive,
  driveAutorizar: autorizarGoogleDrive,
  driveDesconectar: desconectarGoogleDrive,
};