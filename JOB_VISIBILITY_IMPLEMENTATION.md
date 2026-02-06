# Job Visibility & Status Implementation Guide

## Issue Summary

When a job is closed from the admin panel, it remains visible on the public web portal. Additionally, there may be visibility issues for authenticated users. This document outlines how job visibility and status should be handled across the system.

---

## Job Status Values

Jobs should support the following status values:

```typescript
type JobStatus = 
  | 'draft'      // Not visible publicly, only in admin
  | 'published'  // Active and visible on web portal (alias: 'open')
  | 'open'       // Active and visible on web portal (alias: 'published')  
  | 'paused'     // Temporarily hidden from web portal, visible in admin
  | 'closed'     // No longer accepting applications, hidden from web portal
  | 'expired'    // Past expiration date, hidden from web portal
```

---

## Backend API Requirements

### 1. Job Status Update Endpoints

The following endpoints should update the job status:

#### PATCH /api/v1/jobs/:id/publish
**Updates job status to:** `published` or `open`
**Makes job:** Visible on web portal

```json
Response: {
  "success": true,
  "data": {
    "id": "job-123",
    "status": "published",
    ...
  }
}
```

#### PATCH /api/v1/jobs/:id/close
**Updates job status to:** `closed`
**Makes job:** Hidden from web portal, visible only in admin

```json
Response: {
  "success": true,
  "data": {
    "id": "job-123",
    "status": "closed",
    ...
  }
}
```

#### PATCH /api/v1/jobs/:id/unpublish
**Updates job status to:** `paused`
**Makes job:** Temporarily hidden from web portal

#### PATCH /api/v1/jobs/:id/reopen
**Updates job status to:** `published`
**Makes job:** Visible again on web portal

---

## 2. Job Listing Visibility Rules

### Public Web Portal (Unauthenticated Users)

**Endpoint:** `GET /api/v1/jobs` (public)

**Should return ONLY jobs where:**
- `status = 'published'` OR `status = 'open'`
- `expiresAt` is NULL OR `expiresAt > NOW()`

**Example Query:**
```sql
SELECT * FROM jobs 
WHERE status IN ('published', 'open')
  AND (expiresAt IS NULL OR expiresAt > NOW())
  AND deletedAt IS NULL
ORDER BY createdAt DESC;
```

### Authenticated Regular Users (Customers/Job Seekers)

**Endpoint:** `GET /api/v1/jobs` (with auth token)

**Should return ONLY jobs where:**
- `status = 'published'` OR `status = 'open'`
- `expiresAt` is NULL OR `expiresAt > NOW()`
- Same as public, authentication doesn't grant access to closed jobs

### Providers (Own Jobs Only)

**Endpoint:** `GET /api/v1/jobs/my-jobs` or `GET /api/v1/jobs?providerId={userId}`

**Should return:**
- ALL jobs owned by the provider, regardless of status
- Includes: draft, published, paused, closed
- Useful for providers to manage their own listings

### Admin Panel (Superadmin/Admin)

**Endpoint:** `GET /api/v1/jobs` (with admin token)

**Should return:**
- ALL jobs regardless of status
- Admins can see: draft, published, paused, closed, expired
- Filter by status using: `?status=closed`, `?status=published`, etc.

---

## 3. Implementation Checklist

### Backend Changes Required:

- [ ] **Update `/jobs/:id/close` endpoint:**
  - Set `status = 'closed'`
  - Set `closedAt = NOW()` (optional timestamp tracking)
  - Return updated job object
  
- [ ] **Update `/jobs/:id/publish` endpoint:**
  - Set `status = 'published'`
  - Set `publishedAt = NOW()` if not already set
  - Clear `closedAt` field if previously closed
  
- [ ] **Update `GET /jobs` endpoint (public):**
  - Add WHERE clause: `status IN ('published', 'open')`
  - Filter out expired jobs: `AND (expiresAt IS NULL OR expiresAt > NOW())`
  - Do NOT return jobs with status: 'draft', 'paused', 'closed', 'expired'

