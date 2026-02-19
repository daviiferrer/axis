'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FlowBuilderCanvas } from '@/components/campaigns/flow-builder-canvas';
import { NodePalette } from '@/components/campaigns/node-palette';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Loader2 } from 'lucide-react';
import { campaignService, Campaign } from '@/services/campaign';

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

    if (!campaign && !isLoading) {
        return <div>Campanha não encontrada</div>;
    }

    return (
        <ReactFlowProvider>
            <div className="flex h-full w-full flex-col bg-transparent overflow-hidden">
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
