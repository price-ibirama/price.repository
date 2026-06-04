export default function HomePage() {
    return (
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-green-700">
                Price
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950">
                API de ofertas no WhatsApp
            </h1>
            <p className="mt-4 text-lg text-slate-600">
                O webhook da Meta está disponível em <code className="rounded bg-slate-200 px-2 py-1">/webhook</code>.
            </p>
        </main>
    );
}
