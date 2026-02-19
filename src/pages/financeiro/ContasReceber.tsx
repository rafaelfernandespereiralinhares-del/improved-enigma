import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { DataImportButton } from "@/components/DataImportButton";
import { Separator } from "@/components/ui/separator";
import { importService } from "@/services/importService";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CalendarIcon, CheckCircle, AlertCircle, ArrowUpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function ContasReceber() {
    const { profile } = useAuth();
    const [date, setDate] = useState<Date>(new Date());
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({
        cliente: "",
        valor: "",
        vencimento: new Date(),
        status: "Pendente"
    });

    const empresaId = profile?.empresa_id;
    const lojaId = profile?.loja_id;

    useEffect(() => {
        if (empresaId) {
            fetchData();
        }
    }, [date, empresaId]);

    const fetchData = async () => {
        if (!empresaId) return;
        setLoading(true);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

        const { data: accounts, error } = await supabase
            .from('contas_receber')
            .select('*')
            .gte('vencimento', startOfMonth)
            .lte('vencimento', endOfMonth)
            .order('vencimento', { ascending: true });

        if (error) {
            console.error(error);
            toast.error("Erro ao carregar contas");
        } else {
            setData(accounts || []);
        }
        setLoading(false);
    };

    const handleImport = async (importedData: any[]) => {
        if (!empresaId || !lojaId) {
            toast.error("Erro: Identificação da empresa faltando.");
            return;
        }
        try {
            await importService.importContasReceber(importedData, empresaId, lojaId);
            toast.success("Importação realizada com sucesso!");
            fetchData();
        } catch (error) {
            toast.error("Erro na importação.");
        }
    };

    const handleSave = async () => {
        if (!empresaId || !lojaId) {
            toast.error("Erro: Identificação da empresa faltando.");
            return;
        }
        if (!newItem.cliente || !newItem.valor) {
            toast.error("Preencha cliente e valor.");
            return;
        }

        try {
            const { error } = await supabase.from('contas_receber').insert({
                cliente: newItem.cliente,
                valor: parseFloat(newItem.valor.replace(',', '.')),
                vencimento: newItem.vencimento.toISOString(),
                status: newItem.status as any,
                empresa_id: empresaId,
                loja_id: lojaId
            } as any);

            if (error) throw error;

            toast.success("Lançamento salvo!");
            setIsModalOpen(false);
            setNewItem({ cliente: "", valor: "", vencimento: new Date(), status: "Pendente" }); // Reset
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar lançamento.");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('contas_receber').delete().eq('id', id);
            if (error) throw error;
            toast.success("Item excluído.");
            fetchData();
        } catch (error) {
            toast.error("Erro ao excluir.");
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Contas a Receber</h1>
                    <p className="text-muted-foreground">Gestão de receitas e recebimentos</p>
                </div>
                <div className="flex items-center gap-2">
                    <MonthYearPicker date={date} setDate={setDate} />
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700">
                                <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Novo Contas a Receber</DialogTitle>
                                <DialogDescription>Adicione uma nova receita manualmente.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Cliente / Origem</Label>
                                    <Input
                                        value={newItem.cliente}
                                        onChange={(e) => setNewItem({ ...newItem, cliente: e.target.value })}
                                        placeholder="Ex: Cliente A, Venda Balcão..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Valor (R$)</Label>
                                    <Input
                                        type="number"
                                        value={newItem.valor}
                                        onChange={(e) => setNewItem({ ...newItem, valor: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Vencimento</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !newItem.vencimento && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {newItem.vencimento ? format(newItem.vencimento, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={newItem.vencimento}
                                                onSelect={(d: Date | undefined) => d && setNewItem({ ...newItem, vencimento: d })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={newItem.status}
                                        onValueChange={(v) => setNewItem({ ...newItem, status: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pendente">Pendente</SelectItem>
                                            <SelectItem value="Recebido">Recebido</SelectItem>
                                            <SelectItem value="Atrasado">Atrasado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>Salvar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <DataImportButton onImport={handleImport} label="Contas a Receber" />
                </div>
            </div>

            <Separator className="my-4" />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="text-sm font-medium">Total a Receber</div>
                        <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">
                        R$ {data.reduce((acc, curr) => acc + Number(curr.valor), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="text-sm font-medium">Recebido</div>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-green-500">
                        R$ {data.filter(i => i.status === 'Recebido').reduce((acc, curr) => acc + Number(curr.valor), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="text-sm font-medium">Pendente</div>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-orange-500">
                        R$ {data.filter(i => i.status === 'Pendente').reduce((acc, curr) => acc + Number(curr.valor), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Nenhuma receita encontrada para este mês.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{format(new Date(item.vencimento), "dd/MM/yyyy")}</TableCell>
                                    <TableCell className="font-medium">{item.cliente}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.status === 'Recebido' ? 'default' : item.status === 'Atrasado' ? 'destructive' : 'secondary'} className={item.status === 'Recebido' ? 'bg-green-600' : ''}>
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
