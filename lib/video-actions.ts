'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

// 4. Update Credits
// ...

const API_BASE_URL = process.env.API_URL || 'https://pdftovideo-apipdftovideo.xclkv8.easypanel.host';

export async function generateVideoAction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('Não autenticado');
    }

    const file = formData.get('file') as File;
    if (!file) {
        return { error: 'Nenhum arquivo enviado.' };
    }

    // 1. Check Usage Limits
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) return { error: 'Usuário não encontrado.' };

    const isAdmin = session.user.email === 'willianbarata@gmail.com';
    const isVip = isAdmin || session.user.email === 'prjoaoflavio@hotmail.com';
    const isFree = user.plan === 'FREE';
    const hasCredits = user.creditsUsed < 2;

    // Admin/Vip bypasses limit
    if (!isVip && isFree && !hasCredits) {
        return { error: 'Limite gratuito atingido. Faça upgrade para continuar.' };
    }

    try {
        // 2. Call External API
        const apiFormData = new FormData();

        const appendIfPresent = (key: string) => {
            const val = formData.get(key);
            if (val) apiFormData.append(key, val);
        }

        appendIfPresent('file');
        appendIfPresent('text');
        appendIfPresent('image_durations');
        appendIfPresent('background_color');
        appendIfPresent('voice');
        appendIfPresent('speed');
        appendIfPresent('subtitle_config');
        appendIfPresent('image_config');
        appendIfPresent('video_format');

        const images = formData.getAll('images');
        images.forEach((img) => {
            if (img instanceof File && img.size > 0) {
                apiFormData.append('images', img);
            }
        });

        console.log('Enviando para API externa:', `${API_BASE_URL}/gerar-video`);
        const response = await fetch(`${API_BASE_URL}/gerar-video`, {
            method: 'POST',
            body: apiFormData,
        });

        if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('API Response:', text);
            return { error: `Erro na API: ${response.status} - ${text}` };
        }

        // 3. Handle Response
        const contentType = response.headers.get('content-type');
        let videoUrl = '';

        if (contentType?.includes('application/json')) {
            const json = await response.json();
            videoUrl = json.url || json.video_url;
            if (!videoUrl) return { error: 'API não retornou URL do vídeo.' };
        } else {
            const buffer = await response.arrayBuffer();
            const fileName = `video_${user.id}_${Date.now()}.mp4`;
            // Ensure videos directory exists
            const videosDir = path.join(process.cwd(), 'public', 'videos');
            if (!fs.existsSync(videosDir)) {
                await fs.promises.mkdir(videosDir, { recursive: true });
            }
            const filePath = path.join(videosDir, fileName);

            await fs.promises.writeFile(filePath, Buffer.from(buffer));
            // Use the API route to serve the file
            videoUrl = `/api/video/${fileName}`;
        }

        // 4. Save to DB
        await prisma.video.create({
            data: {
                title: file ? file.name.replace('.pdf', '') : (formData.get('text') as string || 'Video Gerado').substring(0, 20),
                url: videoUrl,
                userId: user.id,
                status: 'COMPLETED'
            }
        });

        // 5. Update Credits
        if (!isVip) {
            await prisma.user.update({
                where: { id: user.id },
                data: { creditsUsed: { increment: 1 } }
            });
        }

        revalidatePath('/dashboard');
        return { success: true, videoUrl: videoUrl, videoId: user.id };

    } catch (error) {
        console.error('Generation Error:', error);
        return { error: 'Falha ao processar vídeo.' };
    }
}

export async function extractTextAction(formData: FormData) {
    try {
        const file = formData.get('file');

        const apiFormData = new FormData();
        apiFormData.append('file', file as Blob);

        const response = await fetch(`${API_BASE_URL}/extrair-texto`, {
            method: 'POST',
            body: apiFormData,
        });

        if (!response.ok) {
            const txt = await response.text();
            console.error("Extract Error:", txt);
            return { error: `Erro na extração: ${txt}` };
        }

        const data = await response.json();
        return { text: data.text, estimated_duration: data.estimated_duration_seconds };
    } catch (error) {
        console.error('Extract Action Error:', error);
        return { error: 'Falha ao conectar na API de extração.' };
    }
}

export async function simulateAudioAction(text: string, voice: string, speed: string) {
    try {
        const formData = new FormData();
        formData.append('text', text);
        formData.append('voice', voice);
        formData.append('speed', speed);

        const response = await fetch(`${API_BASE_URL}/simular-audio`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            console.error("Simulate Audio Error:", await response.text());
            return { error: 'Falha ao gerar áudio.' };
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return { audioBase64: `data:audio/mpeg;base64,${base64}` };

    } catch (error) {
        console.error('Simulate Action Error:', error);
        return { error: 'Erro ao simular áudio.' };
    }
}
