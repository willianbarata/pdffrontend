
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

function getHeaders() {
    // HARDCODED FALLBACK PARA PRODUÇÃO
    // O Easypanel tem instabilidade na injeção de vars. Mantendo fallback para garantir funcionamento.
    const debugKey = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmY3OGQ3ODhhLThmOTgtNGU3Yy05MzIxLTI0YjRhYTcxNDQ1Yzo6JGFhY2hfOTAwY2E1ODQtYWY5Yi00M2UzLWE1MGEtZTM4MTU1NTZkOTgw';
    const apiKey = process.env.ASAAS_API_KEY || debugKey;

    if (!apiKey || apiKey.trim() === '') {
        throw new Error('Configuração ausente: ASAAS_API_KEY não encontrada nas variáveis de ambiente.');
    }

    return {
        'Content-Type': 'application/json',
        'access_token': apiKey.trim()
    };
}

interface AsaasCustomer {
    id: string;
    name: string;
    email: string;
}

export async function createAsaasCustomer(user: { name?: string | null, email: string, id: string, cpfCnpj?: string | null }) {
    try {
        const headers = getHeaders();
        // First try to find existing customer by email to avoid duplicates
        const searchResponse = await fetch(`${ASAAS_API_URL}/customers?email=${user.email}`, { headers });
        const searchData = await searchResponse.json();

        if (searchData.data && searchData.data.length > 0) {
            const existingCustomer = searchData.data[0];
            // If we have a CPF but the existing customer might not, force update it
            if (user.cpfCnpj) {
                console.log(`Updating existing customer ${existingCustomer.id} with CPF...`);

                // Note: Asaas API uses POST for updates on /customers/{id}
                const updateResponse = await fetch(`${ASAAS_API_URL}/customers/${existingCustomer.id}`, {
                    method: 'POST',
                    headers: headers, // Use the local headers with the key
                    body: JSON.stringify({ cpfCnpj: user.cpfCnpj })
                });

                if (!updateResponse.ok) {
                    const errText = await updateResponse.text();
                    console.error(`Failed to update customer CPF: ${errText}`);
                    // We log but proceed, hoping for the best or that it was already set
                } else {
                    console.log('Customer updated successfully.');
                }
            }
            return existingCustomer.id;
        }

        // Create new customer
        const response = await fetch(`${ASAAS_API_URL}/customers`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                name: user.name || `User ${user.id}`,
                email: user.email,
                externalReference: user.id,
                cpfCnpj: user.cpfCnpj
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Asaas Create Customer Error: ${error}`);
        }

        const data: AsaasCustomer = await response.json();
        return data.id;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export interface CreditCardData {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
}

export async function createPaymentLink(customerId: string, creditCard?: CreditCardData, holderIdx?: { name: string, email: string, cpfCnpj: string, mobilePhone?: string }) {
    try {
        const payload: any = {
            customer: customerId,
            value: 29.90,
            nextDueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
            cycle: 'MONTHLY',
            description: 'Assinatura PDF2Video PRO'
        };

        if (creditCard && holderIdx) {
            payload.billingType = 'CREDIT_CARD';
            payload.creditCard = creditCard;
            payload.creditCardHolderInfo = {
                name: holderIdx.name,
                email: holderIdx.email,
                cpfCnpj: holderIdx.cpfCnpj,
                mobilePhone: holderIdx.mobilePhone || '11999999999', // Fallback for sandbox if not collected
                postalCode: '01310-930', // Fallback/Dummy for Sandbox
                addressNumber: '100',
                addressComplement: null,
                phone: '1130000000'
            };
        } else {
            payload.billingType = 'UNDEFINED'; // User chooses at checkout (Pix/Card)
        }

        // Create Subscription directly
        const subscriptionResponse = await fetch(`${ASAAS_API_URL}/subscriptions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (!subscriptionResponse.ok) {
            const error = await subscriptionResponse.text();
            throw new Error(`Asaas Create Subscription Error: ${error}`);
        }

        const subData = await subscriptionResponse.json();

        // If credit card, payment is usually automatic, but we might still want to check status
        // For 'UNDEFINED' we fetch the invoice URL.

        // Fetch the generated payment for this subscription to get the checkout URL (or just confirm)
        const paymentsResponse = await fetch(`${ASAAS_API_URL}/payments?subscription=${subData.id}`, { headers: getHeaders() });
        const paymentsData = await paymentsResponse.json();

        if (paymentsData.data && paymentsData.data.length > 0) {
            return {
                url: paymentsData.data[0].invoiceUrl,
                subscriptionId: subData.id,
                status: subData.status
            };
        }

        throw new Error('Subscription created but no invoice generated.');

    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function cancelSubscription(subscriptionId: string) {
    try {
        const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Asaas Cancel Subscription Error: ${error}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getSubscription(subscriptionId: string) {
    try {
        const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            if (response.status === 404) return null;
            const error = await response.text();
            throw new Error(`Asaas Get Subscription Error: ${error}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}
