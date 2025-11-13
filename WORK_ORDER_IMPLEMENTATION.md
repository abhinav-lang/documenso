# Work Order Management System - Implementation Guide

This document outlines the modifications made to convert Documenso into a Work Order Management System.

## Overview

The Work Order Management System extends Documenso's document signing capabilities to manage work orders with the following workflow:

1. **Contracts Team** uploads work orders and assigns sites, contractors, and approvers
2. **Approvers** receive notifications (Email + WhatsApp) and can approve/reject work orders
3. **Rejected** work orders return to Contracts Team for revision
4. **Approved** work orders are sent to Sites and Contractors
5. **Contractors** use OTP login to sign work orders
6. **Dashboard** shows all work orders with role-based filtering

## User Roles

### New Work Order Roles (Added to User model)

- **CONTRACTS_TEAM**: Can create, edit, assign, and view all work orders
- **APPROVER**: Can approve/reject and view all work orders
- **SITE_MANAGER**: Can view work orders for their assigned sites
- **CONTRACTOR**: Can sign work orders assigned to them (OTP-based login)

## Database Schema Changes

### New Enums

```prisma
enum WorkOrderRole {
  CONTRACTS_TEAM
  APPROVER
  SITE_MANAGER
  CONTRACTOR
}

enum WorkOrderStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED_BY_HQ
  SIGNED_BY_CONTRACTOR
  REJECTED
}
```

### New Tables

#### Site
Represents physical sites/locations where work is performed.

```prisma
model Site {
  id           String   @id @default(cuid())
  name         String
  code         String   @unique
  location     String?
  contactPhone String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  siteUsers  SiteUser[]
  workOrders WorkOrder[]
}
```

#### SiteUser
Links users to sites (many-to-many relationship).

```prisma
model SiteUser {
  id        String   @id @default(cuid())
  siteId    String
  site      Site     @relation(...)
  userId    Int
  user      User     @relation(...)
  createdAt DateTime @default(now())
}
```

#### Contractor
Stores contractor information (created on-the-fly).

```prisma
model Contractor {
  id        String   @id @default(cuid())
  name      String
  phone     String
  email     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  workOrders  WorkOrder[]
  otpSessions ContractorOtpSession[]
}
```

#### ContractorOtpSession
Manages OTP sessions for contractor authentication.

```prisma
model ContractorOtpSession {
  id           String     @id @default(cuid())
  contractorId String
  contractor   Contractor @relation(...)
  otp          String
  phone        String
  verified     Boolean    @default(false)
  expiresAt    DateTime
  createdAt    DateTime   @default(now())
}
```

#### WorkOrder
Main work order entity, links to Envelope for document handling.

```prisma
model WorkOrder {
  id              String          @id @default(cuid())
  workOrderNumber String          @unique
  envelopeId      String          @unique
  envelope        Envelope        @relation(...)
  siteId          String
  site            Site            @relation(...)
  contractorId    String
  contractor      Contractor      @relation(...)
  status          WorkOrderStatus @default(DRAFT)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  approvedAt      DateTime?
  signedAt        DateTime?
  rejectedAt      DateTime?
}
```

### Modified Tables

#### User
Added `workOrderRole` field to support Work Order roles.

```prisma
model User {
  // ... existing fields
  workOrderRole WorkOrderRole?

  // ... existing relations
  siteUsers SiteUser[]
}
```

#### Envelope
Added relation to WorkOrder.

```prisma
model Envelope {
  // ... existing fields
  workOrder WorkOrder?
}
```

## Backend Implementation

### Server-Only Operations

Location: `/packages/lib/server-only/work-order/`

#### Core Operations

1. **create-work-order.ts**: Creates work order with envelope
2. **get-work-order.ts**: Retrieves work order by ID/number/envelope
3. **get-work-orders.ts**: Lists work orders with role-based filtering
4. **update-work-order-status.ts**: Updates work order status with validation
5. **create-site.ts**: Creates new site with assigned users
6. **get-sites.ts**: Lists sites with filtering

#### Authentication & Notifications

