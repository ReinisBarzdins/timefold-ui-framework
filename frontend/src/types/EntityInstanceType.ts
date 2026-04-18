export type EntityInstanceType = {
  id?: string | null;
  label: string;
  planningVariables: Record<string, unknown>;
  details?: Record<string, unknown> | null;
};