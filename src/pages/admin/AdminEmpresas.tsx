import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, Building2, MoreHorizontal, Pencil, Ban, CheckCircle, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataImportButton } from "@/components/DataImportButton";
import { importService } from "@/services/importService";

interface Empresa {
    id: string;
    nome: string;
    ativo: boolean;
    created_at: string;
    plano_id?: string | null;
    // planos?: { nome: string }; // Join if needed
}

export default function AdminEmpresas() {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newEmpresaNome, setNewEmpresaNome] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchEmpresas = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('empresas')
                .select('*')
                .order('nome');

            if (error) throw error;
            setEmpresas(data || []);
        } catch (error) {
            console.error("Erro ao carregar empresas:", error);
            toast.error("Erro ao carregar empresas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmpresas();
    }, []);

    const handleSave = async () => {
        if (!newEmpresaNome.trim()) {
            toast.error("O nome da empresa é obrigatório.");
            return;
        }

        try {
            setIsSaving(true);
            const { error } = await supabase
                .from('empresas')
                .insert([{ nome: newEmpresaNome, ativo: true }]);

            if (error) throw error;

            toast.success("Empresa cadastrada com sucesso!");
            setIsDialogOpen(false);
            setNewEmpresaNome("");
            fetchEmpresas();
        } catch (error: any) {
            console.error("Erro ao salvar empresa:", error);
            toast.error("Erro ao salvar empresa: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('empresas')
                .update({ ativo: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            toast.success(`Empresa ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`);
            fetchEmpresas();
        } catch (error) {
            toast.error("Erro ao atualizar status.");
        }
    };

    const handleImport = async (data: any[]) => {
        try {
            await importService.importEmpresas(data);
            toast.success("Empresas importadas com sucesso!");
            fetchEmpresas();
        } catch (error: any) {
            console.error("Erro na importação:", error);
            toast.error("Erro ao importar: " + error.message);
        }
    };

    const filteredEmpresas = empresas.filter(emp =>
        emp.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Building2 className="h-8 w-8" />
                        Gerenciar Empresas
                    </h1>
                    <p className="text-muted-foreground">Administração das empresas do grupo</p>
                </div>
                <div className="flex items-center gap-2">
                    <DataImportButton onImport={handleImport} label="Empresas" />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" /> Nova Empresa
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
                                <DialogDescription>
                                    Preencha os dados abaixo para criar uma nova empresa no sistema.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="nome" className="text-right">
                                        Nome
                                    </Label>
                                    <Input
                                        id="nome"
                                        value={newEmpresaNome}
                                        onChange={(e) => setNewEmpresaNome(e.target.value)}
                                        className="col-span-3"
                                        placeholder="Ex: Nexus Matriz"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? "Salvando..." : "Salvar Empresa"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-secondary/20 p-4 rounded-lg border border-border">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm border-none bg-transparent shadow-none focus-visible:ring-0"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data Criação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEmpresas.map((empresa) => (
                            <TableRow key={empresa.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-md">
                                        <Building2 className="h-4 w-4 text-primary" />
                                    </div>
                                    {empresa.nome}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={empresa.ativo ? "default" : "secondary"}>
                                        {empresa.ativo ? "Ativa" : "Inativa"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {format(new Date(empresa.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Abrir menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuItem>
                                                <Pencil className="mr-2 h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => toggleStatus(empresa.id, empresa.ativo)}>
                                                {empresa.ativo ? (
                                                    <><Ban className="mr-2 h-4 w-4 text-red-500" /> Desativar</>
                                                ) : (
                                                    <><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Ativar</>
                                                )}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredEmpresas.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Nenhuma empresa encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
