import Card from "./Card";

export default function SidebarStats({ stats }) {
  return (
    <aside className="w-80 flex flex-col gap-4">
      <Card className="flex-1 flex flex-col gap-3">
        <div className="space-y-2 mt-2">
          <div className="bg-white border border-black rounded-xl p-3 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">
                Questões respondidas
              </p>
              <p className="text-lg font-extrabold">
                {stats.total.toLocaleString("pt-BR")} Questões
              </p>
            </div>
            <span className="text-xl">📚</span>
          </div>

          <div className="bg-white border border-black rounded-xl p-3 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">
                Acertos
              </p>
              <p className="text-lg font-extrabold text-green-600">
                {stats.correct}
              </p>
            </div>
            <span className="text-xl">✅</span>
          </div>

          <div className="bg-white border border-black rounded-xl p-3 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">
                Erros
              </p>
              <p className="text-lg font-extrabold text-red-500">
                {stats.wrong}
              </p>
            </div>
            <span className="text-xl">❌</span>
          </div>
        </div>
      </Card>
    </aside>
  );
}
