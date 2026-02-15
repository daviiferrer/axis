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
        <div className="flex h-full w-full flex-col bg-gray-50 overflow-hidden">
            {/* Main Editor Area - Full Screen */}
            <div className="flex-1 relative h-full w-full overflow-hidden">

                {/* Floating Header Overlay */}
                {/* Floating Header removed - moved to NodePalette */}

                <div className="absolute inset-0 z-0 flex">
                    <NodePalette />
                    <FlowBuilderCanvas campaignId={campaignId} initialFlow={flowData} />
                </div>
            </div>
        </div>
    );
}
