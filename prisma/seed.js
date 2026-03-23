const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    const usersToCreate = [
        {
            email: 'prjoaoflavio@hotmail.com',
            passwordPlain: 'Martinez#2026',
            name: 'João Flávio',
        },
        {
            email: 'willianbarata@gmail.com',
            passwordPlain: 'Will#2026',
            name: 'Willian Barata',
        },
    ];

    for (const userData of usersToCreate) {
        const { email, passwordPlain, name } = userData;
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (!existingUser) {
            console.log(`Creating user ${email}...`);
            const password = await hash(passwordPlain, 10);
            const user = await prisma.user.create({
                data: {
                    email,
                    password,
                    name,
                    role: 'ADMIN',
                    plan: 'PRO',
                    isActive: true,
                    creditsUsed: 0,
                    asaasCustomerId: null,
                    subscriptionId: null,
                    subscriptionStatus: 'ACTIVE',
                    validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 10))
                },
            });
            console.log(`Created user with id: ${user.id}`);
        } else {
            console.log(`User ${email} already exists.`);
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
