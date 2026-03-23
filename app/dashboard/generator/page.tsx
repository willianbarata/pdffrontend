'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { generateVideoAction, extractTextAction, simulateAudioAction } from '@/lib/video-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, AlertCircle, Play, FileText, Settings, Image as ImageIcon, Video, Palette, Type, Smartphone, Monitor, ZoomIn, Move, ChevronLeft, ChevronRight, AlignVerticalJustifyCenter, AlignVerticalJustifyStart, AlignVerticalJustifyEnd, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from "@/components/ui/switch";

export default function GeneratorPage() {
    // Steps: 1=Config, 2=Preview, 3=Generating, 4=Success
    const [step, setStep] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Data State
    const [mode, setMode] = useState<'pdf' | 'text'>('pdf');
    const [file, setFile] = useState<File | null>(null);
    const [textInput, setTextInput] = useState('');
    const [extractedText, setExtractedText] = useState('');

    // Core Settings
    const [videoFormat, setVideoFormat] = useState<'landscape' | 'portrait'>('landscape'); // YouTube vs TikTok

    // Visuals State
    const [bgMode, setBgMode] = useState<'color' | 'image'>('color');
    const [images, setImages] = useState<File[]>([]);
    const [imageDurations, setImageDurations] = useState<number[]>([]);
    const [bgColor, setBgColor] = useState('#000000');

    // Image Advanced Config
    const [imgConfig, setImgConfig] = useState({
        zoom: 1.0,
        pan_x: 0,
        pan_y: 0
    });

    // Preview Selection
    const [previewImageIdx, setPreviewImageIdx] = useState(0);

    // Subtitle Styling
    const [subProps, setSubProps] = useState({
        fontsize: 40,
        color: '#ffffff',
        stroke_color: '#000000',
        stroke_width: 2,
        bg_color: '#000000',
        position_y: 'bottom' // bottom, center, top
    });

    // Audio State
    const [voice, setVoice] = useState('pt-BR-AntonioNeural');
    const [speed, setSpeed] = useState('+0%');

    // Simulation
    const [audioData, setAudioData] = useState<string | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // --- LOGIC: SMART SLIDER ---
    const updateDuration = (index: number, newVal: number) => {
        const count = imageDurations.length;
        if (count <= 1) return setImageDurations([100]);
        newVal = Math.max(1, Math.min(newVal, 100 - (count - 1)));
        let newDurations = [...imageDurations];
        newDurations[index] = newVal;
        const othersIndices = newDurations.map((_, i) => i).filter(i => i !== index);
        let remaining = 100 - newVal;
        const part = Math.floor(remaining / othersIndices.length);
        othersIndices.forEach((i, idx) => {
            newDurations[i] = (idx === othersIndices.length - 1) ? (remaining - part * (othersIndices.length - 1)) : part;
        });
        setImageDurations(newDurations);
    };

    // Handlers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newImages = Array.from(e.target.files);
            setImages(prev => [...prev, ...newImages]);
            setImageDurations(prev => {
                const total = prev.length + newImages.length;
                if (total === 0) return [];
                const part = Math.floor(100 / total);
                const arr = new Array(total).fill(part);
                arr[total - 1] += (100 - (part * total));
                return arr;
            });
        }
    };

    const removeImage = (index: number) => {
        const newImgs = images.filter((_, i) => i !== index);
        setImages(newImgs);
        const total = newImgs.length;
        if (total === 0) setImageDurations([]);
        else {
            const part = Math.floor(100 / total);
            const arr = new Array(total).fill(part);
            arr[total - 1] += (100 - (part * total));
            setImageDurations(arr);
        }
    };

    const handlePreview = async () => {
        setError(null);
        setStep(2);
        setAudioData(null);

        if (mode === 'pdf') {
            if (!file) {
                setError("Selecione um PDF.");
                setStep(1);
                return;
            }
            setIsSimulating(true);
            try {
                const formData = new FormData();
                formData.append('file', file);
                const result = await extractTextAction(formData);
                if (result.error) throw new Error(result.error);
                setExtractedText(result.text || "Nenhum texto encontrado no PDF.");
            } catch (e: any) {
                console.error(e);
                setError(e.message || "Falha ao extrair texto.");
                setExtractedText("");
            }
            setIsSimulating(false);
        } else {
            setExtractedText(textInput);
        }
    };

    const handleSimulateAudio = async () => {
        if (!extractedText) return;
        setIsSimulating(true);
        setAudioData(null);
        try {
            const snippet = extractedText.substring(0, 100);
            const res = await simulateAudioAction(snippet, voice, speed);
            if (res.error) throw new Error(res.error);
            if (res.audioBase64) {
                setAudioData(res.audioBase64);
                setTimeout(() => {
                    if (audioRef.current) audioRef.current.play().catch(e => console.error("Auto-play blocked", e));
                }, 100);
            }
        } catch (e: any) {
            setError(e.message || "Erro ao simular áudio");
        }
        setIsSimulating(false);
    };

    // State for Success Step
    const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);

    const handleGenerate = async () => {
        setError(null);
        setStep(3);
        let prog = 0;
        const interval = setInterval(() => {
            prog += 5;
            if (prog > 90) clearInterval(interval);
            setProgress(prog);
        }, 500);

        const formData = new FormData();
        if (mode === 'pdf' && file) formData.append('file', file);
        if (extractedText) formData.append('text', extractedText);

        // Strict Mode Logic matches Backend
        if (bgMode === 'image' && images.length > 0) {
            images.forEach(img => formData.append('images', img));
            formData.append('image_durations', JSON.stringify(imageDurations));
            formData.append('image_config', JSON.stringify(imgConfig));
        } else {
            // Color Mode default
            formData.append('background_color', bgColor);
        }

        formData.append('voice', voice);
        formData.append('speed', speed);
        formData.append('video_format', videoFormat);
        formData.append('subtitle_config', JSON.stringify(subProps));

        startTransition(async () => {
            const result = await generateVideoAction(formData);
            clearInterval(interval);
            setProgress(100);
            if (result?.error) {
                setError(result.error);
                setStep(2);
            } else if (result?.success && result.videoUrl) {
                setResultVideoUrl(result.videoUrl);
                setStep(4);
            } else {
                setError("Resposta inesperada do servidor.");
                setStep(2);
            }
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Video className="w-8 h-8" /> Gerador de Vídeo
                </h1>
                {step === 3 && <span className="text-muted-foreground animate-pulse">Processando...</span>}
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* STEP 1: CONFIGURATION */}
            {step === 1 && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* LEFT COL: CONTENT */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Conteúdo</CardTitle>
                            <CardDescription>Escolha a fonte do seu vídeo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
                                <TabsList className="grid w-full grid-cols-2 mb-4">
                                    <TabsTrigger value="pdf">Arquivo PDF</TabsTrigger>
                                    <TabsTrigger value="text">Texto Livre</TabsTrigger>
                                </TabsList>
                                <TabsContent value="pdf" className="space-y-4">
                                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
                                        <Input type="file" accept=".pdf" className="hidden" id="pdf-upload" onChange={handleFileChange} />
                                        <Label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                            <Upload className="h-10 w-10 text-muted-foreground" />
                                            <span className="font-medium">{file ? file.name : "Clique para enviar PDF"}</span>
                                            <span className="text-xs text-muted-foreground">Máx 10MB</span>
                                        </Label>
                                    </div>
                                </TabsContent>
                                <TabsContent value="text">
                                    <Textarea placeholder="Cole seu roteiro aqui..." className="h-40" value={textInput} onChange={(e) => setTextInput(e.target.value)} />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* RIGHT COL: VISUALS & AUDIO */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>2. Visual e Formato</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Label className="text-base font-semibold">Formato do Vídeo</Label>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <Button
                                        variant={videoFormat === 'landscape' ? 'default' : 'outline'}
                                        onClick={() => setVideoFormat('landscape')}
                                        className="h-14"
                                    >
                                        <Monitor className="mr-2 h-5 w-5" /> YouTube (16:9)
                                    </Button>
                                    <Button
                                        variant={videoFormat === 'portrait' ? 'default' : 'outline'}
                                        onClick={() => setVideoFormat('portrait')}
                                        className="h-14"
                                    >
                                        <Smartphone className="mr-2 h-5 w-5" /> TikTok (9:16)
                                    </Button>
                                </div>

                                <Label className="text-base font-semibold">Fundo</Label>
                                <Tabs value={bgMode} onValueChange={(v) => setBgMode(v as any)} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="color"><Palette className="w-4 h-4 mr-2" /> Cor Sólida</TabsTrigger>
                                        <TabsTrigger value="image"><ImageIcon className="w-4 h-4 mr-2" /> Imagens</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="color" className="pt-4">
                                        <Label>Cor de Fundo</Label>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                                            <span className="text-sm font-mono text-muted-foreground">{bgColor}</span>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="image" className="pt-4 space-y-4">
                                        <div>
                                            <Label>Upload de Imagens (Auto-ajuste 100%)</Label>
                                            <Input type="file" accept="image/*" multiple onChange={handleImagesChange} className="mt-2" />
                                            {images.length > 0 ? (
                                                <div className="mt-4 space-y-4 max-h-60 overflow-y-auto pr-2 border rounded p-2">
                                                    {images.map((img, i) => (
                                                        <div key={i} className="flex items-center gap-4 text-sm border p-2 rounded bg-card">
                                                            <ImageIcon className="w-4 h-4 shrink-0" />
                                                            <span className="truncate w-16">{img.name}</span>
                                                            <div className="flex-1">
                                                                <div className="flex justify-between text-xs mb-1">
                                                                    <span>Duração</span>
                                                                    <span>{imageDurations[i]}%</span>
                                                                </div>
                                                                <Slider value={[imageDurations[i] || 0]} max={100} step={1} onValueChange={(v) => updateDuration(i, v[0])} />
                                                            </div>
                                                            <Button variant="ghost" size="icon" onClick={() => removeImage(i)} className="text-red-500 h-6 w-6">x</Button>
                                                        </div>
                                                    ))}
                                                    <p className="text-xs text-center text-muted-foreground pt-2">Total: {imageDurations.reduce((a, b) => a + b, 0)}%</p>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground mt-2">Nenhuma imagem selecionada.</p>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>3. Áudio</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Voz</Label>
                                    <Select value={voice} onValueChange={setVoice}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pt-BR-AntonioNeural">Antonio (BR)</SelectItem>
                                            <SelectItem value="pt-BR-FranciscaNeural">Francisca (BR)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Velocidade</Label>
                                    <Select value={speed} onValueChange={setSpeed}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="-50%">Muito Lento (-50%)</SelectItem>
                                            <SelectItem value="-40%">Lento (-40%)</SelectItem>
                                            <SelectItem value="-30%">Lento (-30%)</SelectItem>
                                            <SelectItem value="-20%">Lento (-20%)</SelectItem>
                                            <SelectItem value="-10%">Lento (-10%)</SelectItem>
                                            <SelectItem value="+0%">Normal</SelectItem>
                                            <SelectItem value="+10%">Rápido (+10%)</SelectItem>
                                            <SelectItem value="+20%">Rápido (+20%)</SelectItem>
                                            <SelectItem value="+30%">Rápido (+30%)</SelectItem>
                                            <SelectItem value="+40%">Rápido (+40%)</SelectItem>
                                            <SelectItem value="+50%">Muito Rápido (+50%)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="md:col-span-2">
                        <Button className="w-full h-12 text-lg" onClick={handlePreview} disabled={isSimulating}>
                            {isSimulating ? 'Extraindo...' : 'Pré-visualizar e Editar'} <FileText className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 2: PREVIEW & STYLE */}
            {step === 2 && (
                <div className="grid gap-6 lg:grid-cols-2 animate-in slide-in-from-right duration-300">
                    <div className="space-y-6">
                        {/* Editor Tabs: Legenda vs Imagem */}
                        <Card className="h-full">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex justify-between items-center">
                                    <span>Personalização</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Tabs defaultValue="subtitle">
                                    <TabsList className="grid w-full grid-cols-2 mb-4">
                                        <TabsTrigger value="subtitle"><Type className="w-4 h-4 mr-2" /> Legenda</TabsTrigger>
                                        <TabsTrigger value="image" disabled={bgMode !== 'image'}>
                                            <ImageIcon className="w-4 h-4 mr-2" /> Imagem ({imgConfig.zoom.toFixed(1)}x)
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* SUBTITLE TAB */}
                                    <TabsContent value="subtitle" className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Tamanho ({subProps.fontsize}px)</Label>
                                                <Slider value={[subProps.fontsize]} max={80} min={10} step={1} onValueChange={(v) => setSubProps({ ...subProps, fontsize: v[0] })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Borda ({subProps.stroke_width})</Label>
                                                <Slider value={[subProps.stroke_width]} max={10} min={0} step={0.5} onValueChange={(v) => setSubProps({ ...subProps, stroke_width: v[0] })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Texto</Label>
                                                <Input type="color" value={subProps.color} onChange={(e) => setSubProps({ ...subProps, color: e.target.value })} className="h-8 w-full p-1" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Borda</Label>
                                                <Input type="color" value={subProps.stroke_color} onChange={(e) => setSubProps({ ...subProps, stroke_color: e.target.value })} className="h-8 w-full p-1" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Fundo</Label>
                                                <Input type="color" value={subProps.bg_color} onChange={(e) => setSubProps({ ...subProps, bg_color: e.target.value })} className="h-8 w-full p-1" />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="mb-2 block">Posição Vertical</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant={subProps.position_y === 'top' ? 'default' : 'outline'}
                                                    size="sm" onClick={() => setSubProps({ ...subProps, position_y: 'top' })}
                                                    className="flex-1"
                                                >
                                                    <AlignVerticalJustifyStart className="w-4 h-4 mr-2" /> Topo
                                                </Button>
                                                <Button
                                                    variant={subProps.position_y === 'center' ? 'default' : 'outline'}
                                                    size="sm" onClick={() => setSubProps({ ...subProps, position_y: 'center' })}
                                                    className="flex-1"
                                                >
                                                    <AlignVerticalJustifyCenter className="w-4 h-4 mr-2" /> Meio
                                                </Button>
                                                <Button
                                                    variant={subProps.position_y === 'bottom' ? 'default' : 'outline'}
                                                    size="sm" onClick={() => setSubProps({ ...subProps, position_y: 'bottom' })}
                                                    className="flex-1"
                                                >
                                                    <AlignVerticalJustifyEnd className="w-4 h-4 mr-2" /> Fim
                                                </Button>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* IMAGE TAB */}
                                    <TabsContent value="image" className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="flex justify-between">
                                                <span className="flex items-center"><ZoomIn className="w-4 h-4 mr-2" /> Zoom</span>
                                                <span className="text-muted-foreground">{imgConfig.zoom.toFixed(1)}x</span>
                                            </Label>
                                            <Slider value={[imgConfig.zoom]} max={3} min={1} step={0.1} onValueChange={(v) => setImgConfig({ ...imgConfig, zoom: v[0] })} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="flex justify-between">
                                                <span className="flex items-center"><Move className="w-4 h-4 mr-2" /> Posição X (Horizontal)</span>
                                                <span className="text-muted-foreground">{imgConfig.pan_x}px</span>
                                            </Label>
                                            <Slider value={[imgConfig.pan_x]} max={500} min={-500} step={10} onValueChange={(v) => setImgConfig({ ...imgConfig, pan_x: v[0] })} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="flex justify-between">
                                                <span className="flex items-center"><Move className="w-4 h-4 mr-2 rotate-90" /> Posição Y (Vertical)</span>
                                                <span className="text-muted-foreground">{imgConfig.pan_y}px</span>
                                            </Label>
                                            <Slider value={[imgConfig.pan_y]} max={500} min={-500} step={10} onValueChange={(v) => setImgConfig({ ...imgConfig, pan_y: v[0] })} />
                                        </div>

                                        <Alert>
                                            <AlertDescription className="text-xs">
                                                Esses ajustes serão aplicados a <strong>todas</strong> as imagens para manter a consistência.
                                            </AlertDescription>
                                        </Alert>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="h-full flex flex-col">
                            <CardHeader className="pb-2">
                                <CardTitle>Prévia Visual</CardTitle>
                                <CardDescription>{videoFormat === 'landscape' ? 'YouTube / Desktop (16:9)' : 'TikTok / Reels (9:16)'}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-4">
                                {/* PREVIEW BOX - Dynamic Aspect Ratio */}
                                <div className="w-full flex justify-center bg-zinc-900 rounded-lg p-2 overflow-hidden relative">
                                    <div
                                        className="relative overflow-hidden shadow-2xl transition-all duration-300"
                                        style={{
                                            width: videoFormat === 'landscape' ? '100%' : 'auto',
                                            height: videoFormat === 'landscape' ? 'auto' : '500px',
                                            aspectRatio: videoFormat === 'landscape' ? '16/9' : '9/16',
                                            backgroundColor: bgMode === 'color' ? bgColor : '#000',
                                        }}
                                    >
                                        {/* Background Image Layer with Zoom/Pan */}
                                        {bgMode === 'image' && images.length > 0 && (
                                            <div
                                                className="absolute inset-0 bg-cover bg-center transition-transform duration-300"
                                                style={{
                                                    backgroundImage: `url(${URL.createObjectURL(images[previewImageIdx % images.length])})`,
                                                    transform: `scale(${imgConfig.zoom}) translate(${imgConfig.pan_x}px, ${imgConfig.pan_y}px)`,
                                                }}
                                            />
                                        )}

                                        {/* Image Navigation Arrows */}
                                        {bgMode === 'image' && images.length > 1 && (
                                            <>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10"
                                                    onClick={() => setPreviewImageIdx(prev => (prev - 1 + images.length) % images.length)}
                                                >
                                                    <ChevronLeft className="w-6 h-6" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10"
                                                    onClick={() => setPreviewImageIdx(prev => (prev + 1) % images.length)}
                                                >
                                                    <ChevronRight className="w-6 h-6" />
                                                </Button>
                                                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                                    {(previewImageIdx % images.length) + 1} / {images.length}
                                                </div>
                                            </>
                                        )}

                                        {/* Subtitle Layer */}
                                        <div className={`absolute inset-x-2 flex justify-center ${subProps.position_y === 'top' ? 'top-10' :
                                            subProps.position_y === 'center' ? 'top-1/2 -translate-y-1/2' :
                                                'bottom-10'
                                            }`}>
                                            <div style={{
                                                backgroundColor: subProps.bg_color,
                                                padding: '4px 12px',
                                                borderRadius: '6px',
                                                maxWidth: '90%',
                                                textAlign: 'center'
                                            }}>
                                                <p style={{
                                                    fontSize: 'var(--preview-font-size)',
                                                    // We scale font for preview because 40px is too big for a small div
                                                    // rough approx: actual size / 2.5
                                                    ['--preview-font-size' as any]: `${Math.max(12, subProps.fontsize / 2.5)}px`,
                                                    color: subProps.color,
                                                    fontWeight: 'bold',
                                                    WebkitTextStroke: `${subProps.stroke_width / 2.5}px ${subProps.stroke_color}`,
                                                    fontFamily: 'Arial, sans-serif',
                                                    margin: 0,
                                                    lineHeight: 1.2
                                                }}>
                                                    Legenda de Exemplo
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Textarea value={extractedText} onChange={(e) => setExtractedText(e.target.value)} className="min-h-[100px] text-sm p-4" placeholder="Texto falado..." />

                                <CardFooter className="flex gap-4 p-0 pt-2">
                                    <Button variant="outline" onClick={() => setStep(1)} className="w-1/3">Voltar</Button>
                                    <Button className="w-2/3" onClick={handleGenerate}>Gerar Vídeo <Video className="ml-2 w-5 h-5" /></Button>
                                </CardFooter>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* STEP 3: LOADING */}
            {step === 3 && (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                    <div className="w-full max-w-md space-y-6 text-center">
                        <div className="relative w-32 h-32 mx-auto">
                            <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <Video className="absolute inset-0 m-auto text-primary w-10 h-10 animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold">Criando sua obra de arte...</h2>
                        <p className="text-muted-foreground">Isso pode levar alguns minutos.</p>
                        <Progress value={progress} className="h-2" />
                    </div>
                </div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && resultVideoUrl && (
                <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in duration-500 space-y-8">
                    <Alert className="max-w-2xl border-yellow-500/50 bg-yellow-500/10 text-yellow-500">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Atenção: Vídeo Temporário</AlertTitle>
                        <AlertDescription>
                            Este vídeo não é salvo permanentemente. <strong>Baixe agora</strong> ou ele será perdido se você sair desta página ou se o servidor reiniciar.
                        </AlertDescription>
                    </Alert>

                    <Card className="w-full max-w-4xl overflow-hidden bg-black/50 border-zinc-800">
                        <CardContent className="p-0">
                            <video
                                src={resultVideoUrl}
                                controls
                                autoPlay
                                className="w-full h-auto max-h-[70vh] aspect-video mx-auto"
                            />
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-4 text-center">
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                            Vídeo Gerado com Sucesso!
                        </h2>
                        <div className="flex gap-4 justify-center">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                Criar Novo Vídeo
                            </Button>
                            <Button size="lg" className="gap-2" asChild>
                                <a href={resultVideoUrl} download="video_gerado.mp4">
                                    <Download className="w-5 h-5" /> Baixar Vídeo Agora
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
