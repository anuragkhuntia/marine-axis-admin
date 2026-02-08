# 🚀 Courses API - Backend Implementation Specification

**For**: Backend Development Team  
**Status**: URGENT - Frontend is waiting for these endpoints  
**Date**: February 7, 2026  
**Frontend URL**: Admin panel at `/courses` page

---

## ❌ Current Status

Frontend is getting **404 errors** for:
```
GET /api/v1/courses?page=1&limit=100
GET /api/v1/courses/stats
```

**User Impact**: Admin courses page is blank, courses cannot be created or managed.

---

## ✅ Implementation Priority

### Phase 1: CRITICAL (Implement First)
- [ ] `GET /api/v1/courses` - List all courses with pagination
- [ ] `GET /api/v1/courses/stats` - Course statistics

### Phase 2: IMPORTANT (Implement Next)
- [ ] `GET /api/v1/courses/:id` - Get single course
- [ ] `POST /api/v1/courses` - Create new course
- [ ] `PUT /api/v1/courses/:id` - Update course
- [ ] `DELETE /api/v1/courses/:id` - Delete course
- [ ] `POST /api/v1/courses/:id/publish` - Publish course (set status to active)
- [ ] `POST /api/v1/courses/:id/unpublish` - Unpublish course (set status to inactive)

### Phase 3: NICE-TO-HAVE (Later)
- [ ] `GET /api/v1/courses/featured` - Featured courses
- [ ] Course availability management
- [ ] Course bookings
- [ ] Course reviews

---

## 📋 Phase 1: Critical Endpoints

### 1️⃣ GET /api/v1/courses - List All Courses

**Request:**
```
GET /api/v1/courses?page=1&limit=100
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Query Parameters:**
```
page (number, default: 1)
limit (number, default: 100)
categoryId (string, optional)
level (string: 'beginner' | 'intermediate' | 'advanced', optional)
status (string: 'active' | 'inactive' | 'archived', optional)
providerId (string, optional)
search (string, optional)
```

**Success Response (200):**
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

**Implementation (Node.js/Express):**
```javascript
router.get('/courses', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      categoryId, 
      level, 
      status, 
      providerId, 
      search 
    } = req.query;

    let whereClause = {
      deletedAt: null  // Soft delete check
    };

    // Apply filters
    if (categoryId) {
      whereClause.categoryIds = { $in: [categoryId] };
    }
    if (level) {
      whereClause.level = level;
    }
    if (status) {
      whereClause.status = status;
    }
    if (providerId) {
      whereClause.providerId = providerId;
    }
    if (search) {
      whereClause.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const courses = await Course.find(whereClause)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('provider', 'name companyName')
      .populate('categories', 'name')
      .sort({ createdAt: -1 });
    
    const total = await Course.countDocuments(whereClause);
    
    res.json({
      success: true,
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + courses.length < total,
        hasPrev: parseInt(page) > 1
      },
      message: 'Courses retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve courses',
      error: error.message
    });
  }
});
```

---

### 2️⃣ GET /api/v1/courses/stats - Course Statistics

**Request:**
```
GET /api/v1/courses/stats
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Success Response (200):**
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

**Implementation (Node.js/Express):**
```javascript
router.get('/courses/stats', authenticate, async (req, res) => {
  try {
    const total = await Course.countDocuments({ deletedAt: null });
    const active = await Course.countDocuments({ deletedAt: null, status: 'active' });
    const inactive = await Course.countDocuments({ deletedAt: null, status: 'inactive' });
    const archived = await Course.countDocuments({ deletedAt: null, status: 'archived' });
    const featured = await Course.countDocuments({ deletedAt: null, featured: true });
    
    // Calculate total enrollments
    const enrollmentResult = await Course.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: null, totalEnrollments: { $sum: '$enrollments' } } }
    ]);
    const totalEnrollments = enrollmentResult[0]?.totalEnrollments || 0;
    
    // Calculate average rating
    const ratingResult = await Course.aggregate([
      { $match: { deletedAt: null, rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const averageRating = Math.round((ratingResult[0]?.avgRating || 0) * 10) / 10;
    
    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        archived,
        featured,
        totalEnrollments,
        averageRating
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve course statistics',
      error: error.message
    });
  }
});
```

---

## 📋 Phase 2: Important Endpoints

### 3️⃣ GET /api/v1/courses/:id - Get Single Course

**Request:**
```
GET /api/v1/courses/course-123
Authorization: Bearer <admin-token>
```

**Success Response (200):**
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

### 4️⃣ POST /api/v1/courses - Create Course

**Request:**
```
POST /api/v1/courses
Authorization: Bearer <admin-token>
Content-Type: application/json
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

**Success Response (201):**
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

---

### 5️⃣ PUT /api/v1/courses/:id - Update Course

**Request:**
```
PUT /api/v1/courses/course-123
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:** (All fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "level": "intermediate",
  "price": 600
}
```

**Success Response (200):** Same as single course GET response

---

### 6️⃣ DELETE /api/v1/courses/:id - Delete Course

**Request:**
```
DELETE /api/v1/courses/course-123
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

---

### 7️⃣ POST /api/v1/courses/:id/publish - Publish Course

**Request:**
```
POST /api/v1/courses/course-123/publish
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "course-123",
    "title": "Navigation Fundamentals",
    "status": "active",
    "updatedAt": "2026-02-08T10:30:00Z"
  },
  "message": "Course published successfully"
}
```

