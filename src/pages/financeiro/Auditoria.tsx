import { useState, useEffect } from "react";
import { format } from "date-fns";
// import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, Clock, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataImportButton } from "@/components/DataImportButton";
// import { importService } from "@/services/importService"; 
import { supabase } from "@/lib/supabase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AuditoriaItem {
    id: string;
    data: string;
    loja_id: string;
    lojas?: { nome: string };
    tipo: string;
    descricao: string;
    valor_impactado: number;
    status: 'ABERTA' | 'EM_ANALISE' | 'RESOLVIDA';
}

import { useAuth } from "@/hooks/useAuth";

export default function Auditoria() {
    const { profile } = useAuth();
    const [ocorrencias, setOcorrencias] = useState<AuditoriaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState<"todos" | "aberto" | "concluido">("todos");

    const empresaId = profile?.empresa_id;

    const fetchOcorrencias = async () => {
        if (!empresaId) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('auditorias' as any)
                .select('*, lojas(nome)')
                .eq('empresa_id', empresaId)
                .order('created_at', { ascending: false }) as any;

            if (error) throw error;
            setOcorrencias(data || []);
        } catch (error) {
            console.error("Erro ao carregar auditorias:", error);
            toast.error("Erro ao carregar ocorrências.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOcorrencias();
    }, [empresaId]);

    const handleImport = async (data: any[]) => {
        console.log("Importing audit data:", data);
        toast.info("Importação de auditoria em breve.");
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'RESOLVIDA': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'EM_ANALISE': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-red-500/10 text-red-500 border-red-500/20';
        }
    };

    const counts = {
        pendentes: ocorrencias.filter(o => o.status === 'ABERTA').length,
        analise: ocorrencias.filter(o => o.status === 'EM_ANALISE').length,
        resolvidos: ocorrencias.filter(o => o.status === 'RESOLVIDA').length
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Auditoria</h1>
                    <p className="text-muted-foreground">Registro e acompanhamento de ocorrências</p>
                </div>
                <div className="flex items-center gap-2">
                    <DataImportButton onImport={handleImport} label="Importar" />
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Nova Ocorrência
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-red-500/20 bg-red-500/5">
                    <CardContent className="pt-6 text-center">
                        <div className="text-4xl font-bold text-red-500 mb-1">{counts.pendentes}</div>
                        <div className="text-sm font-medium text-red-600/80 flex items-center justify-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Pendentes
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardContent className="pt-6 text-center">
                        <div className="text-4xl font-bold text-amber-500 mb-1">{counts.analise}</div>
                        <div className="text-sm font-medium text-amber-600/80 flex items-center justify-center gap-2">
                            <Clock className="h-4 w-4" /> Em Análise
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-green-500/20 bg-green-500/5">
                    <CardContent className="pt-6 text-center">
                        <div className="text-4xl font-bold text-green-500 mb-1">{counts.resolvidos}</div>
                        <div className="text-sm font-medium text-green-600/80 flex items-center justify-center gap-2">
                            <CheckCircle className="h-4 w-4" /> Resolvidos
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Loja</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="w-[400px]">Descrição</TableHead>
                                <TableHead className="text-right">Valor Impactado</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ocorrencias.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{format(new Date(item.data || item.id), "dd/MM/yyyy")}</TableCell>
                                    <TableCell className="font-medium">{item.lojas?.nome || '—'}</TableCell>
                                    <TableCell>{item.tipo}</TableCell>
                                    <TableCell>{item.descricao}</TableCell>
                                    <TableCell className="text-right">
                                        {item.valor_impactado ? `R$ ${item.valor_impactado.toFixed(2)}` : '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className={getStatusColor(item.status)}>
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {ocorrencias.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                        Nenhuma ocorrência registrada
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
