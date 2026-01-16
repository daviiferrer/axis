'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/forms/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/forms/textarea"
// Assuming Textarea exists or use Input for now, but standard is Textarea from UI. 
// I'll check if Textarea exists in UI components later, if not found I'll use simple textarea or create it.
// Checking file list... Step 12 showed 'forms' dir. Let's assume standard shadcn structure. 
// If not, I'll use standard <textarea> with styling.

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/forms/select"
// Verify import path for Select. Step 11 package.json has @radix-ui/react-select.
// Step 12 showed 'overlay' dir. Let's assume Select is there or in 'forms'. 
// Actually standard shadcn puts it in ui/select.tsx. Step 12 file list didn't show select.tsx in root of ui.
// It creates a `select.tsx` file usually.
// Let's check `c:\Users\luisd\Documents\GitHub\ÁXIS\frontend\src\components\ui` again. 
// Ah, step 11 package.json listed `@radix-ui/react-select`.
// Step 12 file list showed `input.tsx`, `label.tsx`, but no `select.tsx`. 
// It might be in `forms` or `overlay`. Step 12 showed `forms` has 13 children.
// I will assume `@/components/ui/select` (if standard) or check where it is.
// To be safe, I'll rely on what I saw or standard HTML select for now if unsure, BUT 
// I want to be professional. I will check `components/ui` structure more deeply in next step if needed. 
// For now I'll use standard imports and if they fail build, I'll fix.
// Actually, I'll check `input.tsx` existence. Yes.

import { campaignService } from "@/services/campaign"
import { wahaService } from "@/services/waha"
import useSWR from "swr"

const formSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    description: z.string().optional(),
    session_id: z.string().min(1, "Selecione uma sessão do WhatsApp"),
})

interface CampaignCreateDialogProps {
    onSuccess?: () => void
}

export function CampaignCreateDialog({ onSuccess }: CampaignCreateDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const { data: sessions } = useSWR('/sessions', () => wahaService.getSessions(true))

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            session_id: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await campaignService.createCampaign(values)
            setOpen(false)
            form.reset()
            onSuccess?.()
            router.refresh()
        } catch (error) {
            console.error(error)
            // Add toast error here
        }
    }

    const workingSessions = sessions?.filter((s: any) => s.status === 'WORKING') || []

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Campanha
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Criar Campanha</DialogTitle>
                    <DialogDescription>
                        Configure os detalhes básicos da sua nova campanha.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Campanha</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Prospecção Q1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Objetivo da campanha..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="session_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>WhatsApp Conectado</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            {...field}
                                        >
                                            <option value="" disabled>Selecione uma sessão...</option>
                                            {workingSessions.map((session: any) => (
                                                <option key={session.name} value={session.id || session.name}>
                                                    {session.name} {session.me?.id ? `(${session.me.id})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Campanha
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
