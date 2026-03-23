'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { createCheckoutSessionAction, cancelSubscriptionAction } from '@/lib/payment-actions';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";

interface SubscriptionClientProps {
    plan: string;
    status: string | null;
    validUntil: Date | null;
}

export default function SubscriptionClient({ plan, status, validUntil }: SubscriptionClientProps) {
    const [loading, setLoading] = useState(false);

    // CPF & Card Collection State
    const [isCpfModalOpen, setIsCpfModalOpen] = useState(false);
    const [cpf, setCpf] = useState('');
    const [cardData, setCardData] = useState({
        holderName: '',
        number: '',
        expiry: '',
        ccv: ''
    });
    const [cpfError, setCpfError] = useState('');

    const isPro = plan === 'PRO' && status !== 'CANCELED';

    const openPaymentModal = () => {
        setIsCpfModalOpen(true);
        setCpfError('');
    }

    const handlePaymentSubmit = async () => {
        setCpfError('');
        if (!cpf || cpf.length < 11) {
            setCpfError('CPF inválido.');
            return;
        }
        if (!cardData.number || !cardData.expiry || !cardData.ccv || !cardData.holderName) {
            setCpfError('Preencha todos os dados do cartão.');
            return;
        }

        const [expMonth, expYear] = cardData.expiry.split('/');
        if (!expMonth || !expYear) {
            setCpfError('Validade inválida. Use MM/AAAA');
            return;
        }

        setLoading(true);
        try {
            const result = await createCheckoutSessionAction(cpf, {
                number: cardData.number.replace(/\s/g, ''),
                holderName: cardData.holderName,
                expiryMonth: expMonth,
                expiryYear: expYear,
                ccv: cardData.ccv
            });

            if (result.error) {
                toast.error(result.error);
                setLoading(false);
                return;
            }

            // Success!
            setIsCpfModalOpen(false);
            toast.success('Assinatura realizada com sucesso!', {
                description: 'Seu plano PRO já está ativo. A página será recarregada.'
            });

            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            toast.error('Erro ao processar pagamento.');
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Tem certeza que deseja cancelar sua assinatura PRO?')) return;

        setLoading(true);
        try {
            const result = await cancelSubscriptionAction();
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Assinatura cancelada com sucesso.');
                window.location.reload();
            }
        } catch (error) {
            toast.error('Erro ao cancelar.');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Minha Assinatura</h1>

            {status === 'PENDING' && (
                <div className="bg-yellow-500/10 text-yellow-500 p-4 rounded-md border border-yellow-500/50 mb-4">
                    Seu pagamento está sendo processado. Assim que confirmado, seu plano será atualizado automaticamente.
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Free Plan */}
                <Card className={`relative ${!isPro ? 'border-primary border-2 shadow-lg' : 'opacity-70'}`}>
                    <CardHeader>
                        <CardTitle>Plano Gratuito</CardTitle>
                        <CardDescription>Para testar a plataforma</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-sm space-y-2">
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" /> 2 Vídeos Gratuitos</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" /> Qualidade Padrão</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {!isPro ? (
                            <Button variant="outline" disabled className="w-full">Plano Atual</Button>
                        ) : (
                            <div className="text-sm text-muted-foreground w-full text-center">Disponível</div>
                        )}
                    </CardFooter>
                </Card>

                {/* PRO Plan */}
                <Card className={`relative ${isPro ? 'border-primary border-2 shadow-lg' : ''}`}>
                    {isPro && <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1">Ativo</div>}

                    <CardHeader>
                        <CardTitle>Plano PRO</CardTitle>
                        <CardDescription>R$ 29,90 / mês</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-sm space-y-2">
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Vídeos Ilimitados</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Alta Qualidade</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Prioridade no processamento</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Suporte VIP</li>
                        </ul>

                        {validUntil && (
                            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                                Válido até: {new Date(validUntil).toLocaleDateString()}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        {isPro ? (
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={handleCancel}
                                disabled={loading}
                            >
                                {loading ? 'Processando...' : 'Cancelar Assinatura'}
                            </Button>
                        ) : (
                            <Button
                                className="w-full"
                                onClick={openPaymentModal}
                                disabled={loading}
                            >
                                {loading ? 'Carregando...' : 'Fazer Upgrade'}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>

            {/* Payment Details Dialog */}
            <Dialog open={isCpfModalOpen} onOpenChange={setIsCpfModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Dados do Pagamento</DialogTitle>
                        <DialogDescription>
                            Preencha os dados do cartão para assinar o plano PRO.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="cpf">CPF</Label>
                            <Input
                                id="cpf"
                                placeholder="000.000.000-00"
                                value={cpf}
                                onChange={(e) => setCpf(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cardName">Nome no Cartão</Label>
                            <Input
                                id="cardName"
                                placeholder="Como está no cartão"
                                value={cardData.holderName}
                                onChange={(e) => setCardData({ ...cardData, holderName: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cardNumber">Número do Cartão</Label>
                            <Input
                                id="cardNumber"
                                placeholder="0000 0000 0000 0000"
                                value={cardData.number}
                                onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="expiry">Validade (MM/AAAA)</Label>
                                <Input
                                    id="expiry"
                                    placeholder="MM/AAAA"
                                    value={cardData.expiry}
                                    onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cvv">CVV</Label>
                                <Input
                                    id="cvv"
                                    placeholder="123"
                                    maxLength={4}
                                    value={cardData.ccv}
                                    onChange={(e) => setCardData({ ...cardData, ccv: e.target.value })}
                                />
                            </div>
                        </div>

                        {cpfError && <p className="text-sm text-red-500">{cpfError}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCpfModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handlePaymentSubmit} disabled={loading}>{loading ? 'Processando...' : 'Assinar Agora'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
