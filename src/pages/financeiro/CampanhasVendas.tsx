import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, PenTool, Trophy, Megaphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DataImportButton } from "@/components/DataImportButton";
import { importService } from "@/services/importService";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface Campanha {
    id: string;
    nome: string;
    tipo: 'DIARIA' | 'SEMANAL' | 'MENSAL';
    data_inicio: string;
    data_fim: string;
    meta_quantidade: number;
    progresso: number;
    produto_servico: string;
    ativa: boolean;
}

export default function CampanhasVendas() {
    const { profile } = useAuth();
    const [campanhas, setCampanhas] = useState<Campanha[]>([]);
    const [loading, setLoading] = useState(true);

    const empresaId = profile?.empresa_id;
    const lojaId = profile?.loja_id;

    const fetchCampanhas = async () => {
        if (!empresaId) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('campanhas')
                .select('*')
                .eq('empresa_id', empresaId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCampanhas(data || []);
        } catch (error) {
            console.error("Erro ao carregar campanhas:", error);
            toast.error("Erro ao carregar campanhas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampanhas();
    }, [empresaId]);

    const handleImport = async (data: any[]) => {
        try {
            await importService.importCampanhas(data, empresaId, lojaId);
            toast.success("Campanhas importadas com sucesso!");
            fetchCampanhas();
        } catch (error) {
            console.error("Erro na importação:", error);
            toast.error("Erro ao importar campanhas.");
        }
    };



    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Campanhas de Vendas</h1>
                    <p className="text-muted-foreground">Acompanhamento de campanhas por produto e serviço</p>
                </div>
                <div className="flex items-center gap-2">
                    <DataImportButton onImport={handleImport} label="Importar Campanhas" />
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nova Campanha
                    </Button>
                </div>
            </div>

            {/* Campanha Automática Card */}
            <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <PenTool className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">Campanha Automática — Manutenção de Celular</h3>
                                <Trophy className="h-4 w-4 text-amber-500" />
                            </div>
                            <p className="text-muted-foreground">
                                Top 3 funcionários com mais serviços de manutenção no mês. Comissão gerada automaticamente.
                            </p>
                            <div className="pt-4">
                                <p className="text-sm text-muted-foreground italic">Nenhum serviço de manutenção registrado ainda.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="todas" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="todas">Todas</TabsTrigger>
                    <TabsTrigger value="diarias">Diárias</TabsTrigger>
                    <TabsTrigger value="semanais">Semanais</TabsTrigger>
                    <TabsTrigger value="mensais">Mensais</TabsTrigger>
                </TabsList>

                <TabsContent value="todas" className="space-y-4">
                    {campanhas.map((campanha) => (
                        <Card key={campanha.id} className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-full">
                                            <Megaphone className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{campanha.nome}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>{campanha.produto_servico}</span>
                                                <span>•</span>
                                                <span>
                                                    {format(new Date(campanha.data_inicio), "dd/MM/yyyy", { locale: ptBR })} a {format(new Date(campanha.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant={campanha.tipo === 'MENSAL' ? 'default' : 'secondary'}>
                                            {campanha.tipo}
                                        </Badge>
                                        <Badge variant="outline" className={`${campanha.progresso >= campanha.meta_quantidade ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                            {Math.round((campanha.progresso / campanha.meta_quantidade) * 100)}%
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Progresso</span>
                                        <span className="font-medium">{campanha.progresso} / {campanha.meta_quantidade} unidades</span>
                                    </div>
                                    <Progress value={(campanha.progresso / campanha.meta_quantidade) * 100} className="h-2" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {campanhas.length === 0 && !loading && (
                        <div className="text-center py-10 text-muted-foreground">
                            Nenhuma campanha encontrada. Importe ou crie uma nova.
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