1. **contractor-otp.ts**: OTP generation and verification using MSG91
   - `requestContractorOTP(phone)`: Sends OTP to contractor
   - `verifyContractorOTP(phone, otp)`: Verifies OTP and returns contractor ID

2. **whatsapp-notifications.ts**: WhatsApp Business API integration
   - `notifyApproversForApproval()`: Sends approval requests
   - `notifyContractsTeamOfRejection()`: Sends rejection notifications
   - `notifyContractorOfAssignment()`: Notifies contractor of new work order

### Constants

Location: `/packages/lib/constants/work-orders.ts`

- **WORK_ORDER_ROLE_PERMISSIONS_MAP**: Defines role-based permissions
- **WORK_ORDER_STATUS_TRANSITIONS**: Valid status transition rules
- **Helper functions**:
  - `canPerformAction(role, action)`: Check if user can perform action
  - `canViewAllWorkOrders(role)`: Check if user can view all work orders
  - `isValidStatusTransition(current, new)`: Validate status transitions

### tRPC API Routes

Location: `/packages/trpc/server/work-order-router/`

#### Available Routes

1. **workOrder.create**: Create new work order
   - Input: Work order details, site, contractor, approvers
   - Output: Created work order with envelope

2. **workOrder.getMany**: List work orders with filtering
   - Input: Filters (siteId, status, search), pagination
   - Output: Paginated list with role-based filtering

3. **workOrder.getSites**: List sites
   - Input: Pagination, search query
   - Output: Paginated list of sites

## Environment Variables

Add these to your `.env` file:

```bash
# MSG91 for OTP
MSG91_API_KEY=your_msg91_api_key
MSG91_OTP_TEMPLATE_ID=your_template_id

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

## Setup Instructions

### 1. Database Migration

```bash
# Navigate to the prisma package
cd packages/prisma

# Create migration
npm run prisma:migrate-dev -- --name add_work_order_system

# Generate Prisma client
npm run build
```

### 2. Seed Initial Data (Optional)

Create sites and assign users:

```typescript
// In seed script or admin panel
await prisma.site.create({
  data: {
    name: "Site A",
    code: "SITE-A",
    location: "Location A",
    contactPhone: "+1234567890",
    siteUsers: {
      create: [
        { userId: 1 }, // Site manager user ID
      ],
    },
  },
});
```

Update user roles:

```typescript
await prisma.user.update({
  where: { id: 1 },
  data: {
    workOrderRole: "CONTRACTS_TEAM",
  },
});
```

### 3. Configure External Services

#### MSG91 Setup
1. Sign up at https://msg91.com/
2. Get API key from dashboard
3. Create OTP template
4. Add credentials to `.env`

#### WhatsApp Business API Setup
1. Set up WhatsApp Business Account
2. Get access token and phone number ID from Meta Business
3. Add credentials to `.env`

## Work Order Workflow

### 1. Create Work Order (Contracts Team)

```typescript
// Via tRPC
const workOrder = await trpc.workOrder.create.mutate({
  workOrderNumber: "WO-2024-001",
  siteId: "site_id",
  contractorName: "John Contractor",
  contractorPhone: "+1234567890",
  contractorEmail: "john@example.com",
  title: "Electrical Work - Building A",
  documentDataId: "uploaded_document_id",
  approverEmails: ["approver1@company.com", "approver2@company.com"],
});
```

### 2. Send for Approval

When work order is sent:
- Status changes to `PENDING_APPROVAL`
- Email + WhatsApp notifications sent to approvers
- Approvers receive link to portal

### 3. Approval/Rejection (Approver)

```typescript
// Approve
await updateWorkOrderStatus({
  workOrderId,
  newStatus: "APPROVED_BY_HQ",
  userId: approverId,
});

// Reject
await updateRecipientStatus({
  recipientId,
  status: "REJECTED",
  remarks: "Budget allocation needs revision",
});
```

### 4. Contractor Signing

```typescript
// Request OTP
await requestContractorOTP("+1234567890");

// Verify OTP
const { contractorId } = await verifyContractorOTP("+1234567890", "123456");

