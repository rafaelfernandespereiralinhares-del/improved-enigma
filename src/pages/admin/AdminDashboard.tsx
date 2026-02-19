import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        users: 0,
        stores: 0,
        companies: 0,
        recentActivity: [] as any[]
    });

    useEffect(() => {
        const fetchStats = async () => {
            const [users, stores, companies] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('lojas').select('*', { count: 'exact', head: true }),
                supabase.from('empresas').select('*', { count: 'exact', head: true })
            ]);

            // Fetch recent 5 users for activity feed as a proxy for "activity"
            const { data: recentUsers } = await supabase
                .from('profiles')
                .select('nome, email, created_at, role')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                users: users.count || 0,
                stores: stores.count || 0,
                companies: companies.count || 0,
                recentActivity: recentUsers || []
            });
        };

        fetchStats();
    }, []);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Painel Administrativo</h1>
                <p className="text-muted-foreground">Visão geral do sistema Nexus</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.companies}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lojas Cadastradas</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.stores}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuários Totais</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.users}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Últimos Usuários Cadastrados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Cargo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.recentActivity.map((user, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{user.nome}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{user.role}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Ações Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Button
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() => navigate('/admin/usuarios')}
                        >
                            <span className="flex items-center gap-2">
                                <Users className="h-4 w-4" /> Gerenciar Usuários
                            </span>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() => navigate('/admin/empresas')}
                        >
                            <span className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" /> Nova Empresa
                            </span>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() => navigate('/admin/lojas')}
                        >
                            <span className="flex items-center gap-2">
                                <Store className="h-4 w-4" /> Nova Loja
                            </span>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
