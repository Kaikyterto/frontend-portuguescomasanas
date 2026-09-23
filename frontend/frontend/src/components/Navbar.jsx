import { useLocation } from "react-router-dom";
import Logo from "../assets/logo-sem-fundo.png";

export default function Navbar({ links = [], usuario }) {
  const nomeUsuario = usuario?.nome || "Estudante";
  const location = useLocation();

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
            // Verifica se o href do link corresponde à URL atual
            const isActive = location.pathname === link.href;

            return (
              <a
                key={index}
                href={link.href || "#"}
                className={`
                transition-all duration-150
                hover:text-black hover:translate-y-[-1px]
                ${
                  isActive
                    ? "border-b-2 border-black pb-0.5" // Aplica a listra se estiver ativo
                    : "text-slate-600"
                }
                `}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        <div className="flex items-center">
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
