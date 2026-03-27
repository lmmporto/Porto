
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    // Simulação de processamento para V1
    await new Promise(r => setTimeout(r, 2000));

    toast({
      title: "Upload Enviado",
      description: "A chamada foi enviada para análise e aparecerá no feed em breve.",
    });

    setIsUploading(false);
    router.push('/dashboard');
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/dashboard')}
          className="w-fit -ml-2 text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao feed
        </Button>
        <h1 className="text-2xl font-headline font-bold text-slate-900">Laboratório de Validação</h1>
        <p className="text-slate-400 text-sm">Use esta ferramenta para testar o algoritmo de análise com novos áudios.</p>
      </div>

      <Card className="border-slate-100 shadow-none bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-900">Upload de Áudio</CardTitle>
          <CardDescription className="text-xs text-slate-400">Envie arquivos MP3 ou WAV (Máx 50MB).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-6">
            <div 
              className={cn(
                "border border-dashed rounded-xl p-10 text-center transition-all cursor-pointer",
                dragActive ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-400",
                isUploading ? "pointer-events-none opacity-50" : ""
              )}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); }}
            >
              {isUploading ? (
                <div className="space-y-3">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-slate-900" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Processando áudio...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <UploadCloud className="w-8 h-8 mx-auto text-slate-200" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Arraste o arquivo ou clique para selecionar</p>
                  </div>
                  <Input type="file" className="hidden" id="file-upload" accept="audio/*" />
                  <Label htmlFor="file-upload" className="block">
                    <Button type="button" variant="outline" size="sm" className="text-xs font-bold uppercase tracking-wider">Selecionar do PC</Button>
                  </Label>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="call-title" className="text-[10px] font-bold uppercase text-slate-400">Título da Chamada</Label>
                <Input id="call-title" placeholder="Ex: Call de Teste - Playbook V2" className="text-sm border-slate-100" required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sdr-name" className="text-[10px] font-bold uppercase text-slate-400">Nome do SDR</Label>
                <Input id="sdr-name" placeholder="Responsável pela ligação" className="text-sm border-slate-100" required />
              </div>
            </div>

            <Button className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 transition-all font-bold uppercase tracking-widest text-[11px]" disabled={isUploading}>
              {isUploading ? "Enviando..." : "Iniciar Análise Técnica"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
