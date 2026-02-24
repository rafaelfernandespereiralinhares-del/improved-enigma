import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Download, Calendar, Pencil, Trash2, Smartphone, Target } from 'lucide-react';
import { exportToExcel } from '@/lib/csv';

interface Loja { id: string; nome: string; }

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function MetasSemanais() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const now = new Date();
  const currentWeek = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
  const currentMonth = now.toISOString().slice(0, 7);

  const [filterMes, setFilterMes] = useState(currentMonth);
  const [form, setForm] = useState({
    loja_id: '',
    mes: currentMonth,
    semana: String(currentWeek),
    meta_faturamento: '',
    meta_acessorios: ''
  });

  const [fechamentos, setFechamentos] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.empresa_id) return;
    supabase.from('lojas').select('id, nome').eq('empresa_id', profile.empresa_id).eq('ativa', true)
      .then(({ data }) => { if (data) setLojas(data); });
    fetchMetas();
    fetchFechamentos();
  }, [profile]);

  const fetchMetas = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await supabase.from('metas_semanais').select('*')
      .eq('empresa_id', profile.empresa_id).order('mes', { ascending: false }).order('semana', { ascending: true });
    if (data) setMetas(data);
  };

  const fetchFechamentos = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await supabase.from('fechamentos').select('loja_id, data, dinheiro, pix, cartao, venda_acessorios')
      .eq('empresa_id', profile.empresa_id).is('deleted_at', null);
    if (data) setFechamentos(data);
  };

  const getWeekOfMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return Math.ceil((date.getDate() + firstDay) / 7);
  };

  const getRealizadoForMeta = (lojaId: string, mes: string, semana: number) => {
    const items = fechamentos.filter(f => {
      return f.loja_id === lojaId && f.data?.startsWith(mes) && getWeekOfMonth(f.data) === semana;
    });
    return {
      faturamento: items.reduce((s, f) => s + Number(f.dinheiro || 0) + Number(f.pix || 0) + Number(f.cartao || 0), 0),
      acessorios: items.reduce((s, f) => s + Number(f.venda_acessorios || 0), 0)
    };
  };

  const handleSave = async () => {
    if (!profile?.empresa_id || !form.loja_id) { toast({ title: 'Selecione a loja', variant: 'destructive' }); return; }
    const payload = {
      empresa_id: profile.empresa_id,
      loja_id: form.loja_id,
      mes: form.mes,
      semana: parseInt(form.semana),
      meta_faturamento: parseFloat(form.meta_faturamento) || 0,
      meta_acessorios: parseFloat(form.meta_acessorios) || 0,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from('metas_semanais').update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('metas_semanais').insert(payload));
    }

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editId ? 'Meta atualizada!' : 'Meta cadastrada!' });
      setDialogOpen(false);
      setEditId(null);
      setForm({ loja_id: '', mes: currentMonth, semana: String(currentWeek), meta_faturamento: '', meta_acessorios: '' });
      fetchMetas();
    }
  };

  const handleEdit = (m: any) => {
    setEditId(m.id);
    setForm({
      loja_id: m.loja_id,
      mes: m.mes,
      semana: String(m.semana),
      meta_faturamento: String(m.meta_faturamento),
      meta_acessorios: String(m.meta_acessorios),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('metas_semanais').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Meta excluída!' }); fetchMetas(); }
  };

  const filtered = metas.filter(m => m.mes === filterMes);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" /> Metas Semanais
          </h1>
          <p className="text-sm text-muted-foreground">Progresso semanal de faturamento e acessórios</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) setEditId(null); }}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Meta</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? 'Editar Meta Semanal' : 'Nova Meta Semanal'}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Loja</Label>
                    <Select value={form.loja_id} onValueChange={v => setForm(p => ({ ...p, loja_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mês</Label>
                    <Input type="month" value={form.mes} onChange={e => setForm(p => ({ ...p, mes: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Semana</Label>
                  <Select value={form.semana} onValueChange={v => setForm(p => ({ ...p, semana: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semana 1</SelectItem>
                      <SelectItem value="2">Semana 2</SelectItem>
                      <SelectItem value="3">Semana 3</SelectItem>
                      <SelectItem value="4">Semana 4</SelectItem>
                      <SelectItem value="5">Semana 5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Meta Faturamento (R$)</Label>
                    <Input type="number" step="0.01" value={form.meta_faturamento} onChange={e => setForm(p => ({ ...p, meta_faturamento: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Meta Acessórios (R$)</Label>
                    <Input type="number" step="0.01" value={form.meta_acessorios} onChange={e => setForm(p => ({ ...p, meta_acessorios: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full">{editId ? 'Salvar Alterações' : 'Criar Meta'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-3">
        <Input type="month" value={filterMes} onChange={e => setFilterMes(e.target.value)} className="w-[200px]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(m => {
          const realizado = getRealizadoForMeta(m.loja_id, m.mes, m.semana);
          const fatPct = m.meta_faturamento > 0 ? Math.round((realizado.faturamento / m.meta_faturamento) * 100) : 0;
          const acePct = m.meta_acessorios > 0 ? Math.round((realizado.acessorios / m.meta_acessorios) * 100) : 0;
          const loja = lojas.find(l => l.id === m.loja_id);

          return (
            <Card key={m.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{loja?.nome ?? '-'}</CardTitle>
                    <Badge variant="outline" className="mt-1">Semana {m.semana}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Faturamento</span>
                    <span className="font-bold">{fmt(realizado.faturamento)} / {fmt(m.meta_faturamento)}</span>
                  </div>
                  <div className="relative pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                        {fatPct}%
                      </span>
                    </div>
                    <Progress value={Math.min(fatPct, 100)} className="h-2" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground flex items-center gap-1"><Smartphone className="h-3 w-3" /> Acessórios</span>
                    <span className="font-bold">{fmt(realizado.acessorios)} / {fmt(m.meta_acessorios)}</span>
                  </div>
                  <div className="relative pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-warning bg-warning/10">
                        {acePct}%
                      </span>
                    </div>
                    <Progress value={Math.min(acePct, 100)} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl border-muted">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Nenhuma meta definida para {filterMes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
