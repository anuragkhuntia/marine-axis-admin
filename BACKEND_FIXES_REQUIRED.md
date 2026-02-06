# URGENT: Job Visibility Backend Fixes

## Problem Statement

**Issue 1:** When admin closes a job, it still appears on the public web portal  
**Issue 2:** Signed-in users may not see all published jobs properly  
**Issue 3:** Non-logged users currently see only 1 of 4 open jobs (should see up to 5)  
**Issue 4:** Need ability to unpublish/withdraw jobs and republish them

## Quick Fix Required

### File to Modify: Backend Jobs Controller/Service

### Fix 1: Update `GET /jobs` Endpoint

Add role-based filtering to the jobs listing endpoint **with proper limit handling for public users**:

```javascript
// Example implementation (Node.js/Express)
router.get('/jobs', authenticate, async (req, res) => {
  const { status, page = 1, limit: requestedLimit } = req.query;
  const userRole = req.user?.role; // from JWT token
  
  let whereClause = {
    deletedAt: null  // Soft delete check
  };
  
  // Set default limit based on user role
  let limit = 25; // Default for authenticated users
  
  // CRITICAL: Filter by status based on user role
  if (!userRole || userRole === 'customer') {
    // Public/regular users: ONLY show published jobs
    whereClause.status = { $in: ['published', 'open'] };
    whereClause.expiresAt = { $or: [null, { $gt: new Date() }] };
    
    // IMPORTANT: Limit public listings to max 5 jobs
    limit = requestedLimit ? Math.min(parseInt(requestedLimit), 5) : 5;
  } else if (userRole === 'admin' || userRole === 'superadmin') {
    // Admins: Show all jobs, allow status filtering
    limit = requestedLimit ? parseInt(requestedLimit) : 25;
    if (status) {
      whereClause.status = status;
    }
  } else if (userRole === 'provider') {
    // Providers: Show only their jobs
    whereClause.providerId = req.user.id;
    limit = requestedLimit ? parseInt(requestedLimit) : 25;
    if (status) {
      whereClause.status = status;
    }
  }
  
  const jobs = await Job.find(whereClause)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('provider', 'name companyName')
    .sort({ createdAt: -1 });
    
  const total = await Job.countDocuments(whereClause);
  
  res.json({
    success: true,
    data: jobs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});
```

### Fix 2: Verify `PATCH /jobs/:id/close` Endpoint

Ensure this endpoint sets the status to 'closed':

```javascript
router.patch('/jobs/:id/close', authenticate, authorizeAdmin, async (req, res) => {
  const job = await Job.findById(req.params.id);
  
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  
  // Update status to closed
  job.status = 'closed';
  job.closedAt = new Date();
  await job.save();
  
  res.json({
    success: true,
    data: job,
    message: 'Job closed successfully'
  });
});
```

### Fix 3: Verify `PATCH /jobs/:id/publish` Endpoint

```javascript
router.patch('/jobs/:id/publish', authenticate, authorizeAdmin, async (req, res) => {
  const job = await Job.findById(req.params.id);
  
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  
  // Update status to published
  job.status = 'published';
  if (!job.publishedAt) {
    job.publishedAt = new Date();
  }
  await job.save();
  
  res.json({
    success: true,
    data: job,
    message: 'Job published successfully'
  });
});
```

### Fix 4: Add/Verify `PATCH /jobs/:id/unpublish` Endpoint

**NEW REQUIREMENT:** Add ability to unpublish (withdraw) jobs and republish them later.

```javascript
router.patch('/jobs/:id/unpublish', authenticate, authorizeAdmin, async (req, res) => {
  const job = await Job.findById(req.params.id);
  
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  
  // Update status to draft (withdrawn)
  job.status = 'draft';
  await job.save();
  
  res.json({
    success: true,
    data: job,
    message: 'Job unpublished successfully'
  });
});
```

**Frontend Implementation:** The admin panel now includes an "Unpublish" button for published/open jobs that calls this endpoint.

## Testing Steps

1. **Create test jobs** via admin panel (create at least 4-6 jobs)
2. **Publish all jobs** - should appear on web portal
3. **Test public listing:**
   - As non-logged user, access web portal jobs page
   - Should see maximum 5 published jobs
   - Should see ALL published jobs if there are 4 or fewer
4. **Test unpublish:**
   - Unpublish a job via admin panel
   - Job should disappear from web portal
   - Job should still be visible in admin with "Draft" status
   - Job should be able to be published again
5. **Test close:**
   - Close a job via admin panel  
   - Job should NOT appear on web portal
   - Job should still be visible in admin with "Closed" status
6. **Verify counts:**
   - If you have 4 open jobs, public should see all 4
   - If you have 10 open jobs, public should see only 5

## SQL Version (If using raw SQL)

```sql
-- Public/User query (should ONLY return published jobs, max 5)
SELECT * FROM jobs 
WHERE status IN ('published', 'open')
  AND (expires_at IS NULL OR expires_at > NOW())
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- Admin query (returns all jobs)
SELECT * FROM jobs 
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 25 OFFSET 0;

-- Close job query
UPDATE jobs 
SET status = 'closed', 
    closed_at = NOW() 
WHERE id = ?;

-- Unpublish job query
UPDATE jobs 
SET status = 'draft'
WHERE id = ?;

-- Publish job query
UPDATE jobs 
SET status = 'published', 
    published_at = COALESCE(published_at, NOW())
WHERE id = ?;
```

## Verification Checklist

- [ ] Public `/jobs` endpoint returns ONLY published/open jobs (max 5)
- [ ] Public `/jobs` endpoint correctly returns all published jobs (not just 1)
- [ ] Admin `/jobs` endpoint returns ALL jobs
- [ ] `/jobs/:id/close` sets status to 'closed'
- [ ] `/jobs/:id/unpublish` sets status to 'draft'  
- [ ] `/jobs/:id/publish` sets status to 'published'
- [ ] Closed jobs do NOT appear in public listings
- [ ] Closed jobs DO appear in admin panel
- [ ] Unpublished jobs can be republished
- [ ] Status filters work: `?status=closed`, `?status=published`

## Related Files

- **Documentation:** [JOB_VISIBILITY_IMPLEMENTATION.md](JOB_VISIBILITY_IMPLEMENTATION.md)
- **Test Script:** [test-job-visibility.sh](test-job-visibility.sh)

## Contact

If you need clarification on any of these changes, please ask.
