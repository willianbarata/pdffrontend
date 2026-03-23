import Link from 'next/link';
import { Video, Home, User, Settings, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/auth';
import { signOut } from '@/auth';

export async function SideNav() {
    const session = await auth();
    const isAdmin = session?.user?.email === 'willianbarata@gmail.com';

    return (
        <div className="flex h-full flex-col px-3 py-4 md:px-2">
            <Link
                className="mb-2 flex h-20 items-end justify-start rounded-md bg-primary p-4 md:h-40"
                href="/dashboard"
            >
                <div className="w-32 text-white md:w-40 flex items-center gap-2">
                    <Video className="h-8 w-8" />
                    <span className="text-xl font-bold">PDF2Video</span>
                </div>
            </Link>
            <div className="flex grow flex-col justify-between space-y-2">
                <div className="space-y-2">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <Home className="h-4 w-4" />
                            Início
                        </Button>
                    </Link>
                    <Link href="/dashboard/generator">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <Video className="h-4 w-4" />
                            Gerar Vídeo
                        </Button>
                    </Link>
                    {isAdmin && (
                        <Link href="/admin">
                            <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-500 hover:bg-red-50">
                                <Shield className="h-4 w-4" />
                                Administração
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="space-y-2">
                    <Link href="/dashboard/subscription">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <User className="h-4 w-4" />
                            Minha Assinatura
                        </Button>
                    </Link>
                    <form
                        action={async () => {
                            'use server';
                            await signOut();
                        }}
                    >
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <LogOut className="h-4 w-4" />
                            Sair
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
