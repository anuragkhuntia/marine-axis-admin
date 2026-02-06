# Course Management API Implementation Guide

## Overview
This document outlines the API endpoints required to support the course management system in the Marine-Axis admin panel. The frontend expects these endpoints to be fully functional for creating, managing, and booking courses with availability tracking.

## Base URL
`/api/v1`

## Authentication
All endpoints require Bearer token authentication in the Authorization header:
```
Authorization: Bearer <token>
```

Roles: `superadmin`, `admin`

---

## 1. Course Management

### 1.1 GET /courses
**Description:** List all courses with pagination and filtering

**Query Parameters:**
```
page: number (default: 1)
limit: number (default: 100)
categoryId: string (optional)
level: 'beginner' | 'intermediate' | 'advanced' (optional)
status: 'active' | 'inactive' | 'archived' (optional)
providerId: string (optional)
search: string (optional) - search in title and description
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "course-1",
      "title": "STCW Basic Safety Training",
      "description": "Comprehensive safety training for maritime professionals",
      "providerId": "provider-1",
      "provider": {
        "id": "provider-1",
        "name": "Maritime Academy"
      },
      "categoryIds": ["cat-1", "cat-2"],
      "categories": [
        {"id": "cat-1", "name": "Training & Certification"},
        {"id": "cat-2", "name": "Safety"}
      ],
      "level": "beginner",
      "duration": 40,
      "maxParticipants": 20,
      "price": 500,
      "currency": "USD",
      "instructor": "John Smith",
      "syllabus": ["Module 1: Introduction", "Module 2: Safety Procedures"],
      "requirements": ["Valid ID", "Age 18+"],
      "certificationProvided": true,
      "certificationName": "STCW Basic Safety Certificate",
      "featured": true,
      "status": "active",
      "images": ["url1", "url2"],
      "enrollments": 15,
      "rating": 4.5,
      "reviews": 8,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-02-06T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 45,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "message": "Courses retrieved successfully"
}
```

---

### 1.2 GET /courses/:id
**Description:** Get a single course by ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "course-1",
    "title": "STCW Basic Safety Training",
    "description": "Full course description...",
    "providerId": "provider-1",
    "categoryIds": ["cat-1"],
    "level": "beginner",
    "duration": 40,
    "maxParticipants": 20,
    "price": 500,
    "currency": "USD",
    "instructor": "John Smith",
    "syllabus": ["Module 1", "Module 2"],
    "requirements": ["Valid ID"],
    "certificationProvided": true,
    "certificationName": "STCW Certificate",
    "featured": false,
    "status": "active",
    "images": [],
    "enrollments": 15,
    "rating": 4.5,
    "reviews": 8,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-02-06T00:00:00Z"
  }
}
```

---

### 1.3 POST /courses
**Description:** Create a new course

**Request Body:**
```json
{
  "title": "STCW Basic Safety Training",
  "description": "Comprehensive safety training...",
  "categoryIds": ["cat-1", "cat-2"],
  "level": "beginner",
  "duration": 40,
  "maxParticipants": 20,
  "price": 500,
  "currency": "USD",
  "instructor": "John Smith",
  "syllabus": ["Module 1: Introduction", "Module 2: Safety"],
  "requirements": ["Valid ID", "Age 18+"],
  "certificationProvided": true,
  "certificationName": "STCW Basic Safety Certificate",
  "featured": false,
  "images": []
}
```

**Response:** Same as GET /courses/:id with status 201

---

### 1.4 PUT /courses/:id
**Description:** Update an existing course

**Request Body:** Same as POST /courses (all fields optional)

**Response:** Same as GET /courses/:id

---

### 1.5 DELETE /courses/:id
**Description:** Delete a course

**Response:**
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

---

### 1.6 GET /courses/featured
**Description:** Get featured courses

**Query Parameters:**
```
page: number (optional)
limit: number (optional)
```

**Response:** Same as GET /courses

---

### 1.7 GET /courses/stats
**Description:** Get course statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "active": 35,
    "inactive": 8,
    "archived": 2,
    "featured": 10,
    "totalEnrollments": 450,
    "averageRating": 4.2
  }
}
```

---

## 2. Course Availability Management

### 2.1 GET /courses/:courseId/availability
**Description:** List all availability slots for a course

