import { useEffect } from "react";

export default function AlertModal({
  isOpen,
  type = "success",
  message,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  // Efeito para fechar sozinho após 3 segundos se for do tipo sucesso ou erro
  useEffect(() => {
    if (type === "success" || type === "error") {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, type, onClose]);

  const styles = {
    success: {
      bg: "bg-[#00D2DF]",
      title: "Sucesso! ",
    },
    error: {
      bg: "bg-[#FF42DE]",
      title: "Atenção! ",
    },
    confirm: {
      bg: "bg-[#FFD700]",
      title: "Confirmação ",
    },
  };

  const currentStyle = styles[type] || styles.success;
  const isConfirm = type === "confirm";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#F4EFE6] border-2 border-black rounded-2xl p-6 max-w-sm w-full shadow-[6px_6px_0_black] text-black">
        <div
          className={`${currentStyle.bg} border-2 border-black rounded-xl p-2 mb-4 text-center font-black uppercase text-sm shadow-[2px_2px_0_black]`}
        >
          {currentStyle.title}
        </div>

        {/* Mensagem */}
        <p className="font-bold text-slate-700 text-center mb-6 text-sm sm:text-base">
          {message}
        </p>

        {isConfirm ? (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-200 text-black border-2 border-black rounded-xl py-3 font-black shadow-[3px_3px_0_black] hover:bg-slate-300 transition"
            >
              NÃO
            </button>
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className="flex-1 bg-[#FF42DE] text-black border-2 border-black rounded-xl py-3 font-black shadow-[3px_3px_0_black] hover:brightness-95 transition"
            >
              SIM
            </button>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
}
