import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Check, FileText, Video, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 h-16 flex items-center justify-between border-b">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="bg-primary text-primary-foreground p-1 rounded-md">
            <Video className="h-5 w-5" />
          </div>
          <span>PDF2Video</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button>Começar Agora</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-muted/40">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Transforme seus PDFs em Vídeos Engajadores
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Use nossa IA para converter documentos estáticos em vídeos dinâmicos com legendas automáticas. Ideal para redes sociais e apresentações.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8">Começar Grátis</Button>
                </Link>
                <Link href="#pricing">
                  <Button size="lg" variant="outline" className="h-12 px-8">Ver Planos</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Upload Simples</h3>
                <p className="text-muted-foreground">
                  Basta subir seu arquivo PDF e nossa IA analisa o conteúdo instantaneamente.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Geração Rápida</h3>
                <p className="text-muted-foreground">
                  Em poucos minutos, seu vídeo está pronto com narração e legendas sincronizadas.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Pronto para Publicar</h3>
                <p className="text-muted-foreground">
                  Baixe o vídeo otimizado e compartilhe diretamente em suas redes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Preço Simples</h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Comece grátis. Faça upgrade para criar sem limites.
              </p>
            </div>
            <div className="flex justify-center">
              <Card className="w-full max-w-sm border-2 border-primary shadow-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Pro</CardTitle>
                  <CardDescription>Para criadores de conteúdo</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 text-center">
                  <div className="text-4xl font-bold">R$ 29,90<span className="text-base font-normal text-muted-foreground">/mês</span></div>
                  <ul className="grid gap-2 text-left mt-4">
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-primary" />
                      <span>Criações Ilimitadas</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-primary" />
                      <span>Vídeos em HD</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-primary" />
                      <span>Sem marca d'água</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-primary" />
                      <span>Suporte Prioritário</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/register" className="w-full">
                    <Button className="w-full" size="lg">Assinar Agora</Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">© 2024 PDF2Video AI. Todos os direitos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Termos de Uso
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacidade
          </Link>
        </nav>
      </footer>
    </div>
  );
}
