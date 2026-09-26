import { Routes, Route } from "react-router-dom";

import UserPage from "./pages/UserPage";
import AdminPage from "./pages/AdminPage";
import ConteudosPage from "./pages/ContentsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TermsPage from "./pages/TermsPage";
import StudentsPage from "./pages/StudentsPage";
import CursePage from "./pages/CursePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/conteudos" element={<ConteudosPage />} />
      <Route path="/user" element={<UserPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/alunos" element={<StudentsPage />} />

      {/* Rota ajustada para aceitar o ID dinâmico do curso/módulo */}
      <Route path="/curso/:id" element={<CursePage />} />

      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}
