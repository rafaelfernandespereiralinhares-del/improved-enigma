import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, DollarSign, Target, FileCheck, AlertTriangle, CreditCard, Receipt,
    Building2, Users, Brain, LogOut, Store, ChevronLeft, UserCog, Megaphone, Wallet, CalendarDays, BarChart3,
    Home, Smartphone, Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NavItem {
    label: string;
    icon: React.ElementType;
    path: string;
}

export default function AppSidebar() {
    const { primaryRole, profile, signOut, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    // Loading Skeleton
    if (loading) {
        return (
            <aside className={cn('flex h-screen flex-col bg-sidebar', collapsed ? 'w-16' : 'w-64')}>
                <div className="h-16 border-b border-sidebar-border" />
                <div className="flex-1 p-3 space-y-2">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 w-full animate-pulse bg-sidebar-accent/10 rounded-md" />)}
                </div>
            </aside>
        );
    }

    const navItems: NavItem[] = [];

    if (primaryRole === 'ADMIN') {
        navItems.push(
            { label: 'Painel Macro', icon: LayoutDashboard, path: '/admin/dashboard' },
            { label: 'Visão Geral (Loja)', icon: Store, path: '/loja/dashboard' },
            { label: 'Manutenção', icon: Wrench, path: '/loja/manutencao' },
            { label: 'Caixa Diário', icon: DollarSign, path: '/loja/caixa' },
            { label: 'Conciliação', icon: FileCheck, path: '/financeiro/conciliacao' },
            { label: 'Metas', icon: Target, path: '/financeiro/metas' },
            { label: 'Metas Semanais', icon: CalendarDays, path: '/financeiro/metas-semanais' },
            { label: 'Contas a Pagar', icon: CreditCard, path: '/financeiro/contas-pagar' },
            { label: 'Contas a Receber', icon: Receipt, path: '/financeiro/contas-receber' },
            { label: 'Custo Casa', icon: Home, path: '/financeiro/custo-casa' },
            { label: 'Máquina Amarela', icon: Smartphone, path: '/maquina-amarela' },
            { label: 'Auditoria', icon: AlertTriangle, path: '/financeiro/auditoria' },
            { label: 'Funcionários', icon: UserCog, path: '/financeiro/funcionarios' },
            { label: 'Campanhas', icon: Megaphone, path: '/financeiro/campanhas' },
            { label: 'Folha & DRE', icon: Wallet, path: '/financeiro/folha' },
            { label: 'Planejamento DRE', icon: BarChart3, path: '/diretoria/planejamento' },
            { label: 'Relatório IA', icon: Brain, path: '/diretoria/relatorio-ia' },
            { label: 'Empresas', icon: Building2, path: '/admin/empresas' },
            { label: 'Lojas', icon: Store, path: '/admin/lojas' },
            { label: 'Usuários', icon: Users, path: '/admin/usuarios' },
        );
    }

    if (primaryRole === 'LOJA') {
        navItems.push(
            { label: 'Visão Geral', icon: LayoutDashboard, path: '/loja/dashboard' },
            { label: 'Manutenção', icon: Wrench, path: '/loja/manutencao' },
            { label: 'Caixa Diário', icon: DollarSign, path: '/loja/caixa' },
            { label: 'Máquina Amarela', icon: Smartphone, path: '/maquina-amarela' },
        );
    }

    if (primaryRole === 'FINANCEIRO') {
        navItems.push(
            { label: 'Visão Geral (Loja)', icon: Store, path: '/loja/dashboard' },
            { label: 'Manutenção', icon: Wrench, path: '/loja/manutencao' },
            { label: 'Caixa Diário', icon: DollarSign, path: '/loja/caixa' },
            { label: 'Conciliação', icon: FileCheck, path: '/financeiro/conciliacao' },
            { label: 'Metas', icon: Target, path: '/financeiro/metas' },
            { label: 'Metas Semanais', icon: CalendarDays, path: '/financeiro/metas-semanais' },
            { label: 'Contas a Pagar', icon: CreditCard, path: '/financeiro/contas-pagar' },
            { label: 'Contas a Receber', icon: Receipt, path: '/financeiro/contas-receber' },
            { label: 'Custo Casa', icon: Home, path: '/financeiro/custo-casa' },
            { label: 'Máquina Amarela', icon: Smartphone, path: '/maquina-amarela' },
            { label: 'Auditoria', icon: AlertTriangle, path: '/financeiro/auditoria' },
            { label: 'Funcionários', icon: UserCog, path: '/financeiro/funcionarios' },
            { label: 'Campanhas', icon: Megaphone, path: '/financeiro/campanhas' },
            { label: 'Folha & DRE', icon: Wallet, path: '/financeiro/folha' },
            { label: 'Planejamento DRE', icon: BarChart3, path: '/financeiro/planejamento' },
        );
    }

    if (primaryRole === 'DIRETORIA') {
        navItems.push(
            { label: 'Visão Geral (Macro)', icon: LayoutDashboard, path: '/diretoria/dashboard' },
            { label: 'Planejamento DRE', icon: BarChart3, path: '/diretoria/planejamento' },
            { label: 'Relatório IA', icon: Brain, path: '/diretoria/relatorio-ia' },
        );
    }

    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
            >
                <Smartphone className="h-6 w-6" />
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 md:relative',
                    collapsed ? 'w-16' : 'w-64',
                    !isOpen && '-translate-x-full md:translate-x-0'
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
                    {(!collapsed || isOpen) && (
                        <div className="flex items-center gap-2">
                            <Store className="h-6 w-6 text-sidebar-primary" />
                            <span className="font-display text-lg font-bold text-sidebar-primary">NEXUS</span>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:block"
                    >
                        <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    {navItems.map(item => {
                        const active = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => { navigate(item.path); setIsOpen(false); }}
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                                    active
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                                )}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                                {(!collapsed || isOpen) && <span>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* User info + logout */}
                <div className="border-t border-sidebar-border p-3">
                    {!collapsed && (
                        <div className="mb-2 px-3">
                            <p className="text-xs font-medium text-sidebar-foreground/90 truncate">{profile?.nome}</p>
                            <p className="text-xs text-sidebar-foreground/50 truncate">
                                {primaryRole === 'ADMIN' && 'Administrador'}
                                {primaryRole === 'LOJA' && 'Loja'}
                                {primaryRole === 'FINANCEIRO' && 'Financeiro'}
                                {primaryRole === 'DIRETORIA' && 'Diretoria'}
                                {!['ADMIN', 'LOJA', 'FINANCEIRO', 'DIRETORIA'].includes(primaryRole || '') && primaryRole}
                            </p>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { signOut(); navigate('/login'); }}
                        className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                        <LogOut className="h-4 w-4" />
                        {!collapsed && 'Sair'}
                    </Button>
                </div>
            </aside>
        </>
    );
}
