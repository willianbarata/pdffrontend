'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { redirect } from 'next/navigation'

const RegisterSchema = z.object({
    name: z.string().min(2, { message: 'Nome é obrigatório.' }),
    email: z.string().email({ message: 'Email inválido.' }),
    password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
})

export type State = {
    errors?: {
        name?: string[]
        email?: string[]
        password?: string[]
    }
    message?: string | null
}

export async function registerAction(prevState: State | undefined, formData: FormData) {
    const validatedFields = RegisterSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Campos inválidos. Falha ao registrar.',
        }
    }

    const { name, email, password } = validatedFields.data

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return {
                message: 'Email já cadastrado.',
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                plan: 'FREE',
                creditsUsed: 0,
            },
        })
    } catch (error) {
        console.error('Registration error:', error)
        return {
            message: 'Erro no banco de dados. Tente novamente.',
        }
    }

    redirect('/login?registered=true')
}

export async function loginAction(
    prevState: string | undefined,
    formData: FormData
) {
    try {
        await signIn('credentials', formData)
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciais inválidas.'
                default:
                    return 'Algo deu errado.'
            }
        }
        throw error
    }
}