**Query Parameters:**
```
page: number (default: 1)
limit: number (default: 100)
status: 'active' | 'inactive' | 'full' | 'cancelled' (optional)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "avail-1",
      "courseId": "course-1",
      "startDate": "2026-03-01",
      "endDate": "2026-03-15",
      "startTime": "09:00",
      "endTime": "17:00",
      "daysOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "location": "Training Center, Room 101",
      "isOnline": false,
      "spotsAvailable": 20,
      "spotsBooked": 15,
      "status": "active",
      "notes": "Includes lunch and materials",
      "createdAt": "2026-01-15T00:00:00Z",
      "updatedAt": "2026-02-06T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 2.2 GET /courses/:courseId/availability/:availabilityId
**Description:** Get a specific availability slot

**Response:** Single availability object (same as in 2.1 data array)

---

### 2.3 POST /courses/:courseId/availability
**Description:** Create a new availability slot for a course

**Request Body:**
```json
{
  "startDate": "2026-03-01",
  "endDate": "2026-03-15",
  "startTime": "09:00",
  "endTime": "17:00",
  "daysOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "location": "Training Center, Room 101",
  "isOnline": false,
  "spotsAvailable": 20,
  "notes": "Includes lunch and materials"
}
```

**Validation:**
- `startDate` and `endDate` are required and must be valid ISO dates
- `startDate` must be before `endDate`
- `startTime` and `endTime` are required in HH:MM format
- `startTime` must be before `endTime`
- `daysOfWeek` must be a non-empty array
- `spotsAvailable` must be > 0
- Either `isOnline` is true OR `location` is provided (not both required, but at least one must be valid)

**Response:** Same as GET /courses/:courseId/availability/:availabilityId with status 201

---

### 2.4 PUT /courses/:courseId/availability/:availabilityId
**Description:** Update an availability slot

**Request Body:** Same as POST /courses/:courseId/availability (all fields optional)

**Response:** Same as GET endpoint

---

### 2.5 DELETE /courses/:courseId/availability/:availabilityId
**Description:** Delete an availability slot

**Response:**
```json
{
  "success": true,
  "message": "Availability slot deleted successfully"
}
```

---

## 3. Course Bookings Management

### 3.1 GET /courses/:courseId/bookings
**Description:** List all bookings for a course

**Query Parameters:**
```
page: number (default: 1)
limit: number (default: 100)
status: 'pending' | 'confirmed' | 'completed' | 'cancelled' (optional)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "booking-1",
      "courseId": "course-1",
      "availabilityId": "avail-1",
      "availability": {
        "id": "avail-1",
        "startDate": "2026-03-01",
        "endDate": "2026-03-15"
      },
      "customerId": "user-1",
      "customer": {
        "id": "user-1",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "participantName": "John Doe",
      "participantEmail": "john@example.com",
      "participantPhone": "+1234567890",
      "status": "confirmed",
      "totalPrice": 500,
      "currency": "USD",
      "notes": "Special requirements...",
      "createdAt": "2026-02-01T00:00:00Z",
      "updatedAt": "2026-02-06T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 15,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 3.2 POST /courses/:courseId/bookings
**Description:** Create a new course booking (Customer-facing)

**Request Body:**
```json
{
  "availabilityId": "avail-1",
  "participantName": "John Doe",
  "participantEmail": "john@example.com",
  "participantPhone": "+1234567890",
  "notes": "Special dietary requirements..."
}
```

**Validation:**
- `availabilityId` must exist
- Availability slot must have available spots (spotsBooked < spotsAvailable)
- `participantName` is required
- `participantEmail` must be valid email format
- Status should default to 'pending'

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "booking-1",
    "courseId": "course-1",
    "availabilityId": "avail-1",
    "customerId": "user-1",
    "participantName": "John Doe",
    "participantEmail": "john@example.com",
    "participantPhone": "+1234567890",
    "status": "pending",
    "totalPrice": 500,
    "currency": "USD",
    "notes": "Special dietary requirements...",
    "createdAt": "2026-02-06T00:00:00Z",
    "updatedAt": "2026-02-06T00:00:00Z"
  },
  "message": "Booking created successfully"
}
```

---

### 3.3 PATCH /courses/:courseId/bookings/:bookingId/status
**Description:** Update booking status (Admin-only)

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Statuses:** `pending`, `confirmed`, `completed`, `cancelled`

**Response:** Same as POST booking with updated status

---

### 3.4 GET /courses/:courseId/bookings/stats
**Description:** Get booking statistics for a course

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "pending": 2,
    "confirmed": 10,
    "completed": 2,
    "cancelled": 1,
    "totalRevenue": 7500,
    "currency": "USD"
  }
}
```

