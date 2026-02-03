'use client'

import { useEffect } from 'react'
import { preload } from 'swr'
import { wahaService } from '@/services/waha'
import { campaignService } from '@/services/campaign'
import { agentService } from '@/services/agentService'
import api from '@/services/api'

/**
 * DataPrefetcher - Preloads critical data into SWR cache on app mount.
 * 
 * This eliminates skeleton loading states when navigating between pages
 * because the data is already cached. SWR will show cached data immediately
 * and revalidate in the background if needed.
 * 
 * Data prefetched:
 * - Sessions (for Sessions page + Chat selector)
 * - Chats (for Chats page)
 * - Campaigns (for Campaigns page)
 * - Agents (for Agents page)
 * - Dashboard overview (for main dashboard)
 */
export function DataPrefetcher() {
    useEffect(() => {
        const prefetchData = async () => {
            console.log('[Prefetch] Starting data prefetch...')

            try {
                // Prefetch in parallel for speed
                await Promise.allSettled([
                    // Sessions - used in multiple places
                    preload('/sessions', () => wahaService.getSessions(true)),

                    // Chats - main chat list
                    preload('/chats/all', () => wahaService.getChats()),

                    // Campaigns
                    preload('campaigns', () => campaignService.listCampaigns()),

                    // Agents
                    preload('agents', () => agentService.list()),

                    // Dashboard overview (most critical metrics)
                    preload('/dashboard/overview', () => api.get('/dashboard/overview').then(r => r.data)),
                ])

                console.log('[Prefetch] Data prefetch complete!')
            } catch (error) {
                // Silent fail - prefetch is optimization, not critical
                console.warn('[Prefetch] Some prefetch requests failed (non-blocking)', error)
            }
        }

        // Small delay to not block initial render
        const timeoutId = setTimeout(prefetchData, 100)

        return () => clearTimeout(timeoutId)
    }, [])

    // This component renders nothing - it's just for side effects
    return null
}
