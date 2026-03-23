'use client';

import { useActionState } from 'react';
import { registerAction, State } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function RegisterPage() {
    const initialState: State = { message: null, errors: {} };
    const [state, dispatch, isPending] = useActionState(registerAction, initialState);

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Criar Conta</CardTitle>
                    <CardDescription>
                        Comece a criar vídeos hoje mesmo.
                    </CardDescription>
                </CardHeader>
                <form action={dispatch}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" name="name" placeholder="Seu nome" required />
                            {state.errors?.name && (
                                <p className="text-sm text-red-500">{state.errors.name.join(', ')}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@exemplo.com" required />
                            {state.errors?.email && (
                                <p className="text-sm text-red-500">{state.errors.email.join(', ')}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" name="password" type="password" required />
                            {state.errors?.password && (
                                <p className="text-sm text-red-500">{state.errors.password.join(', ')}</p>
                            )}
                        </div>
                        {state.message && (
                            <p className="text-sm text-red-500">{state.message}</p>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button className="w-full" type="submit" disabled={isPending}>
                            {isPending ? 'Criando conta...' : 'Cadastrar'}
                        </Button>
                        <div className="text-sm text-center text-muted-foreground">
                            Já tem conta?{' '}
                            <Link href="/login" className="underline hover:text-primary">
                                Entrar
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
