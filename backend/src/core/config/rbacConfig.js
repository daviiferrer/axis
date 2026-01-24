/**
 * rbacConfig.js
 * 
 * ROLE-BASED ACCESS CONTROL CONFIGURATION
 * ========================================
 * Defines what each role can do on which resource.
 */

const Roles = {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    OPERATOR: 'OPERATOR',
    VIEWER: 'VIEWER'
};

const Resources = {
    CAMPAIGN: 'CAMPAIGN',
    AGENT: 'AGENT',
    WORKFLOW: 'WORKFLOW',
    WAHA: 'WAHA',
    DASHBOARD: 'DASHBOARD',
    LEAD: 'LEAD',
    BILLING: 'BILLING',
    TEAM: 'TEAM'
};

const Actions = {
    CREATE: 'CREATE',
    READ: 'READ',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    START: 'START',
    PAUSE: 'PAUSE',
    RESUME: 'RESUME',
    CONNECT: 'CONNECT',
    RECONNECT: 'RECONNECT',
    SIMULATE: 'SIMULATE'
};

/**
 * Permission Map
 * Format: [Role]: { [Resource]: [Actions] }
 */
const PermissionMap = {
    [Roles.OWNER]: {
        [Resources.CAMPAIGN]: [Actions.CREATE, Actions.READ, Actions.UPDATE, Actions.DELETE, Actions.START, Actions.PAUSE, Actions.RESUME],
        [Resources.AGENT]: [Actions.CREATE, Actions.READ, Actions.UPDATE, Actions.DELETE],
        [Resources.WORKFLOW]: [Actions.CREATE, Actions.READ, Actions.UPDATE, Actions.DELETE, Actions.SIMULATE],
        [Resources.WAHA]: [Actions.CONNECT, Actions.READ, Actions.RECONNECT],
        [Resources.DASHBOARD]: [Actions.READ],
        [Resources.LEAD]: [Actions.CREATE, Actions.READ, Actions.UPDATE, Actions.DELETE],
        [Resources.BILLING]: [Actions.READ, Actions.UPDATE],
        [Resources.TEAM]: [Actions.CREATE, Actions.READ, Actions.UPDATE, Actions.DELETE]
    },
    [Roles.ADMIN]: {
        [Resources.CAMPAIGN]: [Actions.CREATE, Actions.READ, Actions.UPDATE, Actions.DELETE, Actions.START, Actions.PAUSE, Actions.RESUME],
        [Resources.AGENT]: [Actions.CREATE, Actions.READ, Actions.UPDATE],
        [Resources.WORKFLOW]: [Actions.CREATE, Actions.READ, Actions.UPDATE, Actions.DELETE, Actions.SIMULATE],
        [Resources.WAHA]: [Actions.CONNECT, Actions.READ, Actions.RECONNECT],
        [Resources.DASHBOARD]: [Actions.READ],
        [Resources.LEAD]: [Actions.CREATE, Actions.READ, Actions.UPDATE],
        [Resources.TEAM]: [Actions.READ, Actions.CREATE]
    },
    [Roles.OPERATOR]: {
        [Resources.CAMPAIGN]: [Actions.READ, Actions.PAUSE, Actions.RESUME],
        [Resources.AGENT]: [Actions.READ],
        [Resources.WORKFLOW]: [Actions.READ, Actions.SIMULATE],
        [Resources.WAHA]: [Actions.READ],
        [Resources.DASHBOARD]: [Actions.READ],
        [Resources.LEAD]: [Actions.READ, Actions.UPDATE]
    },
    [Roles.VIEWER]: {
        [Resources.CAMPAIGN]: [Actions.READ],
        [Resources.AGENT]: [Actions.READ],
        [Resources.WORKFLOW]: [Actions.READ],
        [Resources.WAHA]: [Actions.READ],
        [Resources.DASHBOARD]: [Actions.READ],
        [Resources.LEAD]: [Actions.READ]
    }
};

/**
 * Helper to check if a role has permission
 */
function hasPermission(role, resource, action) {
    if (!role || !resource || !action) return false;

    // Developer bypass (optional)
    if (process.env.NODE_ENV === 'development' && role === 'DEV') return true;

    const rolePermissions = PermissionMap[role];
    if (!rolePermissions) return false;

    const resourceActions = rolePermissions[resource];
    if (!resourceActions) return false;

    return resourceActions.includes(action);
}

module.exports = {
    Roles,
    Resources,
    Actions,
    PermissionMap,
    hasPermission
};
