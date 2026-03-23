import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function AdminPage() {
    const session = await auth();

    if (session?.user?.email !== 'willianbarata@gmail.com') {
        redirect('/dashboard');
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { videos: true } } }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Painel Administrativo</h1>
                <Link href="/dashboard">
                    <Button variant="outline">Voltar ao Dashboard</Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Usuários ({users.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableCaption>Lista de todos os usuários registrados.</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Plano</TableHead>
                                <TableHead>Créditos Usados</TableHead>
                                <TableHead>Vídeos Gerados</TableHead>
                                <TableHead>Data Cadastro</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell>{user.name || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.plan === 'PRO' ? 'default' : 'secondary'}>
                                            {user.plan}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.creditsUsed}</TableCell>
                                    <TableCell>{user._count.videos}</TableCell>
                                    <TableCell>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                                            {user.isActive ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
