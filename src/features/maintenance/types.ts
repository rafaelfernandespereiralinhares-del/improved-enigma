import type { Database } from "@/lib/supabase-types";

export type Manutencao = Database['public']['Tables']['manutencoes']['Row'];
export type NewManutencao = Database['public']['Tables']['manutencoes']['Insert'];
export type UpdateManutencao = Database['public']['Tables']['manutencoes']['Update'];
