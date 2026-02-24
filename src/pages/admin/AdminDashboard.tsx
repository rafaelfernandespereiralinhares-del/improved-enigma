import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DollarSign, TrendingDown, Target, Wallet, Store, UserCog, CreditCard, Receipt, Megaphone, AlertTriangle, FileCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
    const { profile } = useAuth();
    const [stats, setStats] = useState({
        totalLojas: 0,
        totalFuncionarios: 0,
        faturamentoMes: 0,
        inadimplencia: 0,
        contasPagarAberto: 0,
        contasReceberAberto: 0,
        auditoriasPendentes: 0,
        campanhasAtivas: 0,
        metaAtingimento: 0,
        divergencias: 0,
        folhaTotal: 0,
        caixasFechados: 0,
        caixasAbertos: 0,
    });
    const [rankingLojas, setRankingLojas] = useState<{ nome: string; total: number }[]>([]);
    const [lojasSemaforo, setLojasSemaforo] = useState<{ nome: string; status: string }[]>([]);

    useEffect(() => {
        console.log('AdminDashboard: Profile state:', profile);
        if (!profile?.empresa_id) {
            console.warn('AdminDashboard: Empresa ID missing');
            return;
        }
        const empresaId = profile.empresa_id;
        const mesAtual = new Date().toISOString().slice(0, 7);

        const fetch = async () => {
            const [
                lojasRes, funcsRes, fechRes, cpRes, crRes, audRes, campRes, metasRes, concRes
            ] = await Promise.all([
                supabase.from('lojas').select('id, nome').eq('empresa_id', empresaId).eq('ativa', true),
                supabase.from('funcionarios').select('id, salario, ajuda_custo, passagem').eq('empresa_id', empresaId).eq('ativo', true),
                supabase.from('fechamentos').select('loja_id, total_entradas, status, data').eq('empresa_id', empresaId).is('deleted_at', null).gte('data', `${mesAtual}-01`),
                supabase.from('contas_pagar').select('valor, status').eq('empresa_id', empresaId),
                supabase.from('contas_receber').select('valor, status').eq('empresa_id', empresaId),
                supabase.from('auditorias').select('id, status').eq('empresa_id', empresaId),
                supabase.from('campanhas').select('id, ativa').eq('empresa_id', empresaId).eq('ativa', true),
                supabase.from('metas').select('loja_id, meta_mensal').eq('empresa_id', empresaId).eq('mes', mesAtual),
                supabase.from('conciliacoes').select('loja_id, status').eq('empresa_id', empresaId).gte('data', `${mesAtual}-01`),
            ]);

            const lojas = lojasRes.data || [];
            const fechamentos = fechRes.data || [];
            const funcs = funcsRes.data || [];
            const cp = cpRes.data || [];
            const cr = crRes.data || [];
            const aud = audRes.data || [];
            const metas = metasRes.data || [];
            const conc = concRes.data || [];

            const faturamento = fechamentos.reduce((s, f) => s + (Number(f.total_entradas) || 0), 0);
            const cpAberto = cp.filter(c => c.status !== 'Pago').reduce((s, c) => s + Number(c.valor), 0);
            const crAberto = cr.filter(c => c.status !== 'Recebido').reduce((s, c) => s + Number(c.valor), 0);
            const inadimplencia = cr.filter(c => c.status === 'Atrasado').reduce((s, c) => s + Number(c.valor), 0);
            const audPendentes = aud.filter(a => a.status !== 'Concluido').length;
            const divergencias = conc.filter(c => c.status === 'Divergente').length;
            const folha = funcs.reduce((s, f) => s + Number(f.salario) + Number(f.ajuda_custo) + Number(f.passagem), 0);
            const caixasFechados = fechamentos.filter(f => f.status !== 'Aberto').length;
            const caixasAbertos = fechamentos.filter(f => f.status === 'Aberto').length;

            const lojaMap: Record<string, number> = {};
            fechamentos.forEach(f => { lojaMap[f.loja_id] = (lojaMap[f.loja_id] || 0) + (Number(f.total_entradas) || 0); });

            let metaPcts: number[] = [];
            metas.forEach(m => {
                const real = lojaMap[m.loja_id] || 0;
                const meta = Number(m.meta_mensal) || 0;
                if (meta > 0) metaPcts.push((real / meta) * 100);
            });
            const avgMeta = metaPcts.length > 0 ? metaPcts.reduce((a, b) => a + b, 0) / metaPcts.length : 0;

            const ranking = lojas.map(l => ({ nome: l.nome, total: lojaMap[l.id] || 0 })).sort((a, b) => b.total - a.total);
            setRankingLojas(ranking);

            const divLojas = new Set(conc.filter(c => c.status === 'Divergente').map(c => c.loja_id));
            setLojasSemaforo(lojas.map(l => {
                const metaL = metas.find(m => m.loja_id === l.id);
                const real = lojaMap[l.id] || 0;
                const metaV = Number(metaL?.meta_mensal) || 0;
                const pct = metaV > 0 ? real / metaV : 0;
                let status = 'verde';
                if (divLojas.has(l.id) || pct < 0.5) status = 'vermelho';
                else if (pct < 0.8) status = 'amarelo';
                return { nome: l.nome, status };
            }));

            setStats({
                totalLojas: lojas.length,
                totalFuncionarios: funcs.length,
                faturamentoMes: faturamento,
                inadimplencia,
                contasPagarAberto: cpAberto,
                contasReceberAberto: crAberto,
                auditoriasPendentes: audPendentes,
                campanhasAtivas: (campRes.data || []).length,
                metaAtingimento: avgMeta,
                divergencias,
                folhaTotal: folha,
                caixasFechados,
                caixasAbertos,
            });
        };

        fetch();
    }, [profile]);

    const fmt = (v?: number) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const semaforoColor = (s: string) => s === 'verde' ? 'bg-success' : s === 'amarelo' ? 'bg-warning' : 'bg-danger';
    if (!profile?.empresa_id) {
        return (
            <div className="container mx-auto p-6">
                <Card className="bg-destructive/10 border-destructive/20 shadow-none">
                    <CardContent className="p-10 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <h2 className="text-xl font-bold text-destructive">Empresa não Vinculada</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Seu perfil administrativo não possui um `empresa_id` associado.
                            Isso impede a visualização dos dados consolidados das lojas.
                        </p>
                        <div className="bg-muted p-4 rounded-lg text-left text-xs font-mono space-y-1 inline-block">
                            <p>User ID: {profile?.user_id || 'Não identificado'}</p>
                            <p>Empresa ID: {profile?.empresa_id || 'Não vinculado'}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Painel Macro</h1>
                <p className="text-muted-foreground">Visão consolidada de todas as operações</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard icon={DollarSign} label="Faturamento do Mês" value={fmt(stats.faturamentoMes)} />
                <KpiCard icon={TrendingDown} label="Inadimplência" value={fmt(stats.inadimplencia)} color="text-destructive font-bold" />
                <KpiCard icon={Target} label="Meta Média Atingida" value={`${stats.metaAtingimento.toFixed(1)}%`} color={stats.metaAtingimento >= 80 ? 'text-emerald-500' : stats.metaAtingimento >= 50 ? 'text-amber-500' : 'text-destructive'} />
                <KpiCard icon={Wallet} label="Folha de Pagamento" value={fmt(stats.folhaTotal)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <KpiCard icon={Store} label="Lojas Ativas" value={stats.totalLojas} />
                <KpiCard icon={UserCog} label="Equipe Total" value={stats.totalFuncionarios} />
                <KpiCard icon={CreditCard} label="Contas a Pagar" value={fmt(stats.contasPagarAberto)} sub="em aberto" />
                <KpiCard icon={Receipt} label="Contas a Receber" value={fmt(stats.contasReceberAberto)} sub="em aberto" />
                <KpiCard icon={Megaphone} label="Campanhas Ativas" value={stats.campanhasAtivas} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <KpiCard icon={AlertTriangle} label="Auditorias Pendentes" value={stats.auditoriasPendentes} color={stats.auditoriasPendentes > 0 ? 'text-destructive' : undefined} />
                <KpiCard icon={FileCheck} label="Divergências Concl." value={stats.divergencias} color={stats.divergencias > 0 ? 'text-destructive' : undefined} />
                <Card>
                    <CardHeader className="py-2 px-6 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Status Caixas (Mês)</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4 py-2">
                        <Badge variant="default" className="bg-emerald-500">{stats.caixasFechados} Fechados</Badge>
                        <Badge variant="secondary">{stats.caixasAbertos} Abertos</Badge>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="text-lg">Ranking de Faturamento</CardTitle></CardHeader>
                    <CardContent>
                        {rankingLojas.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={rankingLojas} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`} />
                                    <YAxis type="category" dataKey="nome" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(v: any) => fmt(v)} />
                                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <p className="text-sm text-muted-foreground py-20 text-center">Sem dados no período</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-lg">Semáforo de Operações</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                            {lojasSemaforo.map(l => (
                                <div key={l.nome} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                                    <div className={`h-3 w-3 rounded-full shrink-0 ${semaforoColor(l.status)}`} />
                                    <span className="text-sm font-medium truncate">{l.nome}</span>
                                </div>
                            ))}
                            {lojasSemaforo.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma loja cadastrada</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function KpiCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string | number; color?: string; sub?: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className={`h-4 w-4 ${color || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${color || ''}`}>{value}</div>
                {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </CardContent>
        </Card>
    );
}
