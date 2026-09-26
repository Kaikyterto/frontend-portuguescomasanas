import { useLocation, Link } from "react-router-dom";
import Logo from "../assets/logo-sem-fundo.png";

export default function Navbar({ links = [], usuario }) {
  const nomeUsuario = usuario?.nome || "Estudante";
  const location = useLocation();

  // Verifica se o usuário é administrador (ajuste conforme a propriedade real do seu backend, ex: role === 'ADMIN' ou isAdmin === true)
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

        {/* ÁREA DO USUÁRIO E BOTÃO ADMIN */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="bg-[#FFD700] text-black text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffde21] transition"
            >
              Painel Admin
            </Link>
          )}

          <div className="flex items-center gap-2.5 bg-white border border-black rounded-lg px-3.5 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 border border-black shrink-0" />
            <span className="text-xs font-black tracking-widest text-black uppercase max-w-[140px] sm:max-w-[185px] truncate block">
              Bem-vindo, {nomeUsuario.split(" ")[0]}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
