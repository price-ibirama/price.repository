import { WhatsappSimulator } from "@/components/admin/whatsapp-simulator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isLocalDevelopment } from "@/lib/admin/development";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminSimulatorPage() {
  if (!isLocalDevelopment()) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Simulador WhatsApp</CardTitle>
              <CardDescription>
                Envie mensagens como um usuário e visualize a resposta gerada pela ferramenta.
              </CardDescription>
            </div>
            <Badge variant="secondary">Somente local</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <WhatsappSimulator />
        </CardContent>
      </Card>
    </div>
  );
}
