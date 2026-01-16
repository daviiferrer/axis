'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FlowBuilderCanvas } from '@/components/campaigns/flow-builder-canvas';
import { NodePalette } from '@/components/campaigns/node-palette';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { campaignService } from '@/services/campaign';

export default function CampaignFlowPage() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [flowData, setFlowData] = useState<any>(null);

    useEffect(() => {
        async function loadFlow() {
            try {
                const data = await campaignService.getFlow(campaignId);
                setFlowData(data?.flow_data || {});
            } catch (error) {
                console.error("Failed to load flow", error);
            } finally {
                setIsLoading(false);
            }
        }
        if (campaignId) {
            loadFlow();
        }
    }, [campaignId]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full flex-col bg-gray-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-semibold text-gray-900">Editor de Fluxo</h1>
                        <p className="text-xs text-muted-foreground">Campanha ID: {campaignId}</p>
                    </div>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex overflow-hidden">
                <NodePalette />
                <div className="flex-1 h-full relative">
                    <FlowBuilderCanvas campaignId={campaignId} initialFlow={flowData} />
                </div>
            </div>
        </div>
    );
}
