import { WorkOrderRole, WorkOrderStatus } from '@prisma/client';

export const WORK_ORDER_ROLE_PERMISSIONS_MAP = {
  // Contracts team can create, edit, view all work orders
  CREATE_WORK_ORDER: [WorkOrderRole.CONTRACTS_TEAM],
  EDIT_WORK_ORDER: [WorkOrderRole.CONTRACTS_TEAM],
  DELETE_WORK_ORDER: [WorkOrderRole.CONTRACTS_TEAM],
  REASSIGN_WORK_ORDER: [WorkOrderRole.CONTRACTS_TEAM],

  // Approvers can approve, reject, and view all work orders
  APPROVE_WORK_ORDER: [WorkOrderRole.APPROVER],
  REJECT_WORK_ORDER: [WorkOrderRole.APPROVER],

  // Site managers can view their site's work orders
  VIEW_SITE_WORK_ORDERS: [WorkOrderRole.SITE_MANAGER],

  // Contractors can sign work orders assigned to them
  SIGN_WORK_ORDER: [WorkOrderRole.CONTRACTOR],
} satisfies Record<string, WorkOrderRole[]>;

/**
 * A hierarchy of work order roles to determine viewing permissions
 */
export const WORK_ORDER_ROLE_HIERARCHY = {
  [WorkOrderRole.CONTRACTS_TEAM]: [
    WorkOrderRole.CONTRACTS_TEAM,
    WorkOrderRole.APPROVER,
    WorkOrderRole.SITE_MANAGER,
    WorkOrderRole.CONTRACTOR,
  ],
  [WorkOrderRole.APPROVER]: [
    WorkOrderRole.APPROVER,
    WorkOrderRole.SITE_MANAGER,
    WorkOrderRole.CONTRACTOR,
  ],
  [WorkOrderRole.SITE_MANAGER]: [WorkOrderRole.SITE_MANAGER, WorkOrderRole.CONTRACTOR],
  [WorkOrderRole.CONTRACTOR]: [WorkOrderRole.CONTRACTOR],
} satisfies Record<WorkOrderRole, WorkOrderRole[]>;

/**
 * Determines which roles can view all work orders
 */
export const CAN_VIEW_ALL_WORK_ORDERS = [
  WorkOrderRole.CONTRACTS_TEAM,
  WorkOrderRole.APPROVER,
] as const;

/**
 * Work order status transition rules
 */
export const WORK_ORDER_STATUS_TRANSITIONS = {
  [WorkOrderStatus.DRAFT]: [
    WorkOrderStatus.PENDING_APPROVAL, // When sent for approval
  ],
  [WorkOrderStatus.PENDING_APPROVAL]: [
    WorkOrderStatus.APPROVED_BY_HQ, // When approver signs
    WorkOrderStatus.REJECTED, // When approver rejects
  ],
  [WorkOrderStatus.APPROVED_BY_HQ]: [
    WorkOrderStatus.SIGNED_BY_CONTRACTOR, // When contractor signs
  ],
  [WorkOrderStatus.REJECTED]: [
    WorkOrderStatus.DRAFT, // When contracts team makes changes
  ],
  [WorkOrderStatus.SIGNED_BY_CONTRACTOR]: [], // Final state
} satisfies Record<WorkOrderStatus, WorkOrderStatus[]>;

/**
 * Status display labels
 */
export const WORK_ORDER_STATUS_LABELS = {
  [WorkOrderStatus.DRAFT]: 'Draft',
  [WorkOrderStatus.PENDING_APPROVAL]: 'Pending Approval',
  [WorkOrderStatus.APPROVED_BY_HQ]: 'Approved by HQ',
  [WorkOrderStatus.SIGNED_BY_CONTRACTOR]: 'Signed by Contractor',
  [WorkOrderStatus.REJECTED]: 'Rejected',
} satisfies Record<WorkOrderStatus, string>;

/**
 * Status colors for UI
 */
export const WORK_ORDER_STATUS_COLORS = {
  [WorkOrderStatus.DRAFT]: 'gray',
  [WorkOrderStatus.PENDING_APPROVAL]: 'yellow',
  [WorkOrderStatus.APPROVED_BY_HQ]: 'blue',
  [WorkOrderStatus.SIGNED_BY_CONTRACTOR]: 'green',
  [WorkOrderStatus.REJECTED]: 'red',
} satisfies Record<WorkOrderStatus, string>;

/**
 * Role display labels
 */
export const WORK_ORDER_ROLE_LABELS = {
  [WorkOrderRole.CONTRACTS_TEAM]: 'Contracts Team',
  [WorkOrderRole.APPROVER]: 'Approver',
  [WorkOrderRole.SITE_MANAGER]: 'Site Manager',
  [WorkOrderRole.CONTRACTOR]: 'Contractor',
} satisfies Record<WorkOrderRole, string>;

/**
 * Helper function to check if a user can perform an action
 */
export const canPerformAction = (
  userRole: WorkOrderRole | null | undefined,
  action: keyof typeof WORK_ORDER_ROLE_PERMISSIONS_MAP,
): boolean => {
  if (!userRole) return false;
  return WORK_ORDER_ROLE_PERMISSIONS_MAP[action].includes(userRole);
};

/**
 * Helper function to check if a user can view all work orders
 */
export const canViewAllWorkOrders = (userRole: WorkOrderRole | null | undefined): boolean => {
  if (!userRole) return false;
  return CAN_VIEW_ALL_WORK_ORDERS.includes(userRole as typeof CAN_VIEW_ALL_WORK_ORDERS[number]);
};

/**
 * Helper function to check if status transition is valid
 */
export const isValidStatusTransition = (
  currentStatus: WorkOrderStatus,
  newStatus: WorkOrderStatus,
): boolean => {
  return WORK_ORDER_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
};
