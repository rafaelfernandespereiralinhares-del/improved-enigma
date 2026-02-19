import { useState, useEffect } from "react";
import { format } from "date-fns";
// import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Plus, UserCog, Search, Filter } from "lucide-react";

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
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";

interface Funcionario {
    id: string;
    nome: string;
    cargo: string;
    loja_id: string;
    lojas?: {
        nome: string;
    };
    admissao: string;
    ativo: boolean;
    salario: number;
}

export default function Funcionarios() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [loading, setLoading] = useState(true);

    // TODO: Get from auth context
    const empresaId = "00000000-0000-0000-0000-000000000000";
    const lojaId = "00000000-0000-0000-0000-000000000000";

    const fetchFuncionarios = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('funcionarios')
                .select('*, lojas(nome)')
                .eq('empresa_id', empresaId)
                .order('nome');

            if (error) throw error;
            setFuncionarios(data || []);
        } catch (error) {
            console.error("Erro ao carregar funcionários:", error);
            toast.error("Erro ao carregar lista de funcionários.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFuncionarios();
    }, []);

    const handleImport = async (data: any[]) => {
        try {
            await importService.importFuncionarios(data, empresaId, lojaId);
            toast.success("Funcionários importados com sucesso!");
            fetchFuncionarios();
        } catch (error) {
            console.error("Erro na importação:", error);
            toast.error("Erro ao importar funcionários.");
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Funcionários</h1>
                    <p className="text-muted-foreground">Gestão de equipe e desempenho</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <UserCog className="h-4 w-4" /> Registrar Serviço
                    </Button>
                    <DataImportButton onImport={handleImport} label="Importar" />
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Novo Funcionário
                    </Button>
                </div>
            </div>

            <div className="flex gap-4 p-4 bg-secondary/20 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Filtros</span>
                </div>
                <Select defaultValue="ativos">
                    <SelectTrigger className="w-[150px] bg-background">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ativos">Ativos</SelectItem>
                        <SelectItem value="inativos">Inativos</SelectItem>
                        <SelectItem value="todos">Todos</SelectItem>
                    </SelectContent>
                </Select>

                <Select defaultValue="todas">
                    <SelectTrigger className="w-[200px] bg-background">
                        <SelectValue placeholder="Todas as lojas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todas">Todas as lojas</SelectItem>
                    </SelectContent>
                </Select>

                <Select defaultValue="todos">
                    <SelectTrigger className="w-[200px] bg-background">
                        <SelectValue placeholder="Todos os cargos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos os cargos</SelectItem>
                        <SelectItem value="vendedor">Vendedor</SelectItem>
                        <SelectItem value="gerente">Gerente</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold">Funcionários Ativos ({funcionarios.length})</h3>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Cargo</TableHead>
                                <TableHead>Loja</TableHead>
                                <TableHead>Admissão</TableHead>
                                <TableHead className="text-right">Serviços (R$)</TableHead>
                                <TableHead className="text-right text-green-500">Comissão</TableHead>
                                <TableHead className="text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {funcionarios.map((func) => (
                                <TableRow key={func.id}>
                                    <TableCell className="font-medium">{func.nome}</TableCell>
                                    <TableCell>{func.cargo}</TableCell>
                                    <TableCell>{func.lojas?.nome || '—'}</TableCell>
                                    <TableCell>{format(new Date(func.admissao), "dd/MM/yyyy")}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(0)}</TableCell>
                                    <TableCell className="text-right font-bold text-green-500">{formatCurrency(0)}</TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {funcionarios.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        Nenhum funcionário encontrado.
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
