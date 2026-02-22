'use client'

import React, { createContext, useContext } from 'react';
import { NodeValidationResult } from './hooks/useNodeValidation';

export const NodeValidationContext = createContext<Record<string, NodeValidationResult>>({});

export function useNodeStatus(nodeId: string) {
    const context = useContext(NodeValidationContext);
    return context[nodeId] || { id: nodeId, state: 'IDLE', errors: [], warnings: [] };
}
