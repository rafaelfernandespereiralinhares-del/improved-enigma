-- Tabela Metas
CREATE TABLE IF NOT EXISTS public.metas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    mes TEXT NOT NULL, -- Format: "MM"
    meta_mensal NUMERIC DEFAULT 0,
    meta_diaria NUMERIC DEFAULT 0,
    meta_lucro NUMERIC DEFAULT 0,
    realizado_faturamento NUMERIC DEFAULT 0,
    realizado_lucro NUMERIC DEFAULT 0,
    empresa_id UUID REFERENCES public.empresas(id),
    loja_id UUID REFERENCES public.lojas(id)
);

-- Tabela Contas a Pagar
CREATE TABLE IF NOT EXISTS public.contas_pagar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fornecedor TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    vencimento DATE NOT NULL,
    data_pagamento DATE,
    status TEXT DEFAULT 'Pendente', -- Pendente, Pago, Atrasado
    empresa_id UUID REFERENCES public.empresas(id),
    loja_id UUID REFERENCES public.lojas(id)
);

-- Tabela Contas a Receber
CREATE TABLE IF NOT EXISTS public.contas_receber (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    cliente TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    vencimento DATE NOT NULL,
    data_pagamento DATE,
    status TEXT DEFAULT 'Pendente', -- Pendente, Recebido, Atrasado
    empresa_id UUID REFERENCES public.empresas(id),
    loja_id UUID REFERENCES public.lojas(id),
    etapa_cobranca TEXT -- Opcional: Preventiva, Cobrança 1, etc.
);

-- Tabela Fechamentos (Caixa)
CREATE TABLE IF NOT EXISTS public.fechamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    data DATE NOT NULL,
    saldo_inicial NUMERIC DEFAULT 0,
    dinheiro NUMERIC DEFAULT 0,
    pix NUMERIC DEFAULT 0,
    cartao NUMERIC DEFAULT 0,
    sangrias NUMERIC DEFAULT 0,
    suprimentos NUMERIC DEFAULT 0,
    saidas NUMERIC DEFAULT 0,
    saldo_final NUMERIC GENERATED ALWAYS AS (saldo_inicial + dinheiro + pix + cartao + suprimentos - sangrias - saidas) STORED,
    valor_caixa_declarado NUMERIC,
    status TEXT DEFAULT 'Aberto', -- Aberto, Fechado, Conferido
    empresa_id UUID REFERENCES public.empresas(id),
    loja_id UUID REFERENCES public.lojas(id),
    responsavel_usuario_id UUID REFERENCES auth.users(id),
    responsavel_nome_snapshot TEXT
);

-- Tabela DRE Histórico (para DiretoriaDashboard)
CREATE TABLE IF NOT EXISTS public.dre_historico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    categoria TEXT NOT NULL, -- Receita Bruta, CMV, Despesas, Lucro Líquido
    subcategoria TEXT,
    valor NUMERIC NOT NULL,
    percentual NUMERIC,
    loja_nome TEXT, -- Desnormalizado para facilidade
    empresa_id UUID REFERENCES public.empresas(id),
    loja_id UUID REFERENCES public.lojas(id)
);

-- Tabela Campanhas
CREATE TABLE IF NOT EXISTS public.campanhas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL, -- Produto, Serviço, Combo
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    meta_quantidade INTEGER NOT NULL,
    progresso INTEGER DEFAULT 0,
    produto_servico TEXT,
    ativa BOOLEAN DEFAULT true,
    empresa_id UUID REFERENCES public.empresas(id)
);

-- Habilitar RLS (Row Level Security) - Básico: Permitir tudo para autenticados por enquanto
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fechamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dre_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total para autenticados" ON public.metas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total para autenticados" ON public.contas_pagar FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total para autenticados" ON public.contas_receber FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total para autenticados" ON public.fechamentos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total para autenticados" ON public.dre_historico FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total para autenticados" ON public.campanhas FOR ALL USING (auth.role() = 'authenticated');
