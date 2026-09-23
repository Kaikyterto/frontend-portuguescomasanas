export default function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-[#F4EFE6] border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 text-slate-900 ${className}`}
    >
      {children}
    </div>
  );
}
