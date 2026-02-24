import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
    const { session, loading, primaryRole } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        console.log('Index: Auth state changes', { session: !!session, loading, primaryRole });
        if (loading) return;
        if (!session) {
            console.log('Index: No session found, redirecting to login');
            navigate('/login', { replace: true });
            return;
        }

        console.log('Index: User logged in, redirecting based on role:', primaryRole);
        switch (primaryRole) {
            case 'ADMIN': navigate('/admin/dashboard', { replace: true }); break;
            case 'DIRETORIA': navigate('/diretoria/dashboard', { replace: true }); break;
            case 'FINANCEIRO': navigate('/financeiro/conciliacao', { replace: true }); break;
            case 'LOJA': navigate('/loja/dashboard', { replace: true }); break;
            default:
                console.warn('Index: No recognized role, fallback to login');
                navigate('/login', { replace: true });
        }
    }, [loading, session, primaryRole, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
}
