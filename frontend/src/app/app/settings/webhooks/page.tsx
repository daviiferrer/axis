'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Webhook } from "lucide-react"

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = useState([
        { id: 1, url: 'https://n8n.minhaempresa.com/webhook/msg', status: true, events: ['message.received'] },
        { id: 2, url: 'https://api.crm.com/leads', status: false, events: ['contact.created'] }
    ])

    return (
        <div className="h-full flex flex-col font-inter bg-gray-50/50 p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Webhooks</h1>
                    <p className="text-muted-foreground">Notifique sistemas externos sobre eventos do seu WhatsApp.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Webhook
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Webhooks Configurados</CardTitle>
                    <CardDescription>Gerencie seus endpoints de notificação.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>URL de Destino</TableHead>
                                <TableHead>Eventos</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {webhooks.map((webhook) => (
                                <TableRow key={webhook.id}>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{webhook.url}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {webhook.events.map(event => (
                                                <Badge key={event} variant="outline" className="text-xs">{event}</Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Switch checked={webhook.status} id={`webhook-${webhook.id}`} />
                                            <Label htmlFor={`webhook-${webhook.id}`}>{webhook.status ? 'Ativo' : 'Inativo'}</Label>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="border-dashed shadow-none bg-blue-50/50 border-blue-200">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Webhook className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-base text-blue-800">Precisa de ajuda?</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-blue-700">
                        Consulte nossa documentação para ver o payload exato de cada evento e como validar a assinatura das requisições.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
