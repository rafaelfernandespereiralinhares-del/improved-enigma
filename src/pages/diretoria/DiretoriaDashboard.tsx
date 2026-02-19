import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TrendingUp, DollarSign, Target } from "lucide-react";

export default function DiretoriaDashboard() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [kpiData, setKpiData] = useState({
        faturamento: 0,
        lucro: 0,
        margem: 0,
        ticketMedio: 0
    });
    const [rankingLojas, setRankingLojas] = useState<any[]>([]);
    const [evolucaoMensal, setEvolucaoMensal] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, [selectedYear]);

    const fetchDashboardData = async () => {
        try {
            const { data: dreData, error } = await supabase
                .from('dre_historico')
                .select('*')
                .eq('ano', parseInt(selectedYear));

            if (error) throw error;

            if (dreData) {
                // 1. Calculate KPIs (Aggregated)
                const receitaTotal = dreData
                    .filter(d => d.categoria === 'Receita Bruta')
                    .reduce((acc, curr) => acc + Number(curr.valor), 0);

                const lucroTotal = dreData
                    .filter(d => d.categoria === 'Lucro Líquido' || d.categoria === 'Resultado Líquido')
                    .reduce((acc, curr) => acc + Number(curr.valor), 0);

                const margemMedia = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0;

                setKpiData({
                    faturamento: receitaTotal,
                    lucro: lucroTotal,
                    margem: margemMedia,
                    ticketMedio: 150.00 // Placeholder or calculated from sales count
                });

                // 2. Ranking Lojas (Revenue per store)
                const revenueByStore: Record<string, number> = {};
                dreData
                    .filter(d => d.categoria === 'Receita Bruta')
                    .forEach(d => {
                        const store = d.loja_nome || 'Matriz';
                        revenueByStore[store] = (revenueByStore[store] || 0) + Number(d.valor);
                    });

                const ranking = Object.entries(revenueByStore)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value);

                setRankingLojas(ranking);

                // 3. Evolução Mensal (Aggregated)
                const monthlyData: Record<number, { receita: number, despesa: number, lucro: number }> = {};

                dreData.forEach(d => {
                    if (!monthlyData[d.mes]) monthlyData[d.mes] = { receita: 0, despesa: 0, lucro: 0 };

                    if (d.categoria === 'Receita Bruta') {
                        monthlyData[d.mes].receita += Number(d.valor);
                    } else if (d.categoria === 'Despesas Operacionais' || d.categoria === 'Custo CMV') {
                        monthlyData[d.mes].despesa += Number(d.valor);
                    } else if (d.categoria === 'Lucro Líquido') {
                        monthlyData[d.mes].lucro += Number(d.valor);
                    }
                });

                const evolution = Object.entries(monthlyData)
                    .map(([mes, vals]) => ({
                        name: format(new Date(2024, Number(mes) - 1, 1), 'MMM', { locale: ptBR }).toUpperCase(),
                        Receita: vals.receita,
                        Despesas: vals.despesa,
                        Lucro: vals.lucro
                    }));

                setEvolucaoMensal(evolution);
            }

        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
            toast.error("Erro ao carregar dados do dashboard.");
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Diretoria</h1>
                    <p className="text-muted-foreground">Visão consolidada do grupo Nexus</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(kpiData.faturamento)}</div>
                        <p className="text-xs text-muted-foreground">Consolidado anual</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(kpiData.lucro)}</div>
                        <p className="text-xs text-muted-foreground">
                            Margem de {kpiData.margem.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lojas Ativas</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rankingLojas.length}</div>
                        <p className="text-xs text-muted-foreground">Unidades com movimento</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ticket Médio (Est.)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(kpiData.ticketMedio)}</div>
                        <p className="text-xs text-muted-foreground">Média estimada</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Ranking Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Ranking de Faturamento</CardTitle>
                        <CardDescription>Desempenho por unidade de negócio</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={rankingLojas} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(val: any) => formatCurrency(Number(val))}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                    />
                                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Faturamento" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Evolution Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Evolução Financeira</CardTitle>
                        <CardDescription>Receita vs Despesas (Mensal)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={evolucaoMensal}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis hide />
                                    <Tooltip
                                        formatter={(val: any) => formatCurrency(Number(val))}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="Receita" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="Despesas" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
