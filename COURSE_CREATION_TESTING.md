# Course Creation Testing & Troubleshooting Guide

## Issues Fixed

### 1. ✅ Form State Bug
**Problem:** Syllabus and Requirements inputs were sharing the same state variable (`newImage`)
**Fixed:** Separated into `newSyllabusItem` and `newRequirement` state variables
**Impact:** Now you can add syllabus items and requirements independently without conflicts

### 2. ✅ Better Error Messages
**Problem:** Generic "Failed to save course" error
**Fixed:** Added specific error messages and console logging
**Impact:** You'll now see helpful error messages indicating if the backend is unreachable

### 3. ✅ Export Statement
**Problem:** Missing default export
**Fixed:** Added `export default CreateCoursePage`
**Impact:** Component now loads properly in the app

---

## How to Test Course Creation

### Step 1: Ensure Backend is Running

The admin panel expects a backend API at `http://localhost:3000/api/v1`

**Check if backend is running:**
```bash
curl http://localhost:3000/api/v1/courses
```

**Expected Response:**
- If working: JSON response with courses data
- If not running: "Connection refused" error

### Step 2: Test Course Creation Form

1. **Navigate to Courses Page**
   - In admin panel, go to `/courses`
   - Click "Add Course" button

2. **Fill Required Fields:**
   - ✅ **Title** (required): e.g., "Navigation Fundamentals"
   - ✅ **Description** (required): Brief course overview
   - ✅ **Categories** (at least one required): Check relevant categories
   - ✅ **Level**: Select beginner/intermediate/advanced
   - ✅ **Duration**: Enter hours (e.g., 40)
   - ✅ **Max Participants**: Enter number (e.g., 25)
   - ✅ **Price**: Enter amount (e.g., 500)
   - ✅ **Currency**: Select from dropdown (e.g., USD, INR)

3. **Optional Fields:**
   - Instructor Name
   - Syllabus Items (add multiple by clicking +)
   - Requirements (add multiple by clicking +)
   - Certification Provided checkbox
   - Certification Name (if checkbox is checked)
   - Featured Course checkbox

4. **Submit Form:**
   - Click "Create Course" button
   - Watch for success/error toast notification

### Step 3: Expected Behavior

**Success Case:**
```
✅ Toast: "Course created successfully"
✅ Redirects to course detail page
✅ Course appears in courses list
```

**Error Cases:**

**Backend Not Running:**
```
❌ Toast: "Failed to save course. Please check if the backend is running."
❌ Browser Console: "Failed to connect to localhost port 3000"
```

**Validation Error:**
```
❌ Toast: "Please fill in all required fields"
❌ Missing: title, description, or categories
```

**Backend Error:**
```
❌ Toast: Shows specific error from backend
❌ Examples: "Unauthorized", "Invalid data", etc.
```

---

## Backend Requirements

Your backend must implement this endpoint:

### POST /api/v1/courses

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "title": "Navigation Fundamentals",
  "description": "Learn basic maritime navigation skills...",
  "categoryIds": ["cat-1", "cat-2"],
  "level": "beginner",
  "duration": 40,
  "maxParticipants": 25,
  "price": 500,
  "currency": "USD",
  "instructor": "Capt. John Smith",
  "syllabus": ["Module 1: Charts", "Module 2: GPS"],
  "requirements": ["Basic seamanship", "Valid ID"],
  "certificationProvided": true,
  "certificationName": "Navigation Certificate",
  "featured": false,
  "images": []
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "course-123",
    "title": "Navigation Fundamentals",
    "description": "Learn basic maritime navigation skills...",
    "categoryIds": ["cat-1", "cat-2"],
    "level": "beginner",
    "duration": 40,
    "maxParticipants": 25,
    "price": 500,
    "currency": "USD",
    "instructor": "Capt. John Smith",
    "syllabus": ["Module 1: Charts", "Module 2: GPS"],
    "requirements": ["Basic seamanship", "Valid ID"],
    "certificationProvided": true,
    "certificationName": "Navigation Certificate",
    "featured": false,
    "status": "active",
    "images": [],
    "enrollments": 0,
    "rating": 0,
    "reviews": 0,
    "createdAt": "2026-02-06T10:30:00Z",
    "updatedAt": "2026-02-06T10:30:00Z"
  },
  "message": "Course created successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Title is required", "At least one category is required"]
}
```

---

## Troubleshooting

### Issue: "Cannot read property of undefined"
**Solution:** Restart the dev server to pick up the code changes
```bash
# Ctrl+C to stop
npm run dev
```

### Issue: Categories not loading
**Problem:** Backend `/categories` endpoint not available
**Check:**
```bash
curl http://localhost:3000/api/v1/categories
```
**Solution:** Implement categories endpoint in backend

### Issue: Form submits but nothing happens
**Check:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Check Network tab for failed requests

### Issue: "Authentication required" error
**Problem:** Admin token is missing or invalid
**Solution:** 
1. Log out and log in again
2. Check if token is stored: `localStorage.getItem('marine-axis-admin-token')`
3. Verify backend authentication middleware

---

## Test Data Example

Use this sample data for testing:

```javascript
{
  title: "STCW Basic Safety Training",
  description: "Mandatory safety training for all seafarers covering personal survival, fire prevention and firefighting, elementary first aid, and personal safety.",
  categoryIds: ["1", "2"], // Adjust based on your categories
  level: "beginner",
  duration: 5,
  maxParticipants: 30,
  price: 550,
  currency: "USD",
  instructor: "Capt. Sarah Johnson",
  syllabus: [
    "Personal Survival Techniques",
    "Fire Prevention and Fire Fighting",
    "Elementary First Aid",
    "Personal Safety and Social Responsibilities"
  ],
  requirements: [
    "Medical fitness certificate",
    "Valid government-issued ID",
    "Age 18 years or above"
  ],
  certificationProvided: true,
  certificationName: "STCW Basic Safety Training Certificate",
  featured: true
}
```

---

## Next Steps

1. **Start Backend Server:**
   - Navigate to your backend repository
   - Run `npm start` or equivalent command
   - Verify it's listening on port 3000

2. **Test Course Creation:**
   - Use the test data above
   - Fill out the form in admin panel
   - Click "Create Course"
   - Verify success message

3. **Verify in Database:**
   - Check if course was created in your database
   - Verify all fields were saved correctly

4. **Test Course Listing:**
   - Navigate to `/courses` in admin panel
   - Check if new course appears in the list

---

## Related Documentation

- Full API Spec: [COURSE_API_IMPLEMENTATION.md](COURSE_API_IMPLEMENTATION.md)
- Backend Setup: [BACKEND_FIXES_REQUIRED.md](BACKEND_FIXES_REQUIRED.md)

---

## Getting Help

If course creation still doesn't work after following this guide:

1. Check browser console for errors
2. Check backend logs for errors
3. Verify backend endpoint exists and works (use curl or Postman)
4. Ensure authentication is working properly
5. Check that all required fields are being sent to backend

The most common issue is the backend not running or not implementing the required endpoints.