- [ ] **Add admin check for `GET /jobs` endpoint:**
  - If user role is 'admin' or 'superadmin': return all jobs
  - If user role is 'provider': return only their jobs (all statuses)
  - If user is not authenticated or is 'customer': return only published jobs

- [ ] **Add status filters:**
  - Support query param: `?status=published`, `?status=closed`, etc.
  - Support multiple statuses: `?status=published,open`

---

## 4. Database Schema Recommendations

```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS publishedAt TIMESTAMP NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS closedAt TIMESTAMP NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS expiresAt TIMESTAMP NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status_expires ON jobs(status, expiresAt);
```

---

## 5. Testing Scenarios

### Test Case 1: Close Job from Admin
1. Admin creates a job with status='published'
2. Job appears on web portal
3. Admin calls PATCH `/jobs/:id/close`
4. Backend updates status to 'closed'
5. **Expected:** Job NO LONGER appears on web portal
6. **Expected:** Job still visible in admin panel with "Closed" badge

### Test Case 2: Authenticated User Visibility
1. User signs in to web portal
2. User navigates to jobs listing
3. **Expected:** User sees ONLY published/open jobs
4. **Expected:** User does NOT see draft, paused, or closed jobs

### Test Case 3: Provider Viewing Own Jobs
1. Provider logs into admin/dashboard
2. Provider calls GET `/jobs/my-jobs`
3. **Expected:** Provider sees ALL their jobs (draft, published, closed, etc.)

### Test Case 4: Admin Filtering
1. Admin navigates to Jobs page
2. Admin selects "Closed" status filter
3. Admin calls GET `/jobs?status=closed`
4. **Expected:** Shows only closed jobs

### Test Case 5: Reopen Closed Job
1. Admin has a job with status='closed'
2. Admin calls PATCH `/jobs/:id/reopen`
3. Backend updates status to 'published'
4. **Expected:** Job appears again on web portal

---

## 6. Frontend Updates (Already Implemented)

The admin panel frontend already handles:
- ✅ Calling `/jobs/:id/close` when "Close" button clicked
- ✅ Calling `/jobs/:id/publish` when "Publish" button clicked
- ✅ Displaying status badges (Draft, Open, Closed, Paused)
- ✅ Conditional rendering of action buttons based on status

---

## 7. API Response Contract

### GET /jobs (Public/Web Portal)
```json
{
  "success": true,
  "data": [
    {
      "id": "job-1",
      "title": "Marine Engineer",
      "status": "published",
      "expiresAt": "2026-03-01T00:00:00Z",
      ...
    }
    // ONLY published/open jobs
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 15
  }
}
```

### GET /jobs (Admin)
```json
{
  "success": true,
  "data": [
    {
      "id": "job-1",
      "status": "published",
      ...
    },
    {
      "id": "job-2",
      "status": "closed",
      ...
    },
    {
      "id": "job-3",
      "status": "draft",
      ...
    }
    // ALL jobs regardless of status
  ],
  "pagination": { ... }
}
```

---

## 8. Security Considerations

- **Authorization checks:** Ensure non-admin users cannot access `/jobs/:id/close` or other admin-only endpoints
- **Provider isolation:** Providers should only be able to close their own jobs
- **Audit logging:** Log all status changes (who closed/opened which job and when)
- **Rate limiting:** Prevent abuse of publish/close toggles

---

## 9. Error Handling

### 404 When Job Not Found
```json
{
  "success": false,
  "message": "Job not found"
}
```

### 403 When Unauthorized
```json
{
  "success": false,
  "message": "Only admins and job owners can close jobs"
}
```

### 400 When Invalid Status Transition
```json
{
  "success": false,
  "message": "Cannot publish a closed job. Use /reopen endpoint instead."
}
```

---

## Summary

**Root Cause:** Backend `/jobs/:id/close` endpoint updates the job status but the public `/jobs` endpoint doesn't filter by status, showing all jobs regardless.

**Solution:** Implement status-based filtering in the backend `GET /jobs` endpoint:
- Public/web: Show only `status IN ('published', 'open')`
- Admin: Show all statuses with optional filtering
- Provider: Show only their jobs, all statuses

**Verification:** After backend changes, closed jobs should immediately disappear from the web portal while remaining visible in the admin panel.
