import { useState, useEffect } from "react";
// import { format } from "date-fns";
// import { ptBR } from "date-fns/locale";
import { Trophy, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataImportButton } from "@/components/DataImportButton";
import { importService } from "@/services/importService";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface Meta {
    id: string;
    loja_id: string;
    mes: string;
    meta_mensal: number;
    realizado_faturamento: number;
    meta_lucro: number;
    realizado_lucro: number;
    empresa_id: string;
    // Relations
    lojas?: {
        nome: string;
    };
}

export default function Metas() {
    const [metas, setMetas] = useState<Meta[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState("Fevereiro");
    const [selectedYear, setSelectedYear] = useState("2026");

    // TODO: Get from auth context
    const empresaId = "00000000-0000-0000-0000-000000000000";
    const lojaId = "00000000-0000-0000-0000-000000000000";

    const fetchMetas = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('metas' as any)
                .select('*, lojas(nome)')
                .eq('empresa_id', empresaId)
                .order('created_at', { ascending: false }) as any;

            if (error) throw error;
            setMetas(data || []);
        } catch (error) {
            console.error("Erro ao carregar metas:", error);
            toast.error("Erro ao carregar metas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetas();
    }, []);

    const handleImport = async (data: any[]) => {
        try {
            await importService.importMetas(data, empresaId, lojaId);
            toast.success("Metas importadas com sucesso!");
            fetchMetas();
        } catch (error) {
            console.error("Erro na importação:", error);
            toast.error("Erro ao importar metas.");
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getPercentage = (current: number, target: number) => {
        if (target === 0) return 0;
        return (current / target) * 100;
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Metas por Loja</h1>
                    <p className="text-muted-foreground">Acompanhamento de faturamento e lucro</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Janeiro">Janeiro</SelectItem>
                            <SelectItem value="Fevereiro">Fevereiro</SelectItem>
                            <SelectItem value="Março">Março</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2026">2026</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                        </SelectContent>
                    </Select>

                    <DataImportButton onImport={handleImport} label="Importar Metas" />
                    <Button>
                        <PlusIcon className="mr-2 h-4 w-4" /> Nova Meta
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                {metas.map((meta) => {
                    const percFat = getPercentage(meta.realizado_faturamento, meta.meta_mensal);
                    const percLucro = getPercentage(meta.realizado_lucro, meta.meta_lucro);

                    return (
                        <Card key={meta.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                            <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{meta.lojas?.nome || 'Loja Desconhecida'}</CardTitle>
                                            <CardDescription>{meta.mes} {selectedYear} • #1</CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={percFat >= 100 ? "default" : "destructive"}>
                                        {percFat.toFixed(1)}%
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                {/* Faturamento */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" /> Faturamento
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(meta.realizado_faturamento)} / {formatCurrency(meta.meta_mensal)}
                                        </span>
                                    </div>
                                    <Progress value={Math.min(percFat, 100)} className="h-2 bg-secondary" indicatorClassName={percFat >= 100 ? "bg-green-500" : "bg-primary"} />
                                </div>

                                {/* Lucro */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" /> Lucro
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(meta.realizado_lucro)} / {formatCurrency(meta.meta_lucro)}
                                        </span>
                                    </div>
                                    <Progress value={Math.min(percLucro, 100)} className="h-2 bg-secondary" indicatorClassName={percLucro >= 100 ? "bg-green-500" : "bg-blue-500"} />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {metas.length === 0 && !loading && (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                        Nenhuma meta encontrada para o período selecionado.
                    </div>
                )}
            </div>
        </div>
    );
}

function PlusIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
