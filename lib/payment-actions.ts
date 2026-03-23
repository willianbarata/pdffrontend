'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createAsaasCustomer, createPaymentLink, cancelSubscription } from './asaas'; // Added cancelSubscription import
import { redirect } from 'next/navigation';

interface CreditCardInput {
    number: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
}

export async function createCheckoutSessionAction(cpf?: string, creditCard?: CreditCardInput) {
    const session = await auth();

    if (!session?.user?.email) {
        return { error: 'Você precisa estar logado.' };
    }

    try {
        // Find user by ID to be safer (using email from session)
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return { error: 'Usuário não encontrado.' };
        }

        // Check for CPF
        let userCpf = user.cpf;

        // If user doesn't have CPF stored but provided one now, save it
        if (!userCpf && cpf) {
            await prisma.user.update({
                where: { id: user.id },
                data: { cpf: cpf }
            });
            userCpf = cpf;
        }

        // If still no CPF, we cannot proceed with Asaas
        if (!userCpf) {
            return { error: 'CPF é obrigatório para gerar o pagamento.', missingCpf: true };
        }

        let asaasId = user.asaasCustomerId;

        // If user doesn't have an Asaas ID, create one and save it
        if (!asaasId) {
            console.log('Creating Asaas Customer for', user.email);
            asaasId = await createAsaasCustomer({
                id: user.id,
                email: user.email,
                name: user.name,
                cpfCnpj: userCpf
            });

            await prisma.user.update({
                where: { id: user.id },
                data: { asaasCustomerId: asaasId }
            });
        }

        console.log('Creating Checkout for Asaas ID:', asaasId);

        const { url, subscriptionId, status } = await createPaymentLink(
            asaasId!,
            creditCard,
            {
                name: creditCard?.holderName || user.name || 'Cliente',
                email: user.email,
                cpfCnpj: userCpf
            }
        );

        // Update user with subscription ID and REAL status
        await prisma.user.update({
            where: { id: user.id },
            data: {
                subscriptionId: subscriptionId,
                subscriptionStatus: status, // Use returned status (e.g., 'ACTIVE')
                plan: status === 'ACTIVE' ? 'PRO' : 'FREE' // Grant access immediately if approved
            }
        });

        return { url };

    } catch (error: any) {
        console.error('Payment Action Error:', error);
        return { error: `Erro: ${error.message}` };
    }
}

export async function cancelSubscriptionAction() {
    const session = await auth();
    if (!session?.user?.email) return { error: 'Não autenticado' };

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || !user.subscriptionId) {
            return { error: 'Nenhuma assinatura ativa encontrada.' };
        }

        await cancelSubscription(user.subscriptionId);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                subscriptionStatus: 'CANCELED',
                plan: 'FREE',
                isActive: true // User remains active as free user
            }
        });

        return { success: true };

    } catch (error: any) {
        console.error('Cancel Action Error:', error);
        return { error: 'Erro ao cancelar assinatura.' };
    }
}
