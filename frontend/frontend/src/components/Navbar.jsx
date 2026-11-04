import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import Logo from "../assets/logo-sem-fundo.png";
import { useTheme } from "../ThemeContext"; 

export default function Navbar({ links = [], usuario }) {
  const nomeUsuario = usuario?.nome || "Estudante";
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const { theme, toggleTheme } = useTheme(); 

  // Verifica se o usuário é administrador
  const isAdmin = usuario?.perfil === "ADMIN" || usuario?.perfi === "admin";

  const handleLogout = () => {
    localStorage.removeItem("@PortuguessComAnas:token");
    navigate("/login");
  };

  return (
    <nav
      className="
      relative 
      bg-[#F4EFE6] dark:bg-slate-900 
      border-b-2 border-black dark:border-slate-800 
      px-4 md:px-8 
      py-4 
      font-sans 
      text-slate-900 dark:text-slate-100
      z-50
      transition-colors duration-200
      "
    >
      <div
        className="
        flex 
        items-center 
        justify-between 
        max-w-7xl 
        mx-auto
        "
      >
        {/* LOGO */}
        <div className="flex items-center h-9 md:h-10">
          <img
            src={Logo}
            alt="Português com as Anas"
            className="h-full w-auto object-contain"
          />
        </div>

        {/* LINKS DESKTOP */}
        <div
          className="
          hidden 
          md:flex 
          gap-8 
          font-black 
          tracking-widest 
          text-xs
          uppercase
          "
        >
          {links.map((link, index) => {
            const isActive = location.pathname === link.href;

            return (
              <a
                key={index}
                href={link.href || "#"}
                className={`
                transition-all duration-150
                hover:text-black dark:hover:text-white hover:translate-y-[-1px]
                ${
                  isActive 
                    ? "border-b-2 border-black dark:border-white pb-0.5 text-black dark:text-white" 
                    : "text-slate-600 dark:text-slate-400"
                }
                `}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        {/* ÁREA DO USUÁRIO, BOTÃO DE TEMA, PAINEL ADMIN, SAIR E HAMBÚRGUER MOBILE */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* BOTÃO DE TEMA (DESKTOP) */}
          <button
            onClick={toggleTheme}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider bg-amber-200 dark:bg-slate-800 text-black dark:text-white rounded-lg border border-black dark:border-slate-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition cursor-pointer"
            title="Alternar tema"
          >
            {theme === "dark" ? "☀️"  : "🌙"}
          </button>

          {isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:inline-block bg-[#FFD700] dark:bg-amber-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-black dark:border-slate-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none hover:bg-[#ffde21] transition"
            >
              Painel Admin
            </Link>
          )}

          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-black dark:border-slate-700 rounded-lg px-2.5 sm:px-3.5 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 border border-black shrink-0" />
            <span className="text-[11px] sm:text-xs font-black tracking-widest text-black dark:text-white uppercase max-w-[100px] sm:max-w-[185px] truncate block">
              <span className="hidden sm:inline">Bem-vindo, </span>
              {nomeUsuario.split(" ")[0]}
            </span>
          </div>

          {/* BOTÃO DE SAIR / LOGOUT (DESKTOP) */}
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1 bg-[#FF6B6B] hover:bg-red-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-black dark:border-slate-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition cursor-pointer"
            title="Terminar sessão"
          >
            Sair
          </button>

          {/* BOTÃO HAMBÚRGUER (Visível apenas no mobile) */}
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 bg-white dark:bg-slate-800 border-2 border-black dark:border-slate-700 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none focus:outline-none cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition"
            aria-label="Abrir Menu"
          >
            <span
              className={`block w-4 h-0.5 bg-black dark:bg-white transition-transform duration-200 ${
                menuAberto ? "rotate-45 translate-y-1.5" : "-translate-y-1"
              }`}
            />
            <span
              className={`block w-4 h-0.5 bg-black dark:bg-white transition-opacity duration-200 ${
                menuAberto ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block w-4 h-0.5 bg-black dark:bg-white transition-transform duration-200 ${
                menuAberto ? "-rotate-45 -translate-y-1.5" : "translate-y-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* MENU DROPDOWN MOBILE */}
      {menuAberto && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#F4EFE6] dark:bg-slate-900 border-b-2 border-black dark:border-slate-800 p-4 shadow-xl flex flex-col gap-3 animate-fadeIn">
          {links.map((link, index) => {
            const isActive = location.pathname === link.href;

            return (
              <a
                key={index}
                href={link.href || "#"}
                onClick={() => setMenuAberto(false)}
                className={`font-black tracking-widest text-xs uppercase p-2.5 rounded-lg border border-black dark:border-slate-700 transition ${
                  isActive
                    ? "bg-[#7B5CFA] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                }`}
              >
                {link.label}
              </a>
            );
          })}

          {/* BOTÃO DE TEMA (MOBILE) */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 bg-amber-200 dark:bg-slate-800 text-black dark:text-white text-xs font-black uppercase tracking-wider p-2.5 rounded-lg border border-black dark:border-slate-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            {theme === "dark" ? "☀️" : "🌙 "}
          </button>

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMenuAberto(false)}
              className="bg-[#FFD700] dark:bg-amber-500 text-black text-xs font-black uppercase tracking-wider p-2.5 text-center rounded-lg border border-black dark:border-slate-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Painel Admin
            </Link>
          )}

          {/* BOTÃO DE SAIR / LOGOUT (MOBILE) */}
          <button
            onClick={() => {
              setMenuAberto(false);
              handleLogout();
            }}
            className="bg-[#FF6B6B] text-black text-xs font-black uppercase tracking-wider p-2.5 text-center rounded-lg border border-black dark:border-slate-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
          >
             Sair da conta
          </button>
        </div>
      )}
    </nav>
  );
}