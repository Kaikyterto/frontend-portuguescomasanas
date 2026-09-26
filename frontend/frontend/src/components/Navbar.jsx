import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Logo from "../assets/logo-sem-fundo.png";

export default function Navbar({ links = [], usuario }) {
  const nomeUsuario = usuario?.nome || "Estudante";
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  // Verifica se o usuário é administrador
  const isAdmin = usuario?.perfil === "ADMIN" || usuario?.perfi === "admin";

  return (
    <nav
      className="
      relative 
      bg-[#F4EFE6] 
      border-b-2 border-black 
      px-4 md:px-8 
      py-4 
      font-sans 
      text-slate-900 
      z-50
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
                hover:text-black hover:translate-y-[-1px]
                ${
                  isActive ? "border-b-2 border-black pb-0.5" : "text-slate-600"
                }
                `}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        {/* ÁREA DO USUÁRIO, BOTÃO ADMIN E HAMBÚRGUER MOBILE */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:inline-block bg-[#FFD700] text-black text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffde21] transition"
            >
              Painel Admin
            </Link>
          )}

          <div className="flex items-center gap-2.5 bg-white border border-black rounded-lg px-3.5 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 border border-black shrink-0" />
            <span className="text-xs font-black tracking-widest text-black uppercase max-w-[110px] sm:max-w-[185px] truncate block">
              Bem-vindo, {nomeUsuario.split(" ")[0]}
            </span>
          </div>

          {/* BOTÃO HAMBÚRGUER (Visível apenas no mobile) */}
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition"
            aria-label="Abrir Menu"
          >
            <span
              className={`block w-4 h-0.5 bg-black transition-transform duration-200 ${
                menuAberto ? "rotate-45 translate-y-1.5" : "-translate-y-1"
              }`}
            />
            <span
              className={`block w-4 h-0.5 bg-black transition-opacity duration-200 ${
                menuAberto ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block w-4 h-0.5 bg-black transition-transform duration-200 ${
                menuAberto ? "-rotate-45 -translate-y-1.5" : "translate-y-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* MENU DROPDOWN MOBILE */}
      {menuAberto && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#F4EFE6] border-b-2 border-black p-4 shadow-xl flex flex-col gap-3 animate-fadeIn">
          {links.map((link, index) => {
            const isActive = location.pathname === link.href;

            return (
              <a
                key={index}
                href={link.href || "#"}
                onClick={() => setMenuAberto(false)}
                className={`font-black tracking-widest text-xs uppercase p-2.5 rounded-lg border border-black transition ${
                  isActive
                    ? "bg-[#7B5CFA] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-white text-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                }`}
              >
                {link.label}
              </a>
            );
          })}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMenuAberto(false)}
              className="bg-[#FFD700] text-black text-xs font-black uppercase tracking-wider p-2.5 text-center rounded-lg border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Painel Admin
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
