import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login } from "@/app/login/actions";

type LoginPageProps = {
    searchParams: Promise<{
        error?: string;
    }>;
};

const errorMessages: Record<string, string> = {
    invalid: "Informe um email válido e uma senha com pelo menos 6 caracteres.",
    credentials: "Email ou senha inválidos.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const params = await searchParams;
    const errorMessage = params.error ? errorMessages[params.error] : null;

    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Entrar no painel</CardTitle>
                    <CardDescription>Acesso restrito aos administradores do Price.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={login} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700" htmlFor="email">
                                Email
                            </label>
                            <Input id="email" name="email" type="email" autoComplete="email" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700" htmlFor="password">
                                Senha
                            </label>
                            <Input id="password" name="password" type="password" autoComplete="current-password" required />
                        </div>
                        {errorMessage ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p> : null}
                        <Button className="w-full" type="submit">
                            Entrar
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
