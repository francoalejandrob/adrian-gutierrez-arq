import AiChat from "./chat";

export default function AiPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-carbon">Archi AI</h1>
      <p className="mt-1 text-sm text-carbon/60">
        Asistente interno del estudio: tareas vencidas, pagos pendientes, leads por contactar,
        resúmenes de proyecto, finanzas y marketing.
      </p>

      <div className="mt-6">
        <AiChat />
      </div>
    </div>
  );
}
