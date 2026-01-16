'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Zap, Clock, CheckCircle } from "lucide-react"

export default function BillingPage() {
    return (
        <div className="h-full flex flex-col font-inter bg-gray-50/50 p-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Faturamento & Assinatura</h1>
                <p className="text-muted-foreground">Gerencie seu plano, método de pagamento e histórico de faturas.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Current Plan */}
                <Card className="flex flex-col border-blue-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap className="w-24 h-24 text-blue-600" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">Plano Atual</CardTitle>
                        <CardDescription>Você está no plano <Badge className="bg-blue-600 ml-1 hover:bg-blue-700">PRO</Badge></CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="text-3xl font-bold text-gray-900">R$ 297,00<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                        <p className="text-sm text-muted-foreground mt-2">Renova em 15 de Abril de 2026</p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">Gerenciar Assinatura</Button>
                    </CardFooter>
                </Card>

                {/* Credits Usage */}
                <Card className="flex flex-col shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">Uso de Créditos</CardTitle>
                        <CardDescription>Consumo mensal de mensagens e automações</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-700">Mensagens</span>
                                <span className="text-muted-foreground">8.540 / 10.000</span>
                            </div>
                            <Progress value={85} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-700">Agentes Ativos</span>
                                <span className="text-muted-foreground">2 / 5</span>
                            </div>
                            <Progress value={40} className="h-2" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-gray-900 text-white hover:bg-gray-800">Comprar mais créditos</Button>
                    </CardFooter>
                </Card>

                {/* Payment Method */}
                <Card className="flex flex-col shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">Método de Pagamento</CardTitle>
                        <CardDescription>Cartão utilizado para cobranças automáticas</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center gap-4">
                        <div className="h-12 w-16 bg-gray-100 rounded-md flex items-center justify-center border">
                            <CreditCard className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Mastercard final 8829</p>
                            <p className="text-xs text-muted-foreground">Expira em 12/2028</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full">Alterar método</Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Invoice History */}
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Faturas</CardTitle>
                    <CardDescription>Últimos pagamentos realizados</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {[
                            { date: '15 Mar, 2026', amount: 'R$ 297,00', status: 'Pago', id: '#INV-2024-003' },
                            { date: '15 Fev, 2026', amount: 'R$ 297,00', status: 'Pago', id: '#INV-2024-002' },
                            { date: '15 Jan, 2026', amount: 'R$ 297,00', status: 'Pago', id: '#INV-2024-001' },
                        ].map((invoice, i) => (
                            <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{invoice.date}</p>
                                        <p className="text-xs text-muted-foreground">{invoice.id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-gray-900">{invoice.amount}</p>
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">{invoice.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
