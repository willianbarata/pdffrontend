
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import SubscriptionClient from './SubscriptionClient';
import { redirect } from 'next/navigation';

export default async function SubscriptionPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) {
        return <div>Erro: Usuário não encontrado.</div>;
    }

    return (
        <SubscriptionClient
            plan={user.plan}
            status={user.subscriptionStatus}
            validUntil={user.validUntil}
        />
    );
}
