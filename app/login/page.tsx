'use client';

import { useActionState } from 'react';
import { loginAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
    const [errorMessage, dispatch, isPending] = useActionState(loginAction, undefined);

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Entrar</CardTitle>
                    <CardDescription>
                        Digite seu email e senha para acessar.
                    </CardDescription>
                </CardHeader>
                <form action={dispatch}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@exemplo.com" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        {errorMessage && (
                            <p className="text-sm text-red-500">{errorMessage}</p>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button className="w-full" type="submit" disabled={isPending}>
                            {isPending ? 'Entrando...' : 'Entrar'}
                        </Button>
                        <div className="text-sm text-center text-muted-foreground">
                            Não tem uma conta?{' '}
                            <Link href="/register" className="underline hover:text-primary">
                                Cadastre-se
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
