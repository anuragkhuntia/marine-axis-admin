import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, Star, Users, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import api from '../lib/api';
import { Course } from '../types';

interface CoursesListItem extends Course {
  providerName?: string;
}

export function CoursesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: coursesData, isLoading, error: coursesError, refetch: refetchCourses } = useQuery({
    queryKey: ['courses', levelFilter, statusFilter, searchQuery],
    queryFn: async () => {
      const params: any = { page: 1, limit: 100 };
      if (levelFilter !== 'all') params.level = levelFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const response = await api.courses.list(params);
      return response;
    },
    retry: 1,
  });

  const { data: statsData, error: statsError } = useQuery({
    queryKey: ['courses-stats'],
    queryFn: async () => {
      const response = await api.courses.getStats();
      return response;
    },
    retry: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.courses.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: 'Course deleted', description: 'Course has been deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete course', variant: 'destructive' });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.courses.publish(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: 'Course published', description: 'Course is now active and visible' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to publish course', variant: 'destructive' });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.courses.unpublish(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: 'Course unpublished', description: 'Course is now inactive' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to unpublish course', variant: 'destructive' });
    },
  });

  const setFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      return await api.courses.setFeatured(id, featured);
    },
    onSuccess: (_, { featured }) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      const message = featured ? 'marked as featured' : 'removed from featured';
      toast({ title: 'Course updated', description: `Course ${message}` });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update course', variant: 'destructive' });
    },
  });

  // Handle both direct array and PaginatedResponse structure
  // Backend returns: { success: true, data: { data: [...], pagination: {...} } }
  let courses: CoursesListItem[] = [];
  if (Array.isArray(coursesData?.data)) {
    courses = coursesData.data as CoursesListItem[];
  } else if (coursesData?.data && typeof coursesData.data === 'object' && Array.isArray((coursesData.data as any).data)) {
    courses = (coursesData.data as any).data as CoursesListItem[];
  }
  
  // Debug: log courses to verify IDs exist
  if (courses.length > 0) {
    console.log('Courses loaded:', courses.length, courses.map(c => ({ id: c.id, title: c.title })));
  }
  
  const stats = statsData?.data || { total: 0, active: 0, inactive: 0, featured: 0 };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePublish = (id: string) => {
    publishMutation.mutate(id);
  };

  const handleUnpublish = (id: string) => {
    unpublishMutation.mutate(id);
  };

  const handleToggleFeatured = (id: string, currentFeatured: boolean) => {
    setFeaturedMutation.mutate({ id, featured: !currentFeatured });
  };

  const getLevelBadge = (level: string) => {
    const variants: Record<string, any> = {
      beginner: { variant: 'outline', color: 'bg-green-100 text-green-800' },
      intermediate: { variant: 'outline', color: 'bg-yellow-100 text-yellow-800' },
      advanced: { variant: 'outline', color: 'bg-purple-100 text-purple-800' },
    };
    return variants[level] || { variant: 'outline' };
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'default',
      inactive: 'secondary',
      archived: 'outline',
    };
    return variants[status] || 'outline';
  };

  const formatDuration = (duration: any) => {
    try {
      if (typeof duration === 'object' && duration !== null) {
        if (duration.value !== undefined) {
          return `${duration.value} ${duration.unit || 'weeks'}`;
        }
        return 'N/A';
      }
      if (typeof duration === 'number') {
        return `${duration}h`;
      }
      return String(duration) || 'N/A';
    } catch (e) {
      console.error('Error formatting duration:', duration, e);
      return 'N/A';
    }
  };

  const formatPrice = (price: any, currency?: string) => {
    try {
      if (typeof price === 'object' && price !== null) {
        if (price.amount !== undefined) {
          const currencyCode = price.currency || currency || 'USD';
          return `${currencyCode} ${price.amount}`;
        }
        return 'N/A';
      }
      if (typeof price === 'number') {
        const currencyCode = currency || 'USD';
        return `${currencyCode} ${price}`;
      }
      return String(price) || 'N/A';
    } catch (e) {
      console.error('Error formatting price:', price, e);
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Messages */}
      {(coursesError || statsError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Unable to load courses</h3>
            <p className="text-red-800 text-sm mt-1">
              {coursesError ? (
                <>Connected to backend but received error. Please check the server is responding correctly.</>
              ) : statsError ? (
                <>Could not load course statistics. The backend API may not be accessible.</>
              ) : (
                <>The backend API is not responding. Please ensure the server is running on http://localhost:3000</>
              )}
            </p>
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => refetchCourses()}
                className="border-red-300 hover:bg-red-100"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-gray-600 mt-1">Manage training courses and certifications</p>
        </div>
        <Button onClick={() => navigate('/courses/new')} size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Add Course
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-gray-600 text-sm mt-1">Total Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
              <p className="text-gray-600 text-sm mt-1">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.inactive}</div>
              <p className="text-gray-600 text-sm mt-1">Inactive</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.featured}</div>
              <p className="text-gray-600 text-sm mt-1">Featured</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">Search Courses</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by title, description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-48">
                <label className="text-sm font-medium">Level</label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-48">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Courses List</CardTitle>
          <CardDescription>
            {courses.length} course{courses.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No courses found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Stats</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course, index) => (
                    <TableRow key={course?.id || `course-${index}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{course.title}</div>
                          {course.featured && (
                            <div className="flex gap-1 mt-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-yellow-600">Featured</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge {...getLevelBadge(course.level)} variant="outline">
                          {course.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          {formatDuration(course.duration)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          {formatPrice(course.price, course.currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(course.status)}>
                          {course.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm text-gray-600">
                          <Users className="w-4 h-4 inline mr-1" />
                          {course.enrollments || 0} enrolled
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/courses/${course.id}`)}
                            title="View course"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/courses/${course.id}/edit`)}
                            title="Edit course"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFeatured(course.id, course.featured || false)}
                            title={course.featured ? 'Remove from featured' : 'Mark as featured'}
                            disabled={setFeaturedMutation.isPending}
                            className={course.featured ? 'text-yellow-500' : 'text-gray-500'}
                          >
                            <Star className="w-4 h-4" fill={course.featured ? 'currentColor' : 'none'} />
                          </Button>
                          {course.status === 'inactive' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePublish(course.id)}
                              title="Publish course"
                              disabled={publishMutation.isPending}
                              className="text-green-600"
                            >
                              Publish
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnpublish(course.id)}
                              title="Unpublish course"
                              disabled={unpublishMutation.isPending}
                              className="text-orange-600"
                            >
                              Unpublish
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(course.id)}
                            title="Delete course"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CoursesPage;
