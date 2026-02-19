import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, Users, MoreHorizontal, Pencil, Ban, CheckCircle, Search, Mail, Building2, Store } from "lucide-react";
// import { format } from "date-fns";
// import { ptBR } from "date-fns/locale";

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

interface Usuario {
    id: string;
    nome: string;
    email: string | null;
    ativo: boolean;
    created_at: string;
    empresa_id?: string | null;
    loja_id?: string | null;
    user_id: string; // auth.users id
}

interface Empresa {
    id: string;
    nome: string;
}

interface Loja {
    id: string;
    nome: string;
    empresa_id: string;
}

export default function AdminUsuarios() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [lojas, setLojas] = useState<Loja[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        password: "",
        empresa_id: "",
        loja_id: "",
        role: "LOJA"
    });
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profilesRes, empresasRes, lojasRes] = await Promise.all([
                supabase.from('profiles').select('*').order('nome'),
                supabase.from('empresas').select('id, nome').eq('ativo', true),
                supabase.from('lojas').select('id, nome, empresa_id').eq('ativa', true)
            ]);

            if (profilesRes.error) throw profilesRes.error;
            setUsuarios(profilesRes.data || []);
            setEmpresas(empresasRes.data || []);
            setLojas(lojasRes.data || []);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar usuários.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async () => {
        if (!formData.nome || !formData.email || !formData.password) {
            toast.error("Nome, Email e Senha são obrigatórios.");
            return;
        }

        try {
            setIsSaving(true);
            // Call Supabase Edge Function to create user in auth.users + public.profiles
            const { error } = await supabase.functions.invoke('create-user', {
                body: { ...formData }
            });

            if (error) throw error;

            toast.success("Usuário criado com sucesso!");
            setIsDialogOpen(false);
            setFormData({ nome: "", email: "", password: "", empresa_id: "", loja_id: "", role: "LOJA" });
            fetchData();
        } catch (error: any) {
            console.error("Erro ao criar usuário:", error);
            toast.error("Erro ao criar usuário: " + (error.message || "Verifique os logs"));
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ ativo: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`);
            fetchData();
        } catch (error) {
            toast.error("Erro ao atualizar status.");
        }
    };

    const handleImport = async (data: any[]) => {
        try {
            toast.info("Iniciando importação de usuários... Isso pode levar alguns instantes.");
            await importService.importUsuarios(data);
            toast.success("Usuários importados com sucesso!");
            fetchData();
        } catch (error: any) {
            console.error("Erro na importação:", error);
            toast.error("Erro ao importar: " + error.message);
        }
    };

    const filteredUsuarios = usuarios.filter(user =>
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredLojas = lojas.filter(l => l.empresa_id === formData.empresa_id);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Users className="h-8 w-8" />
                        Gerenciar Usuários
                    </h1>
                    <p className="text-muted-foreground">Controle de acesso e permissões</p>
                </div>
                <div className="flex items-center gap-2">
                    <DataImportButton onImport={handleImport} label="Usuários" />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" /> Novo Usuário
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                                <DialogDescription>Crie um novo acesso ao sistema.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Nome</Label>
                                    <Input
                                        value={formData.nome}
                                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Senha</Label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Perfil</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={v => setFormData({ ...formData, role: v })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">Administrador</SelectItem>
                                            <SelectItem value="DIRETORIA">Diretoria</SelectItem>
                                            <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
                                            <SelectItem value="LOJA">Gerente de Loja</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Empresa</Label>
                                    <Select
                                        value={formData.empresa_id}
                                        onValueChange={v => setFormData({ ...formData, empresa_id: v, loja_id: "" })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Selecione (Opcional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Loja</Label>
                                    <Select
                                        value={formData.loja_id}
                                        onValueChange={v => setFormData({ ...formData, loja_id: v })}
                                        disabled={!formData.empresa_id}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Selecione (Opcional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredLojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? "Salvando..." : "Salvar Usuário"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-secondary/20 p-4 rounded-lg border border-border">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar usuário por nome ou email..."
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
                            <TableHead>Email</TableHead>
                            <TableHead>Vínculo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsuarios.map((user) => {
                            const empNome = empresas.find(e => e.id === user.empresa_id)?.nome;
                            const lojaNome = lojas.find(l => l.id === user.loja_id)?.nome;

                            return (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Users className="h-4 w-4 text-primary" />
                                        </div>
                                        {user.nome}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Mail className="h-3 w-3" />
                                            {user.email || '—'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            {empNome && (
                                                <span className="flex items-center gap-1 text-xs">
                                                    <Building2 className="h-3 w-3" /> {empNome}
                                                </span>
                                            )}
                                            {lojaNome && (
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Store className="h-3 w-3" /> {lojaNome}
                                                </span>
                                            )}
                                            {!empNome && !lojaNome && <span className="text-muted-foreground">—</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.ativo ? "default" : "secondary"}>
                                            {user.ativo ? "Ativo" : "Inativo"}
                                        </Badge>
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
                                                <DropdownMenuItem onClick={() => toggleStatus(user.id, user.ativo)}>
                                                    {user.ativo ? (
                                                        <><Ban className="mr-2 h-4 w-4 text-red-500" /> Desativar</>
                                                    ) : (
                                                        <><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Ativar</>
                                                    )}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredUsuarios.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhum usuário encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