---

## Database Models

### Course
```typescript
{
  id: string (UUID)
  title: string
  description: string
  providerId: string (FK to Provider)
  categoryIds: string[] (FK array to Category)
  level: 'beginner' | 'intermediate' | 'advanced'
  duration: number (hours)
  maxParticipants: number
  price: number
  currency: string (ISO 4217)
  instructor?: string
  syllabus?: string[]
  requirements?: string[]
  certificationProvided: boolean
  certificationName?: string
  featured: boolean
  status: 'active' | 'inactive' | 'archived'
  images: string[] (URLs)
  enrollments: number
  rating: number (0-5)
  reviews: number
  createdAt: DateTime
  updatedAt: DateTime
}
```

### CourseAvailability
```typescript
{
  id: string (UUID)
  courseId: string (FK to Course)
  startDate: string (ISO date: YYYY-MM-DD)
  endDate: string (ISO date: YYYY-MM-DD)
  startTime: string (HH:MM format)
  endTime: string (HH:MM format)
  daysOfWeek: string[] (e.g., ["Monday", "Tuesday", ...])
  location?: string
  isOnline: boolean
  spotsAvailable: number
  spotsBooked: number (auto-calculated from bookings)
  status: 'active' | 'inactive' | 'full' | 'cancelled'
  notes?: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

### CourseBooking
```typescript
{
  id: string (UUID)
  courseId: string (FK to Course)
  availabilityId: string (FK to CourseAvailability)
  customerId: string (FK to User)
  participantName: string
  participantEmail: string
  participantPhone?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  totalPrice: number
  currency: string
  notes?: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

## Business Logic Requirements

### Availability Status Rules
- Set to `'full'` when `spotsBooked >= spotsAvailable`
- Set to `'inactive'` when explicitly disabled or past endDate
- Set to `'cancelled'` when explicitly cancelled
- Default: `'active'`

### Booking Flow
1. Customer creates booking → status = `'pending'`
2. Admin confirms → status = `'confirmed'`
3. After course completion → status = `'completed'`
4. If cancelled → status = `'cancelled'`

### Spot Management
- When booking is created → increment `spotsBooked`
- When booking is cancelled → decrement `spotsBooked`
- When booking is completed → keep `spotsBooked` as is
- Prevent bookings if `spotsBooked >= spotsAvailable`

### Auto-calculated Fields
- `Course.enrollments` = count of confirmed/completed bookings
- `CourseAvailability.spotsBooked` = count of non-cancelled bookings for that slot
- `CourseAvailability.status` = auto-update to 'full' if spots filled

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "errors": ["Field validation failed"],
  "message": "Invalid request"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Only superadmin and admin roles can access this endpoint"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Course not found"
}
```

### 409 Conflict (e.g., no availability slots)
```json
{
  "success": false,
  "message": "No available spots for this course"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Feature Checklist for Backend

- [ ] Course CRUD operations
- [ ] Course search and filtering
- [ ] Course statistics endpoint
- [ ] Featured courses endpoint
- [ ] CourseAvailability CRUD operations
- [ ] Availability slot status management
- [ ] Spot availability tracking
- [ ] CourseBooking creation
- [ ] Booking status updates
- [ ] Booking statistics endpoint
- [ ] Prevent overbooking (validate available spots)
- [ ] Auto-calculate enrollments from bookings
- [ ] Input validation for all endpoints
- [ ] Authentication/authorization checks
- [ ] Pagination support for list endpoints
- [ ] Search support for courses
- [ ] Error handling with proper status codes
- [ ] Database indexes on foreign keys
- [ ] Transaction support for booking creation

---

## Testing Recommendations

1. **Create a course** → verify all fields save correctly
2. **Add availability slots** → verify date/time validation
3. **Create bookings** → verify availability decreases
4. **Test overbooking** → ensure spots can't exceed maxParticipants
5. **Edit availability** → verify existing bookings remain valid
6. **Delete availability with bookings** → handle cascade/restrictions
7. **Test pagination** → ensure offset and limit work correctly
8. **Test filters** → verify search, level, status filters work

---

## Notes for Backend Team

- All timestamps should be in UTC ISO 8601 format
- Course pricing should support at least 2 decimal places
- Support bulk operations for availability slots creation
- Consider caching for frequently accessed endpoints (featured courses, stats)
- Implement soft deletes for courses to preserve booking history
- Add audit logging for all course and booking changes
