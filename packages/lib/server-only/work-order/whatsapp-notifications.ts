import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

export type WhatsAppNotificationType =
  | 'APPROVAL_REQUEST'
  | 'WORK_ORDER_APPROVED'
  | 'WORK_ORDER_REJECTED'
  | 'CONTRACTOR_ASSIGNMENT';

export type SendWhatsAppNotificationOptions = {
  to: string; // Phone number in E.164 format
  type: WhatsAppNotificationType;
  data: {
    workOrderNumber: string;
    portalLink?: string;
    remarks?: string;
    siteName?: string;
  };
};

/**
 * Send WhatsApp notification using WhatsApp Business API
 */
export async function sendWhatsAppNotification({
  to,
  type,
  data,
}: SendWhatsAppNotificationOptions): Promise<void> {
  const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('WhatsApp credentials not configured, skipping notification');
    return;
  }

  const message = buildWhatsAppMessage(type, data);

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: {
            body: message,
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('WhatsApp API error:', error);
      throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
    }

    console.log(`WhatsApp notification sent to ${to} for ${type}`);
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
    // Don't throw - we don't want to break the flow if WhatsApp fails
  }
}

/**
 * Build WhatsApp message based on notification type
 */
function buildWhatsAppMessage(
  type: WhatsAppNotificationType,
  data: SendWhatsAppNotificationOptions['data'],
): string {
  const { workOrderNumber, portalLink, remarks, siteName } = data;

  switch (type) {
    case 'APPROVAL_REQUEST':
      return `
🔔 Work Order Approval Request

Work Order: ${workOrderNumber}
${siteName ? `Site: ${siteName}` : ''}

Please review and approve this work order.

${portalLink ? `Access Portal: ${portalLink}` : ''}

Reply to this message if you have any questions.
      `.trim();

    case 'WORK_ORDER_APPROVED':
      return `
✅ Work Order Approved

Work Order: ${workOrderNumber}
${siteName ? `Site: ${siteName}` : ''}

This work order has been approved by HQ.

${portalLink ? `Access Portal: ${portalLink}` : ''}

You can now proceed with signing the document.
      `.trim();

    case 'WORK_ORDER_REJECTED':
      return `
❌ Work Order Rejected

Work Order: ${workOrderNumber}
${siteName ? `Site: ${siteName}` : ''}

${remarks ? `Remarks: ${remarks}` : 'No remarks provided'}

Please review the remarks and resubmit after making necessary changes.

${portalLink ? `Access Portal: ${portalLink}` : ''}
      `.trim();

    case 'CONTRACTOR_ASSIGNMENT':
      return `
📋 New Work Order Assignment

Work Order: ${workOrderNumber}
${siteName ? `Site: ${siteName}` : ''}

A new work order has been assigned to you.

${portalLink ? `Sign Document: ${portalLink}` : ''}

Please review and sign the document.
      `.trim();

    default:
      return `Work Order ${workOrderNumber} notification`;
  }
}

/**
 * Send approval request notifications to approvers
 */
export async function notifyApproversForApproval(
  workOrderNumber: string,
  approverPhones: string[],
  portalLink: string,
  siteName?: string,
): Promise<void> {
  const notificationPromises = approverPhones.map((phone) =>
    sendWhatsAppNotification({
      to: phone,
      type: 'APPROVAL_REQUEST',
      data: {
        workOrderNumber,
        portalLink,
        siteName,
      },
    }),
  );

  await Promise.allSettled(notificationPromises);
}

/**
 * Send rejection notification to contracts team
 */
export async function notifyContractsTeamOfRejection(
  workOrderNumber: string,
  contractsTeamPhones: string[],
  remarks: string,
  portalLink: string,
): Promise<void> {
  const notificationPromises = contractsTeamPhones.map((phone) =>
    sendWhatsAppNotification({
      to: phone,
      type: 'WORK_ORDER_REJECTED',
      data: {
        workOrderNumber,
        portalLink,
        remarks,
      },
    }),
  );

  await Promise.allSettled(notificationPromises);
}

/**
 * Send notification to contractor about work order assignment
 */
export async function notifyContractorOfAssignment(
  workOrderNumber: string,
  contractorPhone: string,
  portalLink: string,
  siteName?: string,
): Promise<void> {
  await sendWhatsAppNotification({
    to: contractorPhone,
    type: 'CONTRACTOR_ASSIGNMENT',
    data: {
      workOrderNumber,
      portalLink,
      siteName,
    },
  });
}
