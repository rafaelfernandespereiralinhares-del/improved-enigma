import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AppRole, UserProfile } from '@/types/auth';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    roles: AppRole[];
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, nome: string, role: AppRole) => Promise<{ error: Error | null }>;
    loginAsTestAdmin?: () => Promise<void>;
    signOut: () => Promise<void>;
    hasRole: (role: AppRole) => boolean;
    hasAnyRole: (roles: AppRole[]) => boolean;
    primaryRole: AppRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [roles, setRoles] = useState<AppRole[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUserData = async (userId: string) => {
        try {
            const [profileRes, rolesRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('user_id', userId).single(),
                supabase.from('user_roles').select('*').eq('user_id', userId),
            ]);

            if (profileRes.data) {
                setProfile(profileRes.data as unknown as UserProfile);
            }

            const dbRoles = (rolesRes.data as unknown as { role: AppRole }[]).map(r => r.role);

            // Fallback: Check user metadata if no DB roles found (for initial signup/dev)
            if (dbRoles.length === 0) {
                const { data: { user } } = await supabase.auth.getUser();
                const metaRole = user?.user_metadata?.role as AppRole;
                if (metaRole) {
                    dbRoles.push(metaRole);
                }
            }

            setRoles(dbRoles);
        } catch (err) {
            console.error('Error fetching user data:', err);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    // Use setTimeout to avoid Supabase auth deadlock
                    setTimeout(async () => {
                        await fetchUserData(session.user.id);
                        if (isMounted) setLoading(false);
                    }, 0);
                } else {
                    setProfile(null);
                    setRoles([]);
                    setLoading(false);
                }
            }
        );

        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchUserData(session.user.id);
            }
            if (isMounted) setLoading(false);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error as Error | null };
    };

    const signUp = async (email: string, password: string, nome: string, role: AppRole) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nome, role },
                emailRedirectTo: window.location.origin,
            },
        });
        return { error: error as Error | null };
    };

    const loginAsTestAdmin = async () => {
        // Mock session for testing
        const mockUser: User = {
            id: 'test-admin-id',
            app_metadata: {},
            user_metadata: { role: 'ADMIN' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
        };

        const mockProfile: UserProfile = {
            id: 'test-profile-id',
            user_id: 'test-admin-id',
            empresa_id: null,
            loja_id: null,
            nome: 'Administrador de Teste',
            email: 'admin@teste.com',
            ativo: true,
        };

        setUser(mockUser);
        setProfile(mockProfile);
        setRoles(['ADMIN']);
        const mockSession = {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            token_type: 'bearer' as const,
            user: mockUser,
        };
        setSession(mockSession);
        setLoading(false);
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setRoles([]);
    };

    const hasRole = (role: AppRole) => roles.includes(role);
    const hasAnyRole = (r: AppRole[]) => r.some(role => roles.includes(role));

    const rolePriority: AppRole[] = ['ADMIN', 'DIRETORIA', 'FINANCEIRO', 'LOJA'];
    const primaryRole = rolePriority.find(r => roles.includes(r)) ?? null;

    return (
        <AuthContext.Provider value={{ session, user, profile, roles, loading, signIn, signUp, signOut, hasRole, hasAnyRole, primaryRole, loginAsTestAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
