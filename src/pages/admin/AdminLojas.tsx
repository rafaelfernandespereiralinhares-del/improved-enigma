import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, Store, MoreHorizontal, Pencil, Ban, CheckCircle, Search, Building2 } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataImportButton } from "@/components/DataImportButton";
import { importService } from "@/services/importService";

interface Loja {
    id: string;
    nome: string;
    ativa: boolean;
    created_at: string;
    empresa_id: string;
    empresas?: { nome: string };
}

interface Empresa {
    id: string;
    nome: string;
}

export default function AdminLojas() {
    const [lojas, setLojas] = useState<Loja[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form State
    const [newLojaNome, setNewLojaNome] = useState("");
    const [selectedEmpresaId, setSelectedEmpresaId] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Parallel fetch for stores and companies
            const [lojasRes, empresasRes] = await Promise.all([
                supabase
                    .from('lojas')
                    .select('*, empresas(nome)')
                    .order('nome'),
                supabase
                    .from('empresas')
                    .select('id, nome')
                    .eq('ativo', true)
                    .order('nome')
            ]);

            if (lojasRes.error) throw lojasRes.error;
            if (empresasRes.error) throw empresasRes.error;

            setLojas(lojasRes.data || []);
            setEmpresas(empresasRes.data || []);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar lojas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async () => {
        if (!newLojaNome.trim()) {
            toast.error("O nome da loja é obrigatório.");
            return;
        }
        if (!selectedEmpresaId) {
            toast.error("Selecione uma empresa.");
            return;
        }

        try {
            setIsSaving(true);
            const { error } = await supabase
                .from('lojas')
                .insert([{
                    nome: newLojaNome,
                    empresa_id: selectedEmpresaId,
                    ativa: true
                }]);

            if (error) throw error;

            toast.success("Loja cadastrada com sucesso!");
            setIsDialogOpen(false);
            setNewLojaNome("");
            setSelectedEmpresaId("");
            fetchData();
        } catch (error: any) {
            console.error("Erro ao salvar loja:", error);
            toast.error("Erro ao salvar loja: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('lojas')
                .update({ ativa: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            toast.success(`Loja ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`);
            fetchData();
        } catch (error) {
            toast.error("Erro ao atualizar status.");
        }
    };

    const handleImport = async (data: any[]) => {
        try {
            await importService.importLojas(data);
            toast.success("Lojas importadas com sucesso!");
            fetchData();
        } catch (error: any) {
            console.error("Erro na importação:", error);
            toast.error("Erro ao importar: " + error.message);
        }
    };

    const filteredLojas = lojas.filter(loja =>
        loja.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (loja.empresas?.nome || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Store className="h-8 w-8" />
                        Gerenciar Lojas
                    </h1>
                    <p className="text-muted-foreground">Administração das unidades de negócio</p>
                </div>
                <div className="flex items-center gap-2">
                    <DataImportButton onImport={handleImport} label="Lojas" />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" /> Nova Loja
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Cadastrar Nova Loja</DialogTitle>
                                <DialogDescription>
                                    Preencha os dados abaixo para criar uma nova loja no sistema.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="empresa" className="text-right">
                                        Empresa
                                    </Label>
                                    <Select
                                        value={selectedEmpresaId}
                                        onValueChange={setSelectedEmpresaId}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Selecione a empresa" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {empresas.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id}>
                                                    {emp.nome}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="nome" className="text-right">
                                        Nome
                                    </Label>
                                    <Input
                                        id="nome"
                                        value={newLojaNome}
                                        onChange={(e) => setNewLojaNome(e.target.value)}
                                        className="col-span-3"
                                        placeholder="Ex: Loja Centro"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? "Salvando..." : "Salvar Loja"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-secondary/20 p-4 rounded-lg border border-border">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar loja ou empresa..."
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
                            <TableHead>Empresa</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data Criação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLojas.map((loja) => (
                            <TableRow key={loja.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-md">
                                        <Store className="h-4 w-4 text-primary" />
                                    </div>
                                    {loja.nome}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        {loja.empresas?.nome || "—"}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={loja.ativa ? "default" : "secondary"}>
                                        {loja.ativa ? "Ativa" : "Inativa"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {format(new Date(loja.created_at), "dd/MM/yyyy", { locale: ptBR })}
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
                                            <DropdownMenuItem onClick={() => toggleStatus(loja.id, loja.ativa)}>
                                                {loja.ativa ? (
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
                        {filteredLojas.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhuma loja encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
