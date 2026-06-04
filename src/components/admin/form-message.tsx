import { Alert, AlertDescription } from "@/components/ui/alert";

type FormMessageProps = {
  error?: string;
  success?: string;
};

export function FormMessage({ error, success }: FormMessageProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert>
        <AlertDescription>{success}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
