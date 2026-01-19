import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle, LogIn, Loader2 } from 'lucide-react';
import { z } from 'zod';
import logoUnax from '@/assets/logo-unax.png';
const loginSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100)
});
export default function LoginPage() {
  const {
    signIn,
    isAuthenticated,
    loading
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>;
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate inputs
    const result = loginSchema.safeParse({
      email,
      password
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }
    setIsSubmitting(true);
    const {
      error: signInError
    } = await signIn(email, password);
    if (signInError) {
      if (signInError.message.includes('Invalid login')) {
        setError('Email ou senha incorretos');
      } else if (signInError.message.includes('Email not confirmed')) {
        setError('Email não confirmado');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    }
    setIsSubmitting(false);
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="rounded-3xl shadow-2xl border-0 bg-card/95 backdrop-blur">
          <CardHeader className="space-y-6 items-center pt-10 pb-4">
            <div className="w-48 h-auto">
              <img alt="UNAX Group" className="w-full h-auto drop-shadow-lg" src="/lovable-uploads/d90e7827-7070-48df-afe3-3e95de7650a0.png" />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Sistema de Almoxarifado</h1>
              <p className="text-sm text-muted-foreground">Faça login para continuar</p>
            </div>
          </CardHeader>
          
          <CardContent className="pb-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm animate-slide-up">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className={`rounded-xl h-12 ${fieldErrors.email ? 'border-destructive' : ''}`} maxLength={255} autoComplete="email" disabled={isSubmitting} />
                {fieldErrors.email && <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.email}
                  </p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={`rounded-xl h-12 ${fieldErrors.password ? 'border-destructive' : ''}`} maxLength={100} autoComplete="current-password" disabled={isSubmitting} />
                {fieldErrors.password && <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.password}
                  </p>}
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" disabled={isSubmitting}>
                {isSubmitting ? <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Entrando...
                  </> : <>
                    <LogIn className="h-5 w-5" />
                    Entrar
                  </>}
              </Button>
            </form>

            <p className="text-xs text-center text-muted-foreground mt-6">
              Acesso restrito a usuários autorizados
            </p>
          </CardContent>
        </Card>
      </div>
    </div>;
}