import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
  status: string;
};

const destructiveStatuses = new Set(["erro", "rejeitado", "arquivada", "vencida", "inválida", "invalida"]);
const defaultStatuses = new Set(["publicada", "publicado", "aprovado", "alta"]);

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  if (destructiveStatuses.has(normalizedStatus)) {
    return <Badge variant="destructive">{status}</Badge>;
  }

  if (defaultStatuses.has(normalizedStatus)) {
    return <Badge>{status}</Badge>;
  }

  return <Badge variant="secondary">{status}</Badge>;
}
