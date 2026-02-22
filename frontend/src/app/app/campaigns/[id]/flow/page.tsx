'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FlowBuilderCanvas } from '@/components/campaigns/flow-builder-canvas';
import { NodePalette } from '@/components/campaigns/node-palette';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Loader2, AlertCircle, Users, CheckCircle, Activity } from 'lucide-react';
import { campaignService, Campaign } from '@/services/campaign';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CampaignFlowPage() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [flowData, setFlowData] = useState<any>(null);
    const [campaign, setCampaign] = useState<Campaign | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [flow, campaigns] = await Promise.all([
                    campaignService.getFlow(campaignId),
                    campaignService.listCampaigns(),
                ]);
                setFlowData(flow?.flow_data || {});
                const found = campaigns.find((c: Campaign) => c.id === campaignId);
                if (found) setCampaign(found);
            } catch (error) {
                console.error("Failed to load flow", error);
            } finally {
                setIsLoading(false);
            }
        }
        if (campaignId) {
            loadData();
        }
    }, [campaignId]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full flex-col bg-transparent overflow-hidden">
                <div className="flex-1 relative h-full w-full overflow-hidden flex">
                    {/* Sidebar Skeleton */}
                    <div className="w-[72px] h-full bg-transparent flex flex-col items-center py-4 gap-6 z-40">
                        <div className="w-9 h-9 rounded-full bg-gray-200/50 animate-pulse" />
                        <div className="flex flex-col gap-4 w-full px-2 mt-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="w-10 h-10 rounded-xl bg-gray-200/50 animate-pulse mx-auto" />
                            ))}
                        </div>
                    </div>

                    {/* Canvas Skeleton - Exact App Layout Match */}
                    <div className="flex-1 h-full bg-white dark:bg-neutral-900 shadow-sm overflow-hidden rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 m-2 md:ml-0 md:mt-2 md:mb-2 md:mr-2 relative">
                        {/* Header Skeleton */}
                        <div className="absolute top-4 left-4 right-4 h-16 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm z-30 flex items-center px-6 gap-4">
                            <div className="w-8 h-8 rounded-full bg-gray-200/50 animate-pulse" />
                            <div className="h-4 w-32 bg-gray-200/50 rounded animate-pulse" />
                            <div className="flex-1" />
                            <div className="h-9 w-24 bg-gray-200/50 rounded-lg animate-pulse" />
                        </div>
                        {/* Dot Pattern Background */}
                        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
                    </div>
                </div>
            </div>
        );
    }

    if (!campaign) {
        return <div>Campanha não encontrada</div>;
    }

    return (
        <ReactFlowProvider>
            {/* Mobile View - Restricted */}
            <div className="md:hidden flex h-full w-full flex-col overflow-y-auto p-4 bg-gray-50 dark:bg-neutral-900 pb-24">
                <div className="mb-6 mt-4">
                    <h1 className="text-2xl font-bold">{campaign.name}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status === 'active' ? 'Ativa' : 'Inativa'}
                        </Badge>
                        <span className="text-sm text-muted-foreground capitalize">{campaign.type}</span>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-xl mb-6 flex items-start gap-3 border border-blue-100 dark:border-blue-800">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-sm">Construtor Indisponível</h4>
                        <p className="text-xs mt-1 opacity-90">O Flow Builder de campanhas só pode ser acessado pelo computador devido à complexidade da interface visual.</p>
                    </div>
                </div>

                <h3 className="font-semibold text-lg mb-4">Métricas Rápidas</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                Leads <Users className="h-4 w-4" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{campaign.metrics?.total_leads || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                Conversões <CheckCircle className="h-4 w-4" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-500">{campaign.metrics?.converted_leads || 0}</div>
                        </CardContent>
                    </Card>
                    <Card className="col-span-2">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                Taxa de Conversão <Activity className="h-4 w-4" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">
                                {campaign.metrics?.total_leads ?
                                    Math.round(((campaign.metrics.converted_leads || 0) / campaign.metrics.total_leads) * 100)
                                    : 0}%
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Desktop View - Flow Builder */}
            <div className="hidden md:flex h-full w-full flex-col bg-transparent overflow-hidden">
                <div className="flex-1 relative h-full w-full overflow-hidden flex">
                    <NodePalette />
                    {/* Exact match of App Layout Content Box */}
                    <div className="flex-1 h-full bg-white dark:bg-neutral-900 shadow-sm overflow-hidden rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 m-2 md:ml-0 md:mt-2 md:mb-2 md:mr-2 relative">
                        <FlowBuilderCanvas
                            campaignId={campaignId}
                            initialFlow={flowData}
                            campaign={campaign}
                        />
                    </div>
                </div>
            </div>
        </ReactFlowProvider>
    );
}
