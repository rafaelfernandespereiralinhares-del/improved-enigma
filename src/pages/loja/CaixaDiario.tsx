import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CalendarIcon } from "lucide-react";

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface Fechamento {
    id: string;
    data: string;
    saldo_inicial: number | null;
    dinheiro: number | null;
    pix: number | null;
    cartao: number | null;
    saidas: number | null;
    suprimentos: number | null;
    sangrias: number | null;
    total_entradas: number | null;
    saldo_final: number | null;
    lojas?: {
        nome: string;
    };
}

import { useAuth } from "@/hooks/useAuth";

export default function CaixaDiario() {
    const { profile } = useAuth();
    const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        data: new Date(),
        saldo_inicial: "",
        dinheiro: "",
        pix: "",
        cartao: "",
        saidas: "",
        suprimentos: "",
        sangrias: ""
    });

    const empresaId = profile?.empresa_id;
    const lojaId = profile?.loja_id;

    const fetchFechamentos = async () => {
        if (!empresaId) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('fechamentos')
                .select('*, lojas(nome)')
                .eq('empresa_id', empresaId)
                .order('data', { ascending: false });

            if (error) throw error;
            setFechamentos(data || []);
        } catch (error) {
            console.error("Erro ao carregar fechamentos:", error);
            toast.error("Erro ao carregar dados do caixa.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFechamentos();
    }, [empresaId]);

    const handleImport = async (data: any[]) => {
        if (!empresaId || !lojaId) {
            toast.error("Erro: Identificação da empresa faltando.");
            return;
        }
        try {
            await importService.importCaixaDiario(data, empresaId, lojaId);
            toast.success("Caixa diário importado com sucesso!");
            fetchFechamentos();
        } catch (error) {
            console.error("Erro na importação:", error);
            toast.error("Erro ao importar caixa diário.");
        }
    };

    const handleOpenModal = (item?: Fechamento) => {
        if (item) {
            setCurrentId(item.id);
            setFormData({
                data: new Date(item.data),
                saldo_inicial: item.saldo_inicial?.toString() || "",
                dinheiro: item.dinheiro?.toString() || "",
                pix: item.pix?.toString() || "",
                cartao: item.cartao?.toString() || "",
                saidas: item.saidas?.toString() || "",
                suprimentos: item.suprimentos?.toString() || "",
                sangrias: item.sangrias?.toString() || ""
            });
        } else {
            setCurrentId(null);
            setFormData({
                data: new Date(),
                saldo_inicial: "",
                dinheiro: "",
                pix: "",
                cartao: "",
                saidas: "",
                suprimentos: "",
                sangrias: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!empresaId || !lojaId) return;

        const saldoInicial = parseFloat(formData.saldo_inicial.replace(',', '.') || '0');
        const dinheiro = parseFloat(formData.dinheiro.replace(',', '.') || '0');
        const pix = parseFloat(formData.pix.replace(',', '.') || '0');
        const cartao = parseFloat(formData.cartao.replace(',', '.') || '0');
        const saidas = parseFloat(formData.saidas.replace(',', '.') || '0');
        const suprimentos = parseFloat(formData.suprimentos.replace(',', '.') || '0');
        const sangrias = parseFloat(formData.sangrias.replace(',', '.') || '0');

        const totalEntradas = dinheiro + pix + cartao;
        const saldoFinal = saldoInicial + totalEntradas + suprimentos - saidas - sangrias;

        const payload = {
            data: formData.data.toISOString(),
            saldo_inicial: saldoInicial,
            dinheiro,
            pix,
            cartao,
            saidas,
            suprimentos,
            sangrias,
            total_entradas: totalEntradas,
            saldo_final: saldoFinal,
            empresa_id: empresaId,
            loja_id: lojaId
        };

        try {
            if (currentId) {
                const { error } = await supabase
                    .from('fechamentos')
                    .update(payload)
                    .eq('id', currentId);
                if (error) throw error;
                toast.success("Lançamento atualizado!");
            } else {
                const { error } = await supabase
                    .from('fechamentos')
                    .insert(payload);
                if (error) throw error;
                toast.success("Lançamento criado!");
            }
            setIsModalOpen(false);
            fetchFechamentos();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            toast.error("Erro ao salvar lançamento.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;
        try {
            const { error } = await supabase.from('fechamentos').delete().eq('id', id);
            if (error) throw error;
            toast.success("Lançamento excluído.");
            fetchFechamentos();
        } catch (error) {
            console.error("Erro ao excluir:", error);
            toast.error("Erro ao excluir lançamento.");
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
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Caixa Diário</h1>
                    <p className="text-muted-foreground">Controle de caixa por loja</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select defaultValue="todas">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Todas as lojas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todas">Todas as lojas</SelectItem>
                        </SelectContent>
                    </Select>

                    <DataImportButton onImport={handleImport} label="Importar Caixa" />
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
                    </Button>
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{currentId ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Data</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !formData.data && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.data ? format(formData.data, "PPP", { locale: ptBR }) : <span>Selecione</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={formData.data}
                                            onSelect={(d) => d && setFormData({ ...formData, data: d })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid gap-2">
                                <Label>Saldo Inicial (R$)</Label>
                                <Input
                                    value={formData.saldo_inicial}
                                    onChange={(e) => setFormData({ ...formData, saldo_inicial: e.target.value })}
                                    placeholder="0,00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label>Dinheiro (R$)</Label>
                                <Input
                                    value={formData.dinheiro}
                                    onChange={(e) => setFormData({ ...formData, dinheiro: e.target.value })}
                                    placeholder="0,00"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Pix (R$)</Label>
                                <Input
                                    value={formData.pix}
                                    onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                                    placeholder="0,00"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Cartão (R$)</Label>
                                <Input
                                    value={formData.cartao}
                                    onChange={(e) => setFormData({ ...formData, cartao: e.target.value })}
                                    placeholder="0,00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label>Saídas (R$)</Label>
                                <Input
                                    value={formData.saidas}
                                    onChange={(e) => setFormData({ ...formData, saidas: e.target.value })}
                                    placeholder="0,00"
                                    className="text-red-500"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Suprimentos (R$)</Label>
                                <Input
                                    value={formData.suprimentos}
                                    onChange={(e) => setFormData({ ...formData, suprimentos: e.target.value })}
                                    placeholder="0,00"
                                    className="text-green-500"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Sangrias (R$)</Label>
                                <Input
                                    value={formData.sangrias}
                                    onChange={(e) => setFormData({ ...formData, sangrias: e.target.value })}
                                    placeholder="0,00"
                                    className="text-red-500"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Loja</TableHead>
                                <TableHead className="text-right">S. Inicial</TableHead>
                                <TableHead className="text-right">Entradas</TableHead>
                                <TableHead className="text-right">Saídas</TableHead>
                                <TableHead className="text-right font-bold">Saldo Final</TableHead>
                                <TableHead className="w-[100px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fechamentos.map((item) => {
                                const totalEntradas = (item.dinheiro || 0) + (item.pix || 0) + (item.cartao || 0);
                                const saldoFinalCalc = (item.saldo_inicial || 0) + totalEntradas + (item.suprimentos || 0) - (item.saidas || 0) - (item.sangrias || 0);

                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>{format(new Date(item.data), "dd/MM/yyyy")}</TableCell>
                                        <TableCell className="font-medium">{item.lojas?.nome || '—'}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.saldo_inicial || 0)}</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(totalEntradas)}</TableCell>
                                        <TableCell className="text-right text-red-500">{formatCurrency((item.saidas || 0) + (item.sangrias || 0))}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{formatCurrency(saldoFinalCalc)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(item)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {fechamentos.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        Nenhum lançamento encontrado.
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
