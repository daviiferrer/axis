import React, { useState, useEffect } from 'react';
import { agentService, VoiceClone, VoiceConfig } from '@/services/agentService';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Mic, MicOff, MessageSquare, Volume2, RefreshCw, Zap, Activity, Play, Trash2, Upload, CheckCircle2 } from 'lucide-react';

export function VoiceConfigTab({ dna, updateDna, agentId }: { dna: any; updateDna: (section: string, key: string, value: any) => void; agentId?: string }) {
    const [voices, setVoices] = useState<VoiceClone[]>([]);
    const [loading, setLoading] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [success, setSuccess] = useState(false);
    const [voiceName, setVoiceName] = useState('');
    const [voiceDescription, setVoiceDescription] = useState('');
    const [previewText, setPreviewText] = useState('');
    const [previewing, setPreviewingId] = useState<string | null>(null);
    const [synthesizing, setSynthesizing] = useState(false);
    const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const voiceConfig: VoiceConfig = dna?.voice_config || {
        voice_id: '',
        voice_name: '',
        provider: 'qwen', // default
        enabled: false,
        response_mode: 'text_only',
        speed: 1.0,
        temperature: 0.5,
        dynamic_emotion: false
    };

    // Load voices on mount
    useEffect(() => {
        loadVoices();
        return () => { audioPlayer?.pause(); };
    }, [agentId]);

    const loadVoices = async () => {
        setLoading(true);
        try {
            const list = await agentService.listVoices(agentId);
            setVoices(list);
        } catch (e) { console.error('Error loading voices:', e); }
        setLoading(false);
    };

    const handlePlaySample = async (voice: VoiceClone) => {
        if (previewing === voice.id && audioPlayer) {
            audioPlayer.pause();
            setPreviewingId(null);
            setAudioPlayer(null);
            return;
        }

        if (audioPlayer) {
            audioPlayer.pause();
            setSynthesizing(false);
        }

        setPreviewingId(voice.id);

        let urlToPlay = voice.sample_url;
        try {
            if (!urlToPlay) {
                const { audio_base64 } = await agentService.previewVoice(voice.id, "Amostra de voz original.", voice.provider || 'qwen', agentId);
                urlToPlay = `data:audio/mp3;base64,${audio_base64}`;
            }
        } catch (err: any) {
            alert(`Erro no preview: ${err.message}`);
            setPreviewingId(null);
            return;
        }

        if (urlToPlay) {
            const audio = new Audio(urlToPlay);
            audio.onended = () => {
                setPreviewingId(null);
                setAudioPlayer(null);
            };
            audio.play();
            setAudioPlayer(audio);
        } else {
            setPreviewingId(null); // failure
        }
    };

    const handleSynthesizePreview = async () => {
        if (!voiceConfig.voice_id) {
            alert('Selecione uma voz primeiro!');
            return;
        }

        if (synthesizing && audioPlayer) {
            audioPlayer.pause();
            setSynthesizing(false);
            setAudioPlayer(null);
            return;
        }

        if (audioPlayer) {
            audioPlayer.pause();
            setPreviewingId(null);
        }

        setSynthesizing(true);

        try {
            const textToSpeak = previewText.trim() || "Olá, estou testando esta voz livremente. Quero ver como a entonação se comporta no contexto da nossa empresa.";
            const { audio_base64 } = await agentService.previewVoice(voiceConfig.voice_id, textToSpeak, voiceConfig.provider || 'qwen', agentId);
            const urlToPlay = `data:audio/mp3;base64,${audio_base64}`;

            const audio = new Audio(urlToPlay);
            audio.onended = () => {
                setSynthesizing(false);
                setAudioPlayer(null);
            };
            audio.play();
            setAudioPlayer(audio);
        } catch (err: any) {
            alert(`Erro na síntese: ${err.message}`);
            setSynthesizing(false);
        }
    };

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        if (!voiceName) {
            setVoiceName(file.name.replace(/\.[^/.]+$/, "").substring(0, 20));
        }
    }

    async function handleEnroll() {
        if (!selectedFile || !voiceName.trim()) return;

        setEnrolling(true);
        try {
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(selectedFile);
            });

            const nameToUse = voiceName.trim();
            const providerToUse = voiceConfig.provider || 'qwen';

            const result = await agentService.enrollVoice(base64, nameToUse, voiceDescription, agentId, providerToUse);

            updateDna('voice_config', 'voice_id', result.voice_id);
            updateDna('voice_config', 'voice_name', nameToUse);
            updateDna('voice_config', 'provider', result.provider);
            updateDna('voice_config', 'enabled', true);

            setSuccess(true);
            setVoiceName('');
            setVoiceDescription('');
            setSelectedFile(null);
            setTimeout(() => setSuccess(false), 5000);
            await loadVoices();
        } catch (err: any) {
            alert(`Erro ao clonar voz: ${err.message}`);
        } finally {
            setEnrolling(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    const handleDeleteVoice = async (id: string, provider: string) => {
        if (!confirm('Tem certeza? Isso apagará a voz permanentemente.')) return;
        try {
            await agentService.deleteVoice(id, provider, agentId);
            if (voiceConfig.voice_id === id) {
                updateDna('voice_config', 'voice_id', '');
                updateDna('voice_config', 'enabled', false);
            }
            loadVoices();
        } catch (e) {
            alert('Erro ao excluir voz');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${voiceConfig.enabled ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {voiceConfig.enabled ? <Mic size={18} /> : <MicOff size={18} />}
                    </div>
                    <div>
                        <Label className="text-sm font-semibold text-indigo-900">Voz do Agente</Label>
                        <p className="text-[10px] text-indigo-600">
                            {voiceConfig.enabled
                                ? `Ativo: ${voiceConfig.voice_name || 'Voz Selecionada'}`
                                : 'Os áudios estão desativados'}
                        </p>
                    </div>
                </div>
                <Switch
                    checked={voiceConfig.enabled || false}
                    onCheckedChange={(c) => updateDna('voice_config', 'enabled', c)}
                />
            </div>

            {/* RESPONSE MODE */}
            <div className="space-y-2">
                <Label className="text-xs text-gray-500">Modo de Resposta</Label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { id: 'text_only', label: 'Somente Texto', icon: <MessageSquare size={14} /> },
                        { id: 'voice_only', label: 'Somente Voz', icon: <Volume2 size={14} /> },
                        { id: 'mirror', label: 'Espelhar Áudio', icon: <RefreshCw size={14} /> },
                        { id: 'hybrid', label: 'Híbrido (Smart)', icon: <Zap size={14} /> }
                    ].map(m => (
                        <button key={m.id}
                            onClick={() => updateDna('voice_config', 'response_mode', m.id)}
                            className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border text-xs transition-all",
                                voiceConfig.response_mode === m.id
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold"
                                    : "border-gray-200 bg-white hover:border-gray-300 text-gray-600"
                            )}
                        >
                            {m.icon}
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* HYBRID TRIGGERS */}
            {voiceConfig.response_mode === 'hybrid' && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 space-y-3 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-2 text-amber-800">
                        <Zap size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Gatilhos de Voz (Smart)</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { id: 'first_message', label: 'Primeira Mensagem' },
                            { id: 'mirror_audio', label: 'Quando Lead usar Áudio' },
                            { id: 'after_objection', label: 'Após Objeção' },
                            { id: 'on_close', label: 'No Fechamento' }
                        ].map(t => (
                            <div key={t.id} className="flex items-center justify-between bg-white/50 p-2 rounded border border-amber-200/50">
                                <Label className="text-[11px] text-amber-900">{t.label}</Label>
                                <Switch
                                    checked={((voiceConfig as any).triggers)?.[t.id] || false}
                                    onCheckedChange={(c) => {
                                        const newTriggers = { ...((voiceConfig as any).triggers || {}), [t.id]: c };
                                        updateDna('voice_config', 'triggers', newTriggers);
                                    }}
                                    className="scale-75 data-[state=checked]:bg-amber-600"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PROVIDER SELECTION */}
            <div className="space-y-2">
                <Label className="text-xs text-gray-500">Provedor de Voz</Label>
                <div className="flex gap-2">
                    {[
                        { id: 'qwen', label: 'Qwen (DashScope)', desc: 'Clonagem Rápida' },
                        { id: 'lmnt', label: 'LMNT', desc: 'Alta Qualidade + Emoção' }
                    ].map(p => (
                        <button key={p.id}
                            onClick={() => updateDna('voice_config', 'provider', p.id)}
                            className={cn(
                                "flex-1 flex flex-col items-center p-3 rounded-xl border transition-all",
                                voiceConfig.provider === p.id
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                            )}
                        >
                            <span className="text-sm font-bold">{p.label}</span>
                            <span className="text-[10px] text-gray-500">{p.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* LMNT ADVANCED SETTINGS */}
            {voiceConfig.provider === 'lmnt' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-purple-600" />
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Personalidade da Voz</h4>
                    </div>

                    {/* Speed Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label className="text-xs text-gray-600">Velocidade Base</Label>
                            <span className="text-[10px] font-mono bg-white px-1.5 rounded border">{voiceConfig.speed || 1.0}x</span>
                        </div>
                        <input
                            type="range" min="0.5" max="2.0" step="0.1"
                            value={voiceConfig.speed || 1.0}
                            onChange={(e) => updateDna('voice_config', 'speed', parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex justify-between text-[9px] text-gray-400 px-1">
                            <span>Lento</span>
                            <span>Rápido</span>
                        </div>
                    </div>

                    {/* Temperature Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label className="text-xs text-gray-600">Expressividade (Temp)</Label>
                            <span className="text-[10px] font-mono bg-white px-1.5 rounded border">{voiceConfig.temperature || 0.5}</span>
                        </div>
                        <input
                            type="range" min="0.0" max="1.0" step="0.1"
                            value={voiceConfig.temperature || 0.5}
                            onChange={(e) => updateDna('voice_config', 'temperature', parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex justify-between text-[9px] text-gray-400 px-1">
                            <span>Monótono</span>
                            <span>Dinâmico</span>
                        </div>
                    </div>

                    {/* Dynamic Emotion Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                        <div>
                            <Label className="text-xs font-semibold text-purple-700">Adaptação Emocional Dinâmica</Label>
                            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                                Ajusta velocidade e tom baseado na emoção do Lead (PAD).
                            </p>
                        </div>
                        <Switch
                            checked={voiceConfig.dynamic_emotion || false}
                            onCheckedChange={(c) => updateDna('voice_config', 'dynamic_emotion', c)}
                            className="data-[state=checked]:bg-purple-600"
                        />
                    </div>
                </div>
            )}

            {/* Voice List & Enrollment */}
            <div className="space-y-3 pt-2">
                <Label className="text-xs text-gray-500">Biblioteca de Vozes ({voiceConfig.provider})</Label>

                {/* List */}
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {voices.filter(v => v.provider === voiceConfig.provider || (!v.provider && voiceConfig.provider === 'qwen')).map(voice => (
                        <div key={voice.id}
                            onClick={() => {
                                updateDna('voice_config', 'voice_id', voice.id);
                                updateDna('voice_config', 'voice_name', voice.name);
                                updateDna('voice_config', 'provider', voice.provider || 'qwen');
                            }}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all hover:border-indigo-400 relative overflow-hidden group",
                                voiceConfig.voice_id === voice.id
                                    ? "bg-indigo-600 border-indigo-600 ring-4 ring-indigo-600/20 text-white shadow-lg shadow-indigo-200"
                                    : "bg-white border-gray-200 hover:shadow-sm"
                            )}
                        >
                            {/* Visual effect for selected */}
                            {voiceConfig.voice_id === voice.id && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
                            )}

                            <div className="flex items-center gap-3 relative z-10 overflow-hidden">
                                <div className={cn("p-2 rounded-full shrink-0 transition-colors",
                                    voiceConfig.voice_id === voice.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                                )}>
                                    {voiceConfig.voice_id === voice.id ? <CheckCircle2 size={16} /> : <Mic size={16} />}
                                </div>
                                <div className="truncate">
                                    <div className="flex items-center gap-2">
                                        <p className={cn("text-xs font-bold truncate", voiceConfig.voice_id === voice.id ? "text-white" : "text-gray-900")}>
                                            {voice.name}
                                        </p>
                                        <span className={cn(
                                            "text-[8px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider",
                                            voiceConfig.voice_id === voice.id
                                                ? "bg-white/20 text-white border-white/30"
                                                : (voice.provider === 'lmnt' ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200")
                                        )}>
                                            {voice.provider || 'qwen'}
                                        </span>
                                    </div>
                                    <p className={cn("text-[9px] mt-0.5", voiceConfig.voice_id === voice.id ? "text-indigo-100" : "text-gray-400")}>
                                        {voice.id.substring(0, 8)}...
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 relative z-10">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePlaySample(voice); }}
                                    className={cn("p-2 rounded-lg transition-all shadow-sm",
                                        previewing === voice.id ? "bg-emerald-500 text-white animate-pulse" :
                                            voiceConfig.voice_id === voice.id ? "bg-white/20 text-white hover:bg-white/30" : "bg-gray-50 text-gray-500 hover:bg-indigo-100 hover:text-indigo-600"
                                    )}
                                    title="Ouvir Áudio Original"
                                >
                                    {previewing === voice.id ? <Activity size={12} className="animate-pulse" /> : <Play size={12} className="ml-0.5" />}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteVoice(voice.id, voice.provider || 'qwen'); }}
                                    className={cn("p-2 rounded-lg transition-all shadow-sm",
                                        voiceConfig.voice_id === voice.id ? "bg-white/10 text-indigo-100 hover:bg-red-500 hover:text-white" : "bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                    )}
                                    title="Excluir Voz"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {voices.filter(v => v.provider === voiceConfig.provider || (!v.provider && voiceConfig.provider === 'qwen')).length === 0 && (
                        <div className="text-center py-6 text-gray-400 text-xs border border-dashed rounded-lg bg-gray-50/50">
                            Nenhuma voz encontrada para este provedor.
                        </div>
                    )}
                </div>

                {/* Voice Test Studio (Dedicated) */}
                <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/50 rounded-2xl p-4 mt-4 border border-indigo-100 shadow-inner overflow-hidden relative group">
                    {/* Background glow effect */}
                    <div className="absolute -inset-10 bg-indigo-500/5 blur-3xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-1000"></div>

                    <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg shadow-sm border border-indigo-200/50">
                                <Zap size={14} className={synthesizing ? "animate-pulse" : ""} />
                            </div>
                            <div>
                                <Label className="text-xs font-black text-indigo-900 leading-none uppercase tracking-wide">Estúdio de Síntese</Label>
                                <p className="text-[10px] text-indigo-600/80 mt-0.5 font-medium">Teste o áudio com a voz atualmente selecionada.</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <Textarea
                            placeholder="Ex: Olá! Falo com o responsável pelo faturamento da empresa? Gostaria de entender mais..."
                            value={previewText}
                            onChange={e => setPreviewText(e.target.value)}
                            className="h-20 text-[11px] font-medium text-gray-700 leading-relaxed resize-none bg-white/90 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent border-indigo-200/60 shadow-sm rounded-xl mb-3 transition-shadow hover:shadow-md"
                        />

                        <Button
                            onClick={handleSynthesizePreview}
                            disabled={!voiceConfig.voice_id}
                            className={cn(
                                "w-full h-10 text-xs font-bold rounded-xl transition-all duration-300 shadow-md",
                                synthesizing
                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200 animate-pulse border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1"
                                    : voiceConfig.voice_id
                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-300 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"
                                        : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            )}
                        >
                            {synthesizing ? (
                                <Activity size={16} className="mr-2 animate-spin" />
                            ) : (
                                <Play size={16} className="mr-2" fill="currentColor" />
                            )}
                            {synthesizing ? 'Sintetizando e Reproduzindo...' : 'Gerar Áudio de Teste'}
                        </Button>
                        {!voiceConfig.voice_id && (
                            <p className="text-[9.5px] text-center text-rose-500 mt-2 font-semibold animate-in fade-in">⚠️ Selecione uma voz na lista acima primeiro.</p>
                        )}
                    </div>
                </div>

                {/* New Enrollment */}
                <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-3 space-y-3 mt-2">
                    <Label className="text-xs font-semibold text-indigo-900 flex items-center gap-2">
                        <Upload className="w-3 h-3" />
                        Clonar Nova Voz ({voiceConfig.provider === 'lmnt' ? 'LMNT Instant' : 'Qwen Fast'})
                    </Label>

                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            value={voiceName}
                            onChange={(e) => setVoiceName(e.target.value)}
                            placeholder="Nome da Voz"
                            className="col-span-2 h-8 text-xs bg-white"
                        />
                        <Input
                            value={voiceDescription}
                            onChange={(e) => setVoiceDescription(e.target.value)}
                            placeholder="Descrição (opcional)"
                            className="col-span-2 h-8 text-xs bg-white"
                        />
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}
                            className={cn("flex-1 h-8 text-xs bg-white", selectedFile && "border-green-500 text-green-700")}>
                            {selectedFile ? 'Arquivo Selecionado' : 'Selecionar Áudio'}
                        </Button>
                        <Button size="sm" onClick={handleEnroll} disabled={enrolling || !selectedFile || !voiceName}
                            className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                            {enrolling ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Mic className="w-3 h-3 mr-1" />}
                            {enrolling ? 'Clonando...' : 'Clonar Agora'}
                        </Button>
                    </div>
                    {selectedFile && <p className="text-[9px] text-center text-gray-500">{selectedFile.name}</p>}
                </div>
            </div>
        </div>
    );
}
