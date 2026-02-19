import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Wrench, Target, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";

export default function LojaDashboard() {
    const { } = useAuth();
    const [stats, setStats] = useState({
        caixaHoje: 0,
        manutencoesAbertas: 0,
        metaMensal: 100000, // Default fallback
        metaRealizada: 0
    });

    useEffect(() => {
        const fetchLojaStats = async () => {
            const today = new Date().toISOString().split('T')[0];
            const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

            // 1. Caixa (Last closing or today's partial)
            const { data: caixa } = await supabase
                .from('fechamentos')
                .select('dinheiro, pix, cartao')
                .eq('data', today) // Ideally filter by store too if we had ID
                .maybeSingle();

            const totalCaixa = caixa ? (caixa.dinheiro + caixa.pix + caixa.cartao) : 0;

            // 2. Manutenções
            const { count: manutencoes } = await supabase
                .from('manutencoes')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Aberto');

            // 3. Metas
            const { data: metas } = await supabase
                .from('metas')
                .select('meta_mensal, realizado_faturamento')
                .gte('created_at', firstDayOfMonth) // Approximate month check
                .maybeSingle();

            setStats({
                caixaHoje: totalCaixa,
                manutencoesAbertas: manutencoes || 0,
                metaMensal: metas?.meta_mensal || 50000,
                metaRealizada: metas?.realizado_faturamento || 0
            });
        };

        fetchLojaStats();
    }, []);

    const percentualMeta = Math.min(100, (stats.metaRealizada / stats.metaMensal) * 100);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Visão Geral da Loja</h1>
                <p className="text-muted-foreground">Resumo operacional de hoje - {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Caixa do Dia</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {stats.caixaHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Total arrecadado hoje</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Manutenções em Aberto</CardTitle>
                        <Wrench className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.manutencoesAbertas}</div>
                        <p className="text-xs text-muted-foreground">Aparelhos na bancada</p>
                    </CardContent>
                </Card>
                <Card className="col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Meta do Mês</CardTitle>
                        <Target className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-2xl font-bold">
                                {percentualMeta.toFixed(1)}%
                            </span>
                            <span className="text-sm text-muted-foreground">
                                R$ {stats.metaRealizada.toLocaleString()} / R$ {stats.metaMensal.toLocaleString()}
                            </span>
                        </div>
                        <Progress value={percentualMeta} className="h-3" />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Avisos Importantes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <TrendingUp className="h-5 w-5 text-orange-500 mt-1" />
                                <div>
                                    <h4 className="font-semibold text-orange-500">Meta Diária</h4>
                                    <p className="text-sm">Faltam R$ 1.200,00 para bater a meta do dia. Foque em vendas de acessórios!</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <Wrench className="h-5 w-5 text-blue-500 mt-1" />
                                <div>
                                    <h4 className="font-semibold text-blue-500">Prioridade Técnica</h4>
                                    <p className="text-sm">3 Manutenções vencem hoje. Verifique a fila de reparos.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
