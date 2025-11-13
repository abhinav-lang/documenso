# Work Order Management System - Changes Summary

## Files Created

### Documentation
- `WORK_ORDER_IMPLEMENTATION.md` - Complete implementation guide
- `CHANGES_SUMMARY.md` - This file
- `migration_reference.sql` - SQL migration reference

### Database Schema
- Modified: `packages/prisma/schema.prisma`
  - Added `WorkOrderRole` enum
  - Added `WorkOrderStatus` enum
  - Added `workOrderRole` field to `User` model
  - Added `workOrder` relation to `Envelope` model
  - Added `siteUsers` relation to `User` model
  - Created `Site` model
  - Created `SiteUser` model
  - Created `Contractor` model
  - Created `ContractorOtpSession` model
  - Created `WorkOrder` model

### Constants
- `packages/lib/constants/work-orders.ts` - Work order roles, permissions, and helpers

### Server-Only Operations
- `packages/lib/server-only/work-order/create-work-order.ts` - Create work order
- `packages/lib/server-only/work-order/get-work-order.ts` - Get single work order
- `packages/lib/server-only/work-order/get-work-orders.ts` - List work orders with filtering
- `packages/lib/server-only/work-order/update-work-order-status.ts` - Update status
- `packages/lib/server-only/work-order/create-site.ts` - Create site
- `packages/lib/server-only/work-order/get-sites.ts` - List sites
- `packages/lib/server-only/work-order/contractor-otp.ts` - OTP authentication for contractors
- `packages/lib/server-only/work-order/whatsapp-notifications.ts` - WhatsApp notifications

### tRPC API Routes
- `packages/trpc/server/work-order-router/` - Work order router directory
  - `router.ts` - Main router
  - `create-work-order.ts` - Create work order route
  - `create-work-order.types.ts` - Type definitions
  - `get-work-orders.ts` - List work orders route
  - `get-work-orders.types.ts` - Type definitions
  - `get-sites.ts` - List sites route
  - `get-sites.types.ts` - Type definitions
- Modified: `packages/trpc/server/router.ts` - Registered work order router

## Files Modified

1. **packages/prisma/schema.prisma**
   - Added Work Order related models and enums
   - Extended User model with workOrderRole

2. **packages/trpc/server/router.ts**
   - Imported and registered workOrderRouter

## Key Features Implemented

### 1. Role-Based Access Control
- CONTRACTS_TEAM: Full access to create and manage work orders
- APPROVER: Can approve/reject, view all work orders
- SITE_MANAGER: Can view site-specific work orders
- CONTRACTOR: Can sign assigned work orders (OTP login)

### 2. Work Order Workflow
- Draft → Pending Approval → Approved by HQ → Signed by Contractor
- Rejection handling with remarks
- Status tracking with timestamps

### 3. Site Management
- Create and manage sites
- Assign users to sites
- Site-based work order filtering

### 4. Contractor Management
- On-the-fly contractor creation
- OTP-based authentication using MSG91
- Phone number-based identification

### 5. Notifications
- WhatsApp Business API integration
- Email notifications (existing Documenso feature)
- Notification types:
  - Approval requests
  - Rejection notifications
  - Contractor assignments
  - Approval confirmations

### 6. API Endpoints (tRPC)

#### Work Orders
- `workOrder.create` - Create new work order
- `workOrder.getMany` - List work orders with filtering
- `workOrder.getSites` - List sites

#### Future Endpoints (To Be Implemented)
- `workOrder.get` - Get single work order
- `workOrder.update` - Update work order
- `workOrder.updateStatus` - Update status
- `workOrder.approve` - Approve work order
- `workOrder.reject` - Reject with remarks
- `site.create` - Create site
- `site.update` - Update site
- `site.assignUsers` - Assign users to site
- `contractor.requestOtp` - Request OTP
- `contractor.verifyOtp` - Verify OTP

## Environment Variables Required

```bash
# MSG91 for OTP
MSG91_API_KEY=your_msg91_api_key
MSG91_OTP_TEMPLATE_ID=your_template_id

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

## Next Steps to Complete

### Backend
1. ✅ Database schema
2. ✅ Server-side business logic
3. ✅ tRPC API routes
4. ✅ OTP authentication
5. ✅ WhatsApp notifications
6. ⏳ Run database migrations
7. ⏳ Additional API routes (approve, reject, etc.)

### Frontend (Not Started)
1. Work Order Dashboard page
2. Create Work Order form
3. Work Order Detail view
4. Approval/Rejection interface
5. Contractor login page
6. Site management pages
7. Role-based UI components

### Testing
1. Unit tests for server operations
2. Integration tests for API routes
3. End-to-end workflow testing
4. OTP flow testing
5. WhatsApp notification testing

## Migration Steps

1. **Run Database Migration**
   ```bash
   cd packages/prisma
   npm run prisma:migrate-dev -- --name add_work_order_system
   npm run build
   ```

2. **Configure Environment Variables**
   - Add MSG91 credentials
   - Add WhatsApp Business API credentials

3. **Seed Initial Data** (Optional)
   - Create sites
   - Assign user roles
   - Create test contractors

4. **Build Frontend** (Required)
   - Implement dashboard
   - Implement create work order flow
   - Implement approval flow
   - Implement contractor signing flow

## Architecture Decisions

### Why Extend Envelope?
- Leverages existing document signing infrastructure
- Reuses audit logs, webhooks, and security features
- Minimal changes to core Documenso functionality

### Why Separate WorkOrder Table?
- Clean separation of work order metadata
- Easy to query work order specific fields
- Maintains referential integrity with Envelope

### Why On-the-Fly Contractor Creation?
- Simplified workflow for contracts team
- No need for contractor pre-registration
- Phone number as unique identifier

### Why Role-Based in User Model?
- Simpler than separate contractor user type
- Easier role switching for testing
- Consistent with existing role system

## Performance Considerations

### Indexes
- Work order number (unique, indexed)
- Site code (unique, indexed)
- Contractor phone (indexed)
- Work order status (indexed)
- All foreign keys (indexed)

### Pagination
- All list endpoints support pagination
- Default page size: 10-50 items
- Total count included in response

### Filtering
- Role-based automatic filtering
- Site-based filtering for site managers
- Status-based filtering
- Full-text search on work order number, site name, contractor name

## Security Considerations

1. **Role-Based Access**
   - All operations check user role
   - Site managers restricted to their sites
   - Contractors restricted to their work orders

2. **OTP Authentication**
   - 10-minute expiry
   - One-time use
   - Phone verification

3. **Status Transitions**
   - Validated server-side
   - Logged in audit trail
   - Immutable once completed

4. **API Authentication**
   - All routes require authentication
   - Team-based authorization
   - Request metadata logged

## Support

For issues or questions:
1. Check `WORK_ORDER_IMPLEMENTATION.md`
2. Review Prisma schema
3. Check server-only operations
4. Review tRPC routes

## Version

- Documenso Base: Latest (as of implementation)
- Work Order System: v1.0.0
- Last Updated: 2025-11-13
