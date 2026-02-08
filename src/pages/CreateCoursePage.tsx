import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Category, Course, CreateCourseForm } from '../types';

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'SGD',
  'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'ZAR', 'BRL', 'MXN', 'AED',
  'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'EGP', 'TRY', 'RUB', 'KRW',
  'THB', 'MYR', 'IDR', 'PHP', 'VND', 'PKR', 'BDT', 'LKR', 'NPR', 'KES',
  'NGN', 'GHS', 'UGX', 'TZS', 'ETB', 'MAD', 'TND', 'DZD', 'ILS', 'CZK',
  'HUF', 'RON', 'BGN', 'HRK', 'RSD', 'ISK', 'UAH', 'BYN'
].sort();

interface CourseFormData extends CreateCourseForm {
  images: string[];
}

// Normalize course data to handle MongoDB _id field
const normalizeCourse = (course: any, index?: number): Course => {
  // Ensure id field is set (handle both id and _id from backend)
  if (!course.id && course._id) {
    course.id = course._id;
  }
  // Fallback: use generated ID if no ID exists (shouldn't happen with real data)
  if (!course.id) {
    course.id = `course-${index || Math.random().toString(36).substr(2, 9)}`;
    console.warn('Course missing ID, using generated ID:', course.id, course);
  }
  return course as Course;
};

