import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Video } from 'lucide-react';

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.email) return null;

    const videos = await prisma.video.findMany({
        where: {
            user: {
                email: session.user.email
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Meus Vídeos</h1>
                <Link href="/dashboard/generator">
                    <Button>Novo Vídeo</Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {videos.length === 0 ? (
                    <Card className="col-span-full py-12">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <Video className="h-12 w-12 text-muted-foreground" />
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">Nenhum vídeo criado ainda</h3>
                                <p className="text-muted-foreground">Converta seu primeiro PDF em vídeo agora mesmo.</p>
                            </div>
                            <Link href="/dashboard/generator">
                                <Button>Criar Vídeo</Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    videos.map((video) => (
                        <Card key={video.id}>
                            <CardHeader>
                                <CardTitle className="truncate">{video.title || 'Sem título'}</CardTitle>
                                <CardDescription>{new Date(video.createdAt).toLocaleDateString('pt-BR')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {video.url ? (
                                    <div className="aspect-video bg-black rounded-md overflow-hidden relative">
                                        <video src={video.url} controls className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-muted flex items-center justify-center rounded-md">
                                        <span className="text-muted-foreground">Processando...</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
