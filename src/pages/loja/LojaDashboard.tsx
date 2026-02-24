import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Target, TrendingUp, ArrowRight, BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon, Wrench, AlertTriangle } from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ChartType = 'bar' | 'line' | 'pie';

const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fmtShort = (v: number) => {
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
    return `R$ ${v.toFixed(0)}`;
};

function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
            <p className="font-semibold text-foreground mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color }}>{p.name}: {fmtShort(p.value)}</p>
            ))}
        </div>
    );
}

export default function LojaDashboard() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [meta, setMeta] = useState<{ meta_diaria: number; meta_mensal: number } | null>(null);
    const [realizadoHoje, setRealizadoHoje] = useState(0);
    const [fechamentoStatus, setFechamentoStatus] = useState<string | null>(null);
    const [historicoSemana, setHistoricoSemana] = useState<{ dia: string; valor: number; meta: number }[]>([]);
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [filterDias, setFilterDias] = useState('7');

    const fetchData = useCallback(async () => {
        console.log('Fetching LojaDashboard data for profile:', profile);
        if (!profile?.loja_id || !profile?.empresa_id) {
            console.warn('Loja/Empresa ID missing in profile:', profile);
            return;
        }
        const hoje = new Date().toISOString().slice(0, 10);
        const mes = hoje.slice(0, 7);
        const numDias = parseInt(filterDias);

        const [metaRes, fechRes] = await Promise.all([
            supabase.from('metas').select('meta_diaria, meta_mensal').eq('loja_id', profile.loja_id!).eq('mes', mes).maybeSingle(),
            supabase.from('fechamentos').select('total_entradas, status').eq('loja_id', profile.loja_id!).eq('data', hoje).is('deleted_at', null).maybeSingle(),
        ]);

        if (metaRes.data) setMeta(metaRes.data as any);
        if (fechRes.data) {
            setRealizadoHoje(Number(fechRes.data.total_entradas) || 0);
            setFechamentoStatus(fechRes.data.status as string);
        } else {
            setRealizadoHoje(0);
            setFechamentoStatus(null);
        }

        const dias: { dia: string; valor: number; meta: number }[] = [];
        for (let i = numDias - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dataStr = d.toISOString().slice(0, 10);
            const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });

            const { data: fech } = await supabase.from('fechamentos')
                .select('total_entradas').eq('loja_id', profile.loja_id!).eq('data', dataStr).is('deleted_at', null).maybeSingle();

            dias.push({
                dia: label,
                valor: Number(fech?.total_entradas) || 0,
                meta: metaRes.data?.meta_diaria ?? 0
            });
        }
        setHistoricoSemana(dias);
    }, [profile, filterDias]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const pctAtingido = meta?.meta_diaria ? Math.min((realizadoHoje / Number(meta.meta_diaria)) * 100, 100) : 0;

    const pieData = [
        { name: 'Realizado', value: realizadoHoje },
        { name: 'Restante', value: Math.max(0, (meta?.meta_diaria ?? 0) - realizadoHoje) },
    ];

    const renderChart = () => {
        if (chartType === 'pie') {
            return (
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} innerRadius={45} dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? '#10b981' : '#e2e8f0'} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => fmt(v)} />
                    </PieChart>
                </ResponsiveContainer>
            );
        }
        if (chartType === 'line') {
            return (
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={historicoSemana} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="dia" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={55} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="valor" name="Realizado" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="meta" name="Meta" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            );
        }
        return (
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={historicoSemana} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="dia" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={55} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="meta" name="Meta" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.5} />
                    <Bar dataKey="valor" name="Realizado" radius={[4, 4, 0, 0]}>
                        {historicoSemana.map((entry, i) => (
                            <Cell key={i} fill={entry.valor >= entry.meta ? '#10b981' : entry.valor >= entry.meta * 0.7 ? '#3b82f6' : '#ef4444'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        );
    };
    if (!profile?.loja_id || !profile?.empresa_id) {
        return (
            <div className="container mx-auto p-6">
                <Card className="bg-destructive/10 border-destructive/20 shadow-none">
                    <CardContent className="p-10 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <h2 className="text-xl font-bold text-destructive">Dados de Perfil Incompletos</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Seu usuário não está vinculado a uma Loja ou Empresa no banco de dados.
                            Sem essas informações, o dashboard não pode carregar os dados financeiros.
                        </p>
                        <div className="bg-muted p-4 rounded-lg text-left text-xs font-mono space-y-1 inline-block">
                            <p>User ID: {profile?.user_id || 'Não identificado'}</p>
                            <p>Empresa ID: {profile?.empresa_id || 'Não vinculado'}</p>
                            <p>Loja ID: {profile?.loja_id || 'Não vinculado'}</p>
                        </div>
                        <p className="text-sm">
                            Por favor, contate o administrador para vincular seu perfil a uma unidade.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Painel da Loja</h1>
                    <p className="text-muted-foreground">Visão operacional e resultados</p>
                </div>
                <Button onClick={() => navigate('/loja/caixa')} className="gap-2">
                    <DollarSign className="h-4 w-4" /> Abrir/Fechar Caixa <ArrowRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-muted-foreground">Meta Diária</span>
                        </div>
                        <div className="text-2xl font-bold">{fmt(meta?.meta_diaria ?? 0)}</div>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-500/10 border-emerald-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-medium text-muted-foreground">Realizado Hoje</span>
                        </div>
                        <div className="text-2xl font-bold">{fmt(realizadoHoje)}</div>
                    </CardContent>
                </Card>

                <Card className={`${pctAtingido >= 100 ? 'bg-emerald-500/10 border-emerald-500/20' : pctAtingido >= 70 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className={`h-4 w-4 ${pctAtingido >= 100 ? 'text-emerald-500' : pctAtingido >= 70 ? 'text-amber-500' : 'text-red-500'}`} />
                            <span className="text-sm font-medium text-muted-foreground">% da Meta</span>
                        </div>
                        <div className={`text-2xl font-bold ${pctAtingido >= 100 ? 'text-emerald-600' : pctAtingido >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                            {pctAtingido.toFixed(1)}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <Card className="md:col-span-4">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Histórico de Faturamento</CardTitle>
                            <div className="flex items-center gap-2">
                                <Select value={filterDias} onValueChange={setFilterDias}>
                                    <SelectTrigger className="h-8 w-28">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">7 dias</SelectItem>
                                        <SelectItem value="14">14 dias</SelectItem>
                                        <SelectItem value="30">30 dias</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex bg-muted p-1 rounded-md">
                                    <button onClick={() => setChartType('bar')} className={`p-1 rounded ${chartType === 'bar' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}><BarChart2 className="h-4 w-4" /></button>
                                    <button onClick={() => setChartType('line')} className={`p-1 rounded ${chartType === 'line' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}><LineChartIcon className="h-4 w-4" /></button>
                                    <button onClick={() => setChartType('pie')} className={`p-1 rounded ${chartType === 'pie' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}><PieChartIcon className="h-4 w-4" /></button>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {renderChart()}
                    </CardContent>
                </Card>

                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Status e Avisos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                            <span className="text-sm font-medium">Status do Caixa</span>
                            <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${fechamentoStatus === 'Aberto' ? 'bg-amber-400 animate-pulse' :
                                        fechamentoStatus === 'Conferido' ? 'bg-emerald-500' :
                                            fechamentoStatus === 'Divergente' ? 'bg-red-500' :
                                                fechamentoStatus === 'Fechado' ? 'bg-blue-500' : 'bg-muted-foreground'
                                    }`} />
                                <span className="text-sm font-semibold">{
                                    fechamentoStatus === 'Aberto' ? 'Aberto' :
                                        fechamentoStatus === 'Fechado' ? 'Fechado (Pendente Conferência)' :
                                            fechamentoStatus === 'Conferido' ? 'Conferido ✓' :
                                                fechamentoStatus === 'Divergente' ? 'Divergência' :
                                                    'Não Iniciado'
                                }</span>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 flex gap-3">
                            <Wrench className="h-5 w-5 text-orange-500 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-orange-600">Lembrete Técnico</p>
                                <p className="text-xs text-muted-foreground">Verifique a fila de manutenções prioritárias e atualize os status para os clientes.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
