import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Download, TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

import { Button } from "@/components/ui/button";
import { DataImportButton } from "@/components/DataImportButton";
import { importService } from "@/services/importService";
import { supabase } from "@/lib/supabase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

interface DREItem {
    id: string;
    ano: number;
    mes: number;
    categoria: string;
    subcategoria: string;
    valor: number;
    loja_nome: string;
}

export default function PlanejamentoEstrategico() {
    const [dados, setDados] = useState<DREItem[]>([]);
    // const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState("2024");
    const [selectedLoja, setSelectedLoja] = useState("todas");

    // TODO: Get from auth context
    const empresaId = "00000000-0000-0000-0000-000000000000";
    const lojaId = "00000000-0000-0000-0000-000000000000";

    const fetchDados = async () => {
        try {
            // setLoading(true);
            const { data, error } = await supabase
                .from('dre_historico')
                .select('*')
                .eq('empresa_id', empresaId)
                .eq('ano', parseInt(selectedYear));

            if (error) throw error;
            setDados(data || []);
        } catch (error) {
            console.error("Erro ao carregar DRE:", error);
            toast.error("Erro ao carregar dados do planejamento.");
        } finally {
            // setLoading(false);
        }
    };

    useEffect(() => {
        fetchDados();
    }, [selectedYear]);

    const handleImport = async (data: any[]) => {
        try {
            await importService.importPlanejamento(data, empresaId, lojaId);
            toast.success("DRE importado com sucesso!");
            fetchDados();
        } catch (error) {
            console.error("Erro na importação:", error);
            toast.error("Erro ao importar DRE.");
        }
    };

    // Process data for charts
    const chartData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthData = dados.filter(d => d.mes === month);

        const receita = monthData.filter(d => d.categoria === 'RECEITA').reduce((acc, curr) => acc + curr.valor, 0);
        const despesas = monthData.filter(d => d.categoria === 'DESPESA').reduce((acc, curr) => acc + curr.valor, 0);
        const lucro = receita - despesas; // Simplified

        return {
            name: format(new Date(2024, i, 1), 'MMM', { locale: ptBR }),
            Receita: receita,
            Despesas: despesas,
            Lucro: lucro
        };
    });

    // KPI Calculations
    const totalReceita = dados.filter(d => d.categoria === 'RECEITA').reduce((acc, curr) => acc + curr.valor, 0);
    const totalDespesas = dados.filter(d => d.categoria === 'DESPESA').reduce((acc, curr) => acc + curr.valor, 0);
    const lucroLiquido = totalReceita - totalDespesas;
    const margemLucro = totalReceita > 0 ? (lucroLiquido / totalReceita) * 100 : 0;

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Planejamento Estratégico — DRE Histórico</h1>
                    <p className="text-muted-foreground">Análise financeira detalhada</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedLoja} onValueChange={setSelectedLoja}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Loja" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todas">Todas as lojas</SelectItem>
                            <SelectItem value="mantiqueira">Mantiqueira</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" /> Excel
                    </Button>
                    <DataImportButton onImport={handleImport} label="Importar DRE" />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total Anual</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalReceita)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro Líquido Anual</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{formatCurrency(lucroLiquido)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
                        <PieChart className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">{margemLucro.toFixed(1)}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Despesas Fixas / Receita</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">61.5%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Evolução Mensal — Receita × Despesas × Lucro</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            {/* Grid with dotted lines similar to design */}
                            <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} strokeOpacity={0.2} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                                formatter={(value: any) => formatCurrency(value || 0)}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="Receita" stroke="#1e293b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="Lucro" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Detailed Table (Placeholder for now, structure ready) */}
            <Card>
                <CardHeader>
                    <CardTitle>DRE Completo — {selectedLoja === 'todas' ? 'Consolidado' : selectedLoja} — {selectedYear}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[300px]">Conta</TableHead>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <TableHead key={i} className="text-right">
                                            {format(new Date(2024, i, 1), 'MMM', { locale: ptBR })}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-semibold text-primary">RECEITAS</TableCell>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <TableCell key={i} className="text-right">-</TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-semibold text-red-500">DEDUÇÕES</TableCell>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <TableCell key={i} className="text-right">-</TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-bold">LUCRO LÍQUIDO</TableCell>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <TableCell key={i} className="text-right font-bold">-</TableCell>
                                    ))}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                    <div className="p-4 text-center text-sm text-muted-foreground w-full">
                        * Visualização parcial (Janeiro a Junho). Role ou exporte para ver tudo.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