// Sign work order (uses existing envelope signing)
await signEnvelopeField({...});
```

### 5. Dashboard View

```typescript
// Get work orders with role-based filtering
const { workOrders, totalCount } = await trpc.workOrder.getMany.query({
  status: "PENDING_APPROVAL",
  page: 1,
  perPage: 10,
  searchQuery: "WO-2024",
});
```

## Dashboard Specifications

### Columns

| Sr.no | Work Order | Site | Contractor | Status |
|-------|------------|------|------------|--------|
| 1 | WO-2024-001 | Site A | John | Approved by HQ |
| 2 | WO-2024-002 | Site B | Jane | Draft |

### Status Colors

- **Draft**: Gray
- **Pending Approval**: Yellow
- **Approved by HQ**: Blue
- **Signed by Contractor**: Green
- **Rejected**: Red

### Role-Based Filtering

- **Contracts Team & Approvers**: See ALL work orders
- **Site Managers**: See only their site's work orders
- **Contractors**: See only their assigned work orders

## Frontend Implementation (To Be Completed)

### Required Pages

1. **Work Order Dashboard** (`/work-orders`)
   - List view with filters
   - Role-based visibility
   - Status indicators

2. **Create Work Order** (`/work-orders/new`)
   - Upload document
   - Assign site, contractor, approvers
   - Set work order details

3. **Work Order Detail** (`/work-orders/[id]`)
   - View work order details
   - Approve/Reject interface
   - Signing interface for contractors

4. **Contractor Login** (`/contractor-login`)
   - OTP-based authentication
   - Work order signing

5. **Sites Management** (`/sites`)
   - Create/edit sites
   - Assign users to sites

### Example Frontend Usage

```typescript
// React component example
import { trpc } from '@/lib/trpc';

export function WorkOrderDashboard() {
  const { data, isLoading } = trpc.workOrder.getMany.useQuery({
    page: 1,
    perPage: 10,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Sr.no</th>
          <th>Work Order</th>
          <th>Site</th>
          <th>Contractor</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {data?.workOrders.map((wo, index) => (
          <tr key={wo.id}>
            <td>{index + 1}</td>
            <td>{wo.workOrderNumber}</td>
            <td>{wo.site.name}</td>
            <td>{wo.contractor.name}</td>
            <td>
              <StatusBadge status={wo.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Next Steps

1. ✅ Database schema defined
2. ✅ Server-side operations implemented
3. ✅ tRPC API routes created
4. ✅ OTP authentication implemented
5. ✅ WhatsApp notifications implemented
6. ⏳ Run database migrations
7. ⏳ Build frontend dashboard
8. ⏳ Create work order creation interface
9. ⏳ Implement approval/rejection UI
10. ⏳ Build contractor login and signing flow
11. ⏳ Test end-to-end workflow

## Testing

### Test Workflow

1. Create a site
2. Create users with different roles
3. Create a work order
4. Send for approval (test notifications)
5. Approve work order
6. Test contractor OTP login
7. Sign work order as contractor
8. Verify status updates

### Example Test Data

```typescript
// Create test site
const site = await prisma.site.create({
  data: {
    name: "Test Site",
    code: "TEST-01",
    location: "Test Location",
  },
});

// Create test users
const contractsUser = await prisma.user.update({
  where: { id: 1 },
  data: { workOrderRole: "CONTRACTS_TEAM" },
});

const approverUser = await prisma.user.update({
  where: { id: 2 },
  data: { workOrderRole: "APPROVER" },
});
```

## Troubleshooting

### Common Issues

1. **Prisma Client Out of Sync**
   ```bash
   npm run build
   ```

2. **MSG91 API Errors**
   - Verify API key is correct
   - Check template ID
   - Ensure phone numbers are in E.164 format

3. **WhatsApp API Errors**
   - Verify access token
   - Check phone number ID
   - Ensure WhatsApp Business is set up correctly

4. **Role-Based Access Issues**
   - Check user's `workOrderRole` is set
   - Verify permission constants are correct

## Support & Resources

- Documenso Docs: https://docs.documenso.com
- MSG91 Docs: https://docs.msg91.com/otp/sendotp
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp

## License

Same as Documenso - MIT License
