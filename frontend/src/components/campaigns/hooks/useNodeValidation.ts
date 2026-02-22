import { useMemo } from 'react';
import { Node } from '@xyflow/react';
import { validateNodeData } from '../lib/node-validators';

export type ProcessState = 'IDLE' | 'WARNING' | 'ERROR' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface NodeValidationResult {
    id: string;
    state: ProcessState;
    errors: string[];
    warnings: string[];
}

export function useNodeValidation(nodes: Node[]) {
    return useMemo(() => {
        const results: Record<string, NodeValidationResult> = {};
        let totalErrors = 0;
        let totalWarnings = 0;

        nodes.forEach(node => {
            const validation = validateNodeData(node);

            let state: ProcessState = 'IDLE';
            if (!validation.isValid) {
                state = 'ERROR';
                totalErrors += validation.errors.length;
            } else if (validation.warnings.length > 0) {
                state = 'WARNING';
                totalWarnings += validation.warnings.length;
            }

            // Also check for dynamic states passed via Socket (e.g., RUNNING) later if needed
            // For now, base state is based on static config validity.

            results[node.id] = {
                id: node.id,
                state,
                errors: validation.errors,
                warnings: validation.warnings
            };
        });

        // Overwrite or blend with socket-based real-time state?
        // Since nodes[] inherently contain node.data.realtimeState, we could extract that too.
        nodes.forEach(node => {
            if (node.data?.realtimeState === 'RUNNING') {
                results[node.id].state = 'RUNNING';
            } else if (node.data?.realtimeState === 'SUCCESS') {
                results[node.id].state = 'SUCCESS';
            } else if (node.data?.realtimeState === 'FAILED') {
                results[node.id].state = 'FAILED';
            }
        });

        return {
            validationResults: results,
            totalErrors,
            totalWarnings,
            isValid: totalErrors === 0,
        };
    }, [nodes]);
}
