import { useState, useEffect } from "react";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { DataImportButton } from "@/components/DataImportButton";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

export default function Conciliacao() {
    const [date, setDate] = useState<Date>(new Date());
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, [date]);

    const fetchTransactions = async () => {
        setLoading(true);
        // Fetch Payables and Receivables
        const [pagarRes, receberRes] = await Promise.all([
            supabase.from('contas_pagar').select('*'), // Filter by date logic normally included
            supabase.from('contas_receber').select('*')
        ]);

        const pagar = (pagarRes.data || []).map(p => ({ ...p, type: 'SAIDA', descricao: p.fornecedor }));
        const receber = (receberRes.data || []).map(r => ({ ...r, type: 'ENTRADA', descricao: r.cliente }));

        const all = [...pagar, ...receber].sort((a, b) =>
            new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()
        );

        setTransactions(all);
        setLoading(false);
    };

    const handleImport = async (data: any[]) => {
        // Mock import for bank extract
        console.log("Importing Bank Extract:", data);
        alert("Importação de extrato bancário simulada.");
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                        Conciliação Bancária
                    </h1>
                    <p className="text-muted-foreground">Conferência de extrato x sistema</p>
                </div>
                <div className="flex items-center gap-2">
                    <MonthYearPicker date={date} setDate={setDate} />
                    <DataImportButton onImport={handleImport} label="Extrato Bancário" />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-red-500/10 border-red-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-500">Saídas Previstas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                            R$ {transactions.filter(t => t.type === 'SAIDA').reduce((acc, t) => acc + Number(t.valor), 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-500/10 border-green-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-500">Entradas Previstas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            R$ {transactions.filter(t => t.type === 'ENTRADA').reduce((acc, t) => acc + Number(t.valor), 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-500">Saldo Projetado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">
                            R$ {transactions.reduce((acc, t) => acc + (t.type === 'ENTRADA' ? Number(t.valor) : -Number(t.valor)), 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((t, i) => (
                            <TableRow key={i}>
                                <TableCell>
                                    <Checkbox id={`check-${i}`} />
                                </TableCell>
                                <TableCell>
                                    {format(new Date(t.vencimento), 'dd/MM/yyyy')}
                                </TableCell>
                                <TableCell className="font-medium">{t.descricao}</TableCell>
                                <TableCell>
                                    {t.type === 'ENTRADA' ? (
                                        <Badge className="bg-green-500 hover:bg-green-600 flex w-fit items-center gap-1">
                                            <ArrowUpCircle className="h-3 w-3" /> Entrada
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                            <ArrowDownCircle className="h-3 w-3" /> Saída
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    R$ {Number(t.valor).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{t.status}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                        {transactions.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Nenhuma transação encontrada para este período.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
