import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
    return (
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
            <Card>
                <CardHeader>
                    <CardDescription>Price</CardDescription>
                    <CardTitle className="text-4xl font-bold tracking-tight">API de ofertas no WhatsApp</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground">
                        O webhook da Meta está disponível em <code className="rounded bg-muted px-2 py-1">/webhook</code>.
                    </p>
                </CardContent>
            </Card>
        </main>
    );
}
