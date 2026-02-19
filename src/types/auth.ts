export type AppRole = 'ADMIN' | 'DIRETORIA' | 'FINANCEIRO' | 'RH' | 'LOJA';

export interface UserProfile {
    id: string;
    user_id: string;
    empresa_id: string | null;
    loja_id: string | null;
    nome: string;
    email: string | null;
    ativo: boolean;
    avatar_url?: string;
    cargo?: string;
    departamento?: string;
}
