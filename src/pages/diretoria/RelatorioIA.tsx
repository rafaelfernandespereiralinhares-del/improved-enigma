import { useState } from "react";
import {
    Brain,
    Sparkles,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    FileText,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function RelatorioIA() {
    const [generating, setGenerating] = useState(false);
    const [report, setReport] = useState<null | any>(null);

    const generateReport = async () => {
        setGenerating(true);
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 2500));

        setReport({
            date: new Date().toLocaleDateString('pt-BR'),
            summary: "A análise financeira do último trimestre indica uma tendência de crescimento sustentável, embora alguns custos operacionais em lojas específicas mereçam atenção.",
            insights: [
                {
                    type: "positive",
                    title: "Crescimento de Receita",
                    description: "O faturamento global cresceu 12% em comparação ao mês anterior, impulsionado pelo desempenho da Loja Centro."
                },
                {
                    type: "warning",
                    title: "Aumento no CMV",
                    description: "O Custo de Mercadoria Vendida (CMV) subiu 3% acima da média histórica. Recomenda-se renegociação com fornecedores de eletrônicos."
                },
                {
                    type: "neutral",
                    title: "Metas de Venda",
                    description: "85% das lojas atingiram a meta mensal. A loja 'Norte Shopping' ficou 5% abaixo do esperado."
                }
            ],
            actions: [
                "Agendar reunião com gerência da Loja Norte Shopping.",
                "Revisar contratos de fornecimento de peças.",
                "Iniciar campanha de marketing para produtos de baixa rotatividade."
            ]
        });
        setGenerating(false);
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Brain className="h-8 w-8 text-violet-500" />
                        Relatório Inteligente (IA)
                    </h1>
                    <p className="text-muted-foreground">Análise automatizada de desempenho e sugestões estratégicas</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="lg"
                        onClick={generateReport}
                        disabled={generating}
                        className="bg-violet-600 hover:bg-violet-700"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analisando Dados...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Gerar Nova Análise
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {!report && (
                <div className="grid place-items-center h-[400px] border-2 border-dashed rounded-lg bg-muted/10">
                    <div className="text-center space-y-4 max-w-lg px-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Brain className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">Nenhuma análise gerada hoje</h3>
                        <p className="text-muted-foreground">
                            Nossa IA analisa milhões de pontos de dados do seu DRE, vendas e estoque para sugerir ações práticas. Clique em "Gerar Nova Análise" para começar.
                        </p>
                    </div>
                </div>
            )}

            {report && (
                <div className="grid gap-6 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Main Analysis Column */}
                    <Card className="md:col-span-2 border-primary/20 shadow-lg">
                        <CardHeader className="bg-primary/5 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Resumo Executivo
                            </CardTitle>
                            <CardDescription>Gerado em {report.date}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <blockquote className="border-l-4 border-violet-500 pl-4 italic text-lg text-muted-foreground">
                                "{report.summary}"
                            </blockquote>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-violet-500" />
                                    Insights Detalhados
                                </h4>
                                <div className="grid gap-4">
                                    {report.insights.map((insight: any, i: number) => (
                                        <div key={i} className="flex gap-4 p-4 rounded-lg bg-card border hover:border-primary/50 transition-colors">
                                            <div className="mt-1">
                                                {insight.type === 'positive' && <TrendingUp className="h-5 w-5 text-green-500" />}
                                                {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                                                {insight.type === 'neutral' && <TrendingDown className="h-5 w-5 text-blue-500" />}
                                            </div>
                                            <div>
                                                <h5 className="font-medium text-foreground">{insight.title}</h5>
                                                <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions Column */}
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                Ações Recomendadas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px] pr-4">
                                <ul className="space-y-4">
                                    {report.actions.map((action: string, i: number) => (
                                        <li key={i} className="flex gap-3 items-start p-3 rounded-md bg-background border shadow-sm">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                {i + 1}
                                            </span>
                                            <span className="text-sm">{action}</span>
                                        </li>
                                    ))}
                                    <li className="flex gap-3 items-start p-3 rounded-md bg-background/50 border border-dashed shadow-sm opacity-60">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                            +
                                        </span>
                                        <span className="text-sm italic">IA aprendendo novos padrões...</span>
                                    </li>
                                </ul>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