export function CreateCoursePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!id);
  const [newSyllabusItem, setNewSyllabusItem] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    categoryIds: [],
    level: 'beginner',
    duration: 0,
    maxParticipants: 20,
    price: 0,
    currency: 'USD',
    instructor: '',
    syllabus: [],
    requirements: [],
    certificationProvided: false,
    certificationName: '',
    featured: false,
    images: [],
  });

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await api.categories.list();
        // Handle different response structures
        let cats: Category[] = [];
        if (Array.isArray(response.data)) {
          cats = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          cats = response.data.data;
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          cats = response.data.items;
        }
        setCategories(cats);
      } catch (error) {
        console.error('Failed to load categories:', error);
        toast({ title: 'Error', description: 'Failed to load categories', variant: 'destructive' });
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, [toast]);

  // Load course if editing
  useEffect(() => {
    if (id) {
      const loadCourse = async () => {
        setLoading(true);
        try {
          const response = await api.courses.get(id);
          const course = normalizeCourse(response.data, 0);
          
          // Flatten nested objects for form compatibility
          const flattenedData: CourseFormData = {
            ...course,
            // Handle price: object or number
            price: typeof course.price === 'object' ? course.price.amount : course.price,
            currency: typeof course.price === 'object' ? course.price.currency : course.currency,
            // Handle duration: object or number
            duration: typeof course.duration === 'object' ? course.duration.value : course.duration,
            // Handle instructor: object or string
            instructor: typeof course.instructor === 'object' ? course.instructor.name : course.instructor,
            // Handle syllabus: ensure it's string array
            syllabus: Array.isArray(course.syllabus) 
              ? course.syllabus.map(item => typeof item === 'string' ? item : item.module || '')
              : [],
            images: course.images || [],
          };
          
          setFormData(flattenedData);
        } catch (error) {
          console.error('Failed to load course:', error);
          toast({ title: 'Error', description: 'Failed to load course', variant: 'destructive' });
        } finally {
          setLoading(false);
        }
      };
      loadCourse();
    }
  }, [id, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'duration' || name === 'maxParticipants' || name === 'price' ? parseFloat(value) : value,
      }));
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleAddSyllabusItem = () => {
    if (newSyllabusItem.trim()) {
      setFormData(prev => ({
        ...prev,
        syllabus: [...(prev.syllabus || []), newSyllabusItem],
      }));
      setNewSyllabusItem('');
    }
  };

  const handleRemoveSyllabusItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      syllabus: prev.syllabus?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...(prev.requirements || []), newRequirement],
      }));
      setNewRequirement('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || formData.categoryIds.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        title: formData.title,
        description: formData.description,
        categoryIds: formData.categoryIds,
        level: formData.level,
        duration: formData.duration,
        maxParticipants: formData.maxParticipants,
        price: formData.price,
        currency: formData.currency,
        instructor: formData.instructor || undefined,
        syllabus: formData.syllabus,
        requirements: formData.requirements,
        certificationProvided: formData.certificationProvided,
        certificationName: formData.certificationName || undefined,
        featured: formData.featured,
        images: formData.images,
      };

      if (id) {
        await api.courses.update(id, submitData);
        toast({ title: 'Success', description: 'Course updated successfully' });
      } else {
        const response = await api.courses.create(submitData);
        toast({ title: 'Success', description: 'Course created successfully' });
        navigate(`/courses/${response.data?.id}`);
      }
    } catch (error: any) {
      console.error('Course creation error:', error);
      const errorMessage = error?.message || 'Failed to save course. Please check if the backend is running.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/courses')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Course' : 'Create New Course'}
          </h1>
          <p className="text-gray-600 mt-1">Add or modify course information</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Course title and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., STCW Basic Safety Training"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Comprehensive course description..."
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instructor">Instructor Name</Label>
                <Input
                  id="instructor"
                  name="instructor"
                  placeholder="e.g., John Smith"
                  value={formData.instructor}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="level">Level *</Label>
                <Select value={formData.level} onValueChange={(value: any) => 
                  setFormData(prev => ({ ...prev, level: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Details */}
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>Duration, capacity, and pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (hours) *</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  placeholder="e.g., 40"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="0"
                  step="0.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="maxParticipants">Max Participants *</Label>
                <Input
                  id="maxParticipants"
                  name="maxParticipants"
                  type="number"
                  placeholder="e.g., 20"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  placeholder="e.g., 500"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency *</Label>
                <Select value={formData.currency} onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, currency: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(currency => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categories *</CardTitle>
            <CardDescription>Select relevant course categories</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCategories ? (
              <div className="text-center text-gray-500">Loading categories...</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`cat-${category.id}`}
                      checked={formData.categoryIds.includes(category.id)}
                      onCheckedChange={() => handleCategoryToggle(category.id)}
                    />
                    <Label htmlFor={`cat-${category.id}`} className="cursor-pointer">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Syllabus */}
        <Card>
          <CardHeader>
            <CardTitle>Course Syllabus</CardTitle>
            <CardDescription>Add topics covered in the course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add syllabus item..."
                value={newSyllabusItem}
                onChange={(e) => setNewSyllabusItem(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSyllabusItem();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSyllabusItem}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {(formData.syllabus || []).length > 0 && (
              <div className="space-y-2">
                {formData.syllabus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <span>{item}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSyllabusItem(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>Prerequisites for this course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add requirement..."
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRequirement();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddRequirement}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {(formData.requirements || []).length > 0 && (
              <div className="space-y-2">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <span>{req}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRequirement(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certification */}
        <Card>
          <CardHeader>
            <CardTitle>Certification</CardTitle>
            <CardDescription>Certification upon completion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="certProvided"
                name="certificationProvided"
                checked={formData.certificationProvided}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, certificationProvided: checked as boolean }))
                }
              />
              <Label htmlFor="certProvided" className="cursor-pointer">
                Certification Provided
              </Label>
            </div>

            {formData.certificationProvided && (
              <div>
                <Label htmlFor="certificationName">Certification Name</Label>
                <Input
                  id="certificationName"
                  name="certificationName"
                  placeholder="e.g., STCW Basic Safety Training Certificate"
                  value={formData.certificationName}
                  onChange={handleInputChange}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Course visibility and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="featured"
                name="featured"
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, featured: checked as boolean }))
                }
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Featured Course
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/courses')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditMode ? 'Update Course' : 'Create Course'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateCoursePage;
