import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { AppRole } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Lock, Mail, User, Briefcase } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nome, setNome] = useState('');
    const [role, setRole] = useState<AppRole>('LOJA');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const { error } = await signIn(email, password);

        if (error) {
            toast.error('Erro ao entrar', {
                description: error.message === 'Invalid login credentials'
                    ? 'Email ou senha incorretos.'
                    : error.message,
            });
            setIsLoading(false);
            return;
        }

        navigate('/');
        setIsLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!nome) {
            toast.error('Campo obrigatório', {
                description: 'Por favor, informe seu nome.',
            });
            setIsLoading(false);
            return;
        }

        const { error } = await signUp(email, password, nome, role);

        if (error) {
            toast.error('Erro ao cadastrar', {
                description: error.message,
            });
            setIsLoading(false);
            return;
        }

        toast.success('Cadastro realizado!', {
            description: 'Verifique seu email para confirmar o cadastro (se necessário) ou faça login.',
        });
        setIsLoading(false);
    };

    const [isResetting, setIsResetting] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!email) {
            toast.error('Campo obrigatório', {
                description: 'Por favor, informe seu email.',
            });
            setIsLoading(false);
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
        });

        if (error) {
            toast.error('Erro ao enviar email', {
                description: error.message,
            });
        } else {
            toast.success('Email enviado!', {
                description: 'Verifique sua caixa de entrada para redefinir a senha.',
            });
            setIsResetting(false);
        }
        setIsLoading(false);
    };

    const TestLoginButton = () => (
        <>
            <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    ou acesso rápido
                </span>
            </div>

            <Button
                type="button"
                variant="outline"
                className="w-full border-primary/20 hover:bg-primary/5 hover:text-primary animate-pulse"
                onClick={async () => {
                    if (useAuth().loginAsTestAdmin) {
                        await useAuth().loginAsTestAdmin!();
                        navigate('/');
                    }
                }}
            >
                <Briefcase className="mr-2 h-4 w-4" />
                Entrar como Admin (Teste)
            </Button>
        </>
    );

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="font-display text-3xl font-bold tracking-tight text-primary">NEXUS</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Gestão Operacional e Financeira</p>
                </div>

                <Card className="shadow-lg border-border/50">
                    <Tabs defaultValue="login" className="w-full">
                        <CardHeader className="pb-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="login">Entrar</TabsTrigger>
                                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                            </TabsList>
                        </CardHeader>
                        <CardContent>
                            <TabsContent value="login">
                                {isResetting ? (
                                    <>
                                        <CardTitle className="text-xl font-semibold text-foreground mb-2">Recuperar Senha</CardTitle>
                                        <CardDescription className="mb-4">Informe seu email para receber o link de redefinição.</CardDescription>
                                        <form onSubmit={handleResetPassword} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="reset-email">Email</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        id="reset-email"
                                                        type="email"
                                                        placeholder="seu@email.com"
                                                        value={email}
                                                        onChange={e => setEmail(e.target.value)}
                                                        className="pl-10"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <Button type="submit" className="w-full" disabled={isLoading}>
                                                {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="w-full"
                                                onClick={() => setIsResetting(false)}
                                                disabled={isLoading}
                                            >
                                                Voltar ao Login
                                            </Button>
                                        </form>
                                    </>
                                ) : (
                                    <>
                                        <CardTitle className="text-xl font-semibold text-foreground mb-2">Bem-vindo de volta</CardTitle>
                                        <CardDescription className="mb-4">Acesse sua conta para continuar</CardDescription>
                                        <form onSubmit={handleLogin} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        placeholder="seu@email.com"
                                                        value={email}
                                                        onChange={e => setEmail(e.target.value)}
                                                        className="pl-10"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="password">Senha</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        id="password"
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder="••••••••"
                                                        value={password}
                                                        onChange={e => setPassword(e.target.value)}
                                                        className="pl-10 pr-10"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <Button type="submit" className="w-full" disabled={isLoading}>
                                                {isLoading ? 'Entrando...' : 'Entrar'}
                                            </Button>

                                            <div className="text-center mt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsResetting(true)}
                                                    className="text-sm text-muted-foreground hover:text-primary underline"
                                                >
                                                    Esqueci minha senha
                                                </button>
                                            </div>
                                            <TestLoginButton />
                                        </form>
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="signup">
                                <CardTitle className="text-xl font-semibold text-foreground mb-2">Crie sua conta</CardTitle>
                                <CardDescription className="mb-4">Preencha os dados abaixo para começar</CardDescription>
                                <form onSubmit={handleSignUp} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nome">Nome</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="nome"
                                                type="text"
                                                placeholder="Seu nome"
                                                value={nome}
                                                onChange={e => setNome(e.target.value)}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Área / Cargo</Label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                                            <Select value={role} onValueChange={(v: AppRole) => setRole(v)}>
                                                <SelectTrigger className="pl-10">
                                                    <SelectValue placeholder="Selecione sua área" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="LOJA">Loja (Operacional)</SelectItem>
                                                    <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
                                                    <SelectItem value="DIRETORIA">Diretoria</SelectItem>
                                                    <SelectItem value="ADMIN">Administrador (Teste)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="signup-email"
                                                type="email"
                                                placeholder="seu@email.com"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password">Senha</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="signup-password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="pl-10 pr-10"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? 'Cadastrando...' : 'Criar Conta'}
                                    </Button>

                                    <TestLoginButton />
                                </form>
                            </TabsContent>
                        </CardContent>
                    </Tabs>

                    <p className="pb-6 text-center text-xs text-muted-foreground">
                        © {new Date().getFullYear()} NEXUS — Todos os direitos reservados
                    </p>
                </Card>
            </div>
        </div>
    );
}
