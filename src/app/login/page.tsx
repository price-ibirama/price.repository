import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
                    <form action={login}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input id="email" name="email" type="email" autoComplete="email" required />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="password">Senha</FieldLabel>
                                <Input id="password" name="password" type="password" autoComplete="current-password" required />
                            </Field>
                            {errorMessage ? (
                                <Alert variant="destructive">
                                    <AlertDescription>{errorMessage}</AlertDescription>
                                </Alert>
                            ) : null}
                            <Button className="w-full" type="submit">
                                Entrar
                            </Button>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
