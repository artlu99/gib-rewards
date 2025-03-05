import {
  ErrorComponent,
  type ErrorComponentProps,
} from "@tanstack/react-router";

export function CastErrorComponent({ error }: ErrorComponentProps) {
  return <ErrorComponent error={error} />;
}
