import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function MetasSemanais() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
    const [metaData, setMetaData] = useState<{ mensal: number; realizado: number } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMetas();
    }, [selectedMonth]);

    const fetchMetas = async () => {
        setLoading(true);
        try {
            // Fetch for selected month (simplified logic)
            // Real implementation requires filter by month date range in database
            const { data } = await supabase
                .from('metas')
                .select('*')
                .limit(1)
                .maybeSingle();

            if (data) {
                setMetaData({
                    mensal: data.meta_mensal,
                    realizado: data.realizado_faturamento
                });
            } else {
                setMetaData({ mensal: 200000, realizado: 145000 }); // Mock if empty for demo
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar metas");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Carregando metas...</div>;

    const metaMensal = metaData?.mensal || 0;
    const realizadoTotal = metaData?.realizado || 0;
    const metaSemanal = metaMensal / 4;

    // Simulate weekly progress based on total realized (cumulative)
    // Week 1: 25%, Week 2: 25%, etc. logic for demo distribution
    const calculateWeeklyStatus = (weekNum: number) => {
        const targetForWeek = metaSemanal;
        // Distribute realized total across weeks for visualization
        let realizedForWeek = 0;

        const previousWeeksTotal = (weekNum - 1) * metaSemanal;
        const remainingRealized = Math.max(0, realizadoTotal - previousWeeksTotal);
        realizedForWeek = Math.min(targetForWeek, remainingRealized);

        const percent = Math.min(100, (realizedForWeek / targetForWeek) * 100);
        return { realized: realizedForWeek, target: targetForWeek, percent };
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <CalendarDays className="h-8 w-8" />
                        Metas Semanais
                    </h1>
                    <p className="text-muted-foreground">Acompanhamento tático de vendas por sprint</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione o Mês" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                    {format(new Date(2024, i, 1), 'MMMM', { locale: ptBR }).toUpperCase()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                {[1, 2, 3, 4].map((week) => {
                    const status = calculateWeeklyStatus(week);
                    return (
                        <Card key={week} className={`border-l-4 ${status.percent >= 100 ? 'border-l-green-500' : 'border-l-primary'}`}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Semana {week}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold mb-1">
                                    {status.percent.toFixed(0)}%
                                </div>
                                <Progress value={status.percent} className={`h-2 mb-2 ${status.percent >= 100 ? 'bg-green-100 [&>div]:bg-green-500' : ''}`} />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Real: R$ {status.realized.toLocaleString('pt-BR', { notation: "compact" })}</span>
                                    <span>Meta: R$ {status.target.toLocaleString('pt-BR', { notation: "compact" })}</span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                        Análise de Cadência
                    </CardTitle>
                    <CardDescription>
                        Para atingir a meta mensal de <strong>R$ {metaMensal.toLocaleString()}</strong>,
                        sua equipe precisa manter uma média de <strong>R$ {metaSemanal.toLocaleString()}</strong> por semana.
                        Atualmente você atingiu <strong>{((realizadoTotal / metaMensal) * 100).toFixed(1)}%</strong> do objetivo global.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
