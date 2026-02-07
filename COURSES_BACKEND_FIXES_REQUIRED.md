# URGENT: Courses API Backend Implementation Required

## Problem Statement

The admin panel cannot display courses because the backend API endpoints are not implemented:

- **Error 1:** `GET /api/v1/courses?page=1&limit=100` returns 404
- **Error 2:** `GET /api/v1/courses/stats` returns 404

## Required Backend Endpoints

### Priority 1: Essential Endpoints (Implement These First)

#### 1. `GET /api/v1/courses` - List Courses

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 100)
- `categoryId`: string (optional)
- `level`: 'beginner' | 'intermediate' | 'advanced' (optional)
- `status`: 'active' | 'inactive' | 'archived' (optional)
- `providerId`: string (optional)
- `search`: string (optional) - search in title and description

**Expected Response:**
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

**Implementation Example (Node.js/Express):**
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

#### 2. `GET /api/v1/courses/stats` - Get Course Statistics

**Expected Response:**
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

**Implementation Example:**
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
    const averageRating = ratingResult[0]?.avgRating || 0;
    
    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        archived,
        featured,
        totalEnrollments,
        averageRating: Math.round(averageRating * 10) / 10
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

### Priority 2: CRUD Operations (Implement Next)

#### 3. `GET /api/v1/courses/:id` - Get Single Course

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "course-1",
    "title": "STCW Basic Safety Training",
    "description": "Full course description...",
    "providerId": "provider-1",
    "provider": { "id": "provider-1", "name": "Maritime Academy" },
    "categoryIds": ["cat-1"],
    "categories": [{"id": "cat-1", "name": "Training & Certification"}],
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

#### 4. `POST /api/v1/courses` - Create Course

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

**Validation:**
- `title` is required (min 3 chars)
- `description` is required (min 10 chars)
- `level` must be one of: 'beginner', 'intermediate', 'advanced'
- `duration` must be > 0
- `maxParticipants` must be > 0
- `price` must be >= 0
- `currency` defaults to 'USD'
- `syllabus` must be array
- `requirements` must be array
- `categoryIds` must be array with at least one valid category ID

**Response:** Status 201 with created course data

---

#### 5. `PUT /api/v1/courses/:id` - Update Course

**Request Body:** Same as POST (all fields optional)

**Response:** Updated course data

---

#### 6. `DELETE /api/v1/courses/:id` - Delete Course

**Expected Response:**
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

---

## Database Schema (If Creating New)

```javascript
const courseSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
  categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'], 
    required: true 
  },
  duration: { type: Number, required: true }, // in hours
  maxParticipants: { type: Number, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  instructor: { type: String },
  syllabus: [{ type: String }],
  requirements: [{ type: String }],
  certificationProvided: { type: Boolean, default: false },
  certificationName: { type: String },
  featured: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'archived'], 
    default: 'active' 
  },
  images: [{ type: String }],
  enrollments: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});
```

---

## Quick Test

After implementing the endpoints, test them with:

```bash
# Test GET /courses
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/courses?page=1&limit=100

# Test GET /courses/stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/courses/stats
```

---

## Verification Checklist

- [ ] `GET /courses` returns 200 with courses array
- [ ] `GET /courses` supports pagination (page, limit)
- [ ] `GET /courses` supports filters (level, status, categoryId, providerId, search)
- [ ] `GET /courses/stats` returns 200 with statistics object
- [ ] `GET /courses/:id` returns 200 with single course
- [ ] `POST /courses` creates new course (201)
- [ ] `PUT /courses/:id` updates course (200)
- [ ] `DELETE /courses/:id` deletes course (200)
- [ ] All endpoints require authentication (Bearer token)
- [ ] All endpoints handle errors properly (500, 404, etc.)

---

## Related Documentation

- Full API specs: [COURSE_API_IMPLEMENTATION.md](COURSE_API_IMPLEMENTATION.md)
- Job visibility fixes: [BACKEND_FIXES_REQUIRED.md](BACKEND_FIXES_REQUIRED.md)

---

## Notes

**If you don't have any courses in the database yet:**
- The `GET /courses` endpoint should return an empty array with success: true
- The `GET /courses/stats` endpoint should return zeros for all counts
- The admin panel will display "No courses found"

**Minimum viable implementation:**
1. Implement `GET /courses` (even if returning empty array)
2. Implement `GET /courses/stats` (even if returning all zeros)
3. Test that admin panel loads without 404 errors
4. Then implement POST/PUT/DELETE for creating courses
