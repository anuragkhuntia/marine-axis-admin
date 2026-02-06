#!/bin/bash

# Job Visibility Testing Script
# This script tests the job visibility and status functionality

echo "======================================"
echo "Job Visibility & Status Testing"
echo "======================================"
echo ""

# Configuration
API_BASE="http://localhost:3000/api/v1"
ADMIN_TOKEN="your-admin-token-here"  # Replace with actual admin token
USER_TOKEN="your-user-token-here"    # Replace with actual user token (if any)

echo "Testing API: $API_BASE"
echo ""

# Test 1: Get all jobs (public - no auth)
echo "1. Testing PUBLIC job listing (no authentication):"
echo "   Endpoint: GET $API_BASE/jobs"
curl -s "$API_BASE/jobs" | jq '.data[] | {id, title, status}' 2>/dev/null || echo "   ❌ Failed or no jq installed"
echo ""

# Test 2: Get all jobs (authenticated user)  
echo "2. Testing AUTHENTICATED USER job listing:"
echo "   Endpoint: GET $API_BASE/jobs (with user token)"
if [ "$USER_TOKEN" != "your-user-token-here" ]; then
  curl -s -H "Authorization: Bearer $USER_TOKEN" "$API_BASE/jobs" | jq '.data[] | {id, title, status}' 2>/dev/null
else
  echo "   ⚠️  User token not configured"
fi
echo ""

# Test 3: Get all jobs (admin)
echo "3. Testing ADMIN job listing (should see all statuses):"
echo "   Endpoint: GET $API_BASE/jobs (with admin token)"
if [ "$ADMIN_TOKEN" != "your-admin-token-here" ]; then
  curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$API_BASE/jobs" | jq '.data[] | {id, title, status}' 2>/dev/null
else
  echo "   ⚠️  Admin token not configured"
fi
echo ""

# Test 4: Check specific job statuses
echo "4. Testing status filtering:"
echo "   Getting jobs by status..."
for status in "published" "open" "closed" "draft"; do
  echo "   - Status: $status"
  curl -s "$API_BASE/jobs?status=$status" | jq -r ".data | length" 2>/dev/null | xargs -I {} echo "     Found: {} jobs"
done
echo ""

# Test 5: Test close endpoint
echo "5. Testing CLOSE job endpoint:"
echo "   To test, uncomment and set JOB_ID in the script"
# Uncomment and set JOB_ID to test
# JOB_ID="your-job-id-here"
# echo "   PATCH $API_BASE/jobs/$JOB_ID/close"
# curl -s -X PATCH -H "Authorization: Bearer $ADMIN_TOKEN" "$API_BASE/jobs/$JOB_ID/close" | jq '.'
echo ""

# Test 6: Get job statistics
echo "6. Testing job statistics:"
echo "   Endpoint: GET $API_BASE/jobs/stats"
curl -s "$API_BASE/jobs/stats" | jq '.' 2>/dev/null || echo "   ❌ Failed"
echo ""

echo "======================================"
echo "Expected Results:"
echo "======================================"
echo "1. PUBLIC listing should show ONLY 'published' or 'open' jobs"
echo "2. AUTHENTICATED USER listing should show ONLY 'published' or 'open' jobs"
echo "3. ADMIN listing should show ALL jobs (draft, published, closed, etc.)"
echo "4. Status filters should work correctly"
echo "5. After closing a job, it should NOT appear in public/user listings"
echo ""
echo "If results don't match expectations, refer to:"
echo "  JOB_VISIBILITY_IMPLEMENTATION.md"
echo ""