**Implementation (Node.js/Express):**
```javascript
router.post('/courses/:id/publish', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findByIdAndUpdate(
      id,
      { status: 'active', updatedAt: new Date() },
      { new: true }
    );
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: course._id,
        title: course.title,
        status: course.status,
        updatedAt: course.updatedAt
      },
      message: 'Course published successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to publish course',
      error: error.message
    });
  }
});
```

---

### 8️⃣ POST /api/v1/courses/:id/unpublish - Unpublish Course

**Request:**
```
POST /api/v1/courses/course-123/unpublish
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "course-123",
    "title": "Navigation Fundamentals",
    "status": "inactive",
    "updatedAt": "2026-02-08T10:30:00Z"
  },
  "message": "Course unpublished successfully"
}
```

**Implementation (Node.js/Express):**
```javascript
router.post('/courses/:id/unpublish', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findByIdAndUpdate(
      id,
      { status: 'inactive', updatedAt: new Date() },
      { new: true }
    );
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: course._id,
        title: course.title,
        status: course.status,
        updatedAt: course.updatedAt
      },
      message: 'Course unpublished successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to unpublish course',
      error: error.message
    });
  }
});
```

---

## 🗄️ Database Schema

### Courses Collection/Table

```sql
CREATE TABLE courses (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  providerId VARCHAR(36) NOT NULL,
  categoryIds JSON,
  level ENUM('beginner', 'intermediate', 'advanced'),
  duration INT,
  maxParticipants INT,
  price DECIMAL(10, 2),
  currency VARCHAR(3),
  instructor VARCHAR(255),
  syllabus JSON,
  requirements JSON,
  certificationProvided BOOLEAN,
  certificationName VARCHAR(255),
  featured BOOLEAN DEFAULT false,
  status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
  images JSON,
  enrollments INT DEFAULT 0,
  rating DECIMAL(3, 1) DEFAULT 0,
  reviews INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  
  INDEX idx_status (status),
  INDEX idx_providerId (providerId),
  INDEX idx_categoryIds (categoryIds),
  INDEX idx_createdAt (createdAt),
  FOREIGN KEY (providerId) REFERENCES providers(id)
);
```

---

## 🔐 Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer <token>
```

**Expected token in:**
- localStorage as `AUTH_TOKEN`
- Sent with every API request
- Valid admin/superadmin role

---

## ✅ Testing Checklist

```
Frontend Testing:
- [ ] GET /courses returns 200 with data array
- [ ] GET /courses/stats returns 200 with stats object
- [ ] GET /courses/:id returns specific course
- [ ] POST /courses creates and returns new course (201)
- [ ] PUT /courses/:id updates course
- [ ] DELETE /courses/:id removes course
- [ ] Query parameters work: page, limit, categoryId, level, status, search
- [ ] Pagination info is correct
- [ ] Error messages are consistent
- [ ] 401 returned for unauthenticated requests
- [ ] Soft delete works (deletedAt set, not hard deleted)
- [ ] POST /courses/:id/publish changes status to 'active'
- [ ] POST /courses/:id/unpublish changes status to 'inactive'
- [ ] Publish/unpublish return correct course data

Admin Panel Testing:
- [ ] Courses page loads without errors
- [ ] Courses list displays with pagination
- [ ] Stats card shows total, active, featured counts
- [ ] Create course button works
- [ ] Can submit course form successfully
- [ ] Updated courses appear in list
- [ ] Search/filter works
- [ ] Publish button toggles course status to active
- [ ] Unpublish button toggles course status to inactive
- [ ] Edit course functionality works
```

---

## 📞 Frontend Integration Status

The frontend is ready to handle these endpoints:

✅ **Endpoints Implemented in Frontend:**
- [src/lib/api.ts](src/lib/api.ts) - API client with course methods
- [src/pages/CoursesPage.tsx](src/pages/CoursesPage.tsx) - List courses
- [src/pages/CourseDetailPage.tsx](src/pages/CourseDetailPage.tsx) - View course
- [src/pages/CreateCoursePage.tsx](src/pages/CreateCoursePage.tsx) - Create course
- [src/pages/EditCoursePage.tsx](src/pages/EditCoursePage.tsx) - Edit course

**Status:** Lines 404 errors from these pages indicate backend is not responding

---

## 🚀 Estimated Implementation Time

| Phase | Endpoints | Est. Time |
|-------|-----------|----------|
| Phase 1 (CRITICAL) | GET /courses, GET /courses/stats | 2-3 hours |
| Phase 2 (IMPORTANT) | GET/:id, POST, PUT/:id, DELETE, POST/:id/publish, POST/:id/unpublish | 4-5 hours |
| Phase 3 (NICE-TO-HAVE) | Featured, availability, bookings | 4-6 hours |

**Total**: ~7-13 hours for full implementation

---

## 📞 Contact

**Questions?** Check [COURSE_API_IMPLEMENTATION.md](COURSE_API_IMPLEMENTATION.md) for more details.

**Current Frontend Issue:** 404 errors on `/api/v1/courses` and `/api/v1/courses/stats`

**Frontend Status:** Waiting for Phase 1 implementations

---

**Last Updated**: February 7, 2026  
**Created For**: Backend Development Team
