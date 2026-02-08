import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Plus, Edit, Trash2, Calendar, MapPin, Users, Clock, 
  DollarSign, Award, CheckCircle, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, addMonths, subMonths } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api';
import { Course, CourseAvailability } from '../types';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

interface AvailabilityFormData {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  location?: string;
  isOnline: boolean;
  spotsAvailable: number;
  notes?: string;
}

export function CourseDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [availability, setAvailability] = useState<CourseAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [editingAvailabilityId, setEditingAvailabilityId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Calendar and filtering state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Calculate calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Helper to get status of a slot
  const getSlotStatus = (slot: CourseAvailability): string => {
    if (!slot.status) {
      const now = new Date();
      const slotStart = new Date(slot.startDate);
      if (slotStart < now) return 'expired';
      if (slot.spotsBooked >= slot.spotsAvailable) return 'full';
      return 'available';
    }
    return slot.status;
  };

  // Filtered and sorted availability
  const filteredAvailability = useMemo(() => {
    let filtered = availability.filter(slot => {
      if (filterStatus === 'all') return true;
      return getSlotStatus(slot) === filterStatus;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      } else if (sortBy === 'spots') {
        return (b.spotsAvailable - b.spotsBooked) - (a.spotsAvailable - a.spotsBooked);
      } else if (sortBy === 'status') {
        const statusOrder = { 'available': 0, 'full': 1, 'expired': 2 };
        return (statusOrder[getSlotStatus(a) as keyof typeof statusOrder] ?? 3) - 
               (statusOrder[getSlotStatus(b) as keyof typeof statusOrder] ?? 3);
      }
      return 0;
    });

    return sorted;
  }, [availability, filterStatus, sortBy]);

  // Get slots for a specific date
  const getSlotsForDate = (date: Date): CourseAvailability[] => {
    return filteredAvailability.filter(slot => {
      const slotStart = new Date(slot.startDate);
      const slotEnd = new Date(slot.endDate);
      return date >= slotStart && date <= slotEnd;
    });
  };

  const [formData, setFormData] = useState<AvailabilityFormData>({
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    daysOfWeek: [],
    location: '',
    isOnline: true,
    spotsAvailable: 20,
    notes: '',
  });

  // Load course data
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [courseRes, availRes] = await Promise.all([
          api.courses.get(id),
          api.courseAvailability.list(id),
        ]);
        setCourse(normalizeCourse(courseRes.data));
        setAvailability((availRes as any).data as CourseAvailability[] || []);
      } catch (error) {
        console.error('Failed to load course:', error);
        toast({ title: 'Error', description: 'Failed to load course', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, toast]);

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

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
        [name]: name === 'spotsAvailable' ? parseInt(value) : value,
      }));
    }
  };

  const handleSubmitAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!formData.startDate || !formData.endDate || formData.daysOfWeek.length === 0 || formData.spotsAvailable <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingAvailabilityId) {
        await api.courseAvailability.update(id, editingAvailabilityId, formData);
        toast({ title: 'Success', description: 'Availability updated successfully' });
      } else {
        await api.courseAvailability.create(id, formData);
        toast({ title: 'Success', description: 'Availability slot created successfully' });
      }

      // Reload availability
      const response = await api.courseAvailability.list(id);
      setAvailability((response as any).data as CourseAvailability[] || []);

      // Reset form
      setFormData({
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '17:00',
        daysOfWeek: [],
        location: '',
        isOnline: true,
        spotsAvailable: 20,
        notes: '',
      });
      setEditingAvailabilityId(null);
      setShowAvailabilityDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save availability',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAvailability = (avail: CourseAvailability) => {
    setFormData({
      startDate: avail.startDate,
      endDate: avail.endDate,
      startTime: avail.startTime,
      endTime: avail.endTime,
      daysOfWeek: avail.daysOfWeek,
      location: avail.location || '',
      isOnline: avail.isOnline,
      spotsAvailable: avail.spotsAvailable,
      notes: avail.notes || '',
    });
    setEditingAvailabilityId(avail.id);
    setShowAvailabilityDialog(true);
  };

  const handleDeleteAvailability = async (availabilityId: string) => {
    if (!id || !window.confirm('Are you sure?')) return;

    try {
      await api.courseAvailability.delete(id, availabilityId);
      setAvailability(prev => prev.filter(a => a.id !== availabilityId));
      toast({ title: 'Success', description: 'Availability slot deleted' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete availability',
        variant: 'destructive',
      });
    }
  };

  const closeDialog = () => {
    setShowAvailabilityDialog(false);
    setEditingAvailabilityId(null);
    setFormData({
      startDate: '',
      endDate: '',
      startTime: '09:00',
      endTime: '17:00',
      daysOfWeek: [],
      location: '',
      isOnline: true,
      spotsAvailable: 20,
      notes: '',
    });
  };

  if (loading || !course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
            <p className="text-gray-600 mt-1">Manage course details and availability</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/courses/${id}/edit`)}>Edit Course</Button>
      </div>

      {/* Course Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold">
                {typeof course.duration === 'object' ? `${course.duration.value} ${course.duration.unit}` : `${course.duration}h`}
              </div>
              <p className="text-gray-600 text-sm">Duration</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold">{course.maxParticipants}</div>
              <p className="text-gray-600 text-sm">Max Participants</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <DollarSign className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <div className="text-2xl font-bold">
                {typeof course.price === 'object' && course.price !== null
                  ? (course.price.type === 'free' ? 'Free' : `${course.price.amount || 0} ${course.price.currency || 'USD'}`)
                  : (typeof course.price === 'number' ? `${course.price}` : 'N/A')}
              </div>
              <p className="text-gray-600 text-sm">
                {typeof course.price === 'object' && course.price !== null ? (course.price.currency || 'USD') : (course.currency || 'USD')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto text-orange-600 mb-2" />
              <div className="text-2xl font-bold">{course.enrollments || 0}</div>
              <p className="text-gray-600 text-sm">Enrolled</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Badge variant="outline" className="mx-auto block">
                {course.level}
              </Badge>
              <p className="text-gray-600 text-sm mt-2">Level</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              {course.certificationProvided ? (
                <>
                  <Award className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <p className="text-gray-600 text-sm">Certified</p>
                </>
              ) : (
                <>
                  <Award className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 text-sm">No cert</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{course.description}</p>
          </CardContent>
        </Card>

        {course.instructor && (
          <Card>
            <CardHeader>
              <CardTitle>Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              {typeof course.instructor === 'object' && course.instructor !== null ? (
                <div>
                  <p className="text-gray-900 font-semibold">{course.instructor.name || 'Unknown Instructor'}</p>
                  {course.instructor.bio && <p className="text-gray-700 mt-2">{course.instructor.bio}</p>}
                  {Array.isArray(course.instructor.credentials) && course.instructor.credentials.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-600">Credentials:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700">
                        {course.instructor.credentials.map((cred: string, idx: number) => (
                          <li key={idx}>{String(cred)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-700">{String(course.instructor || 'Unknown Instructor')}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Syllabus & Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(course.syllabus || []).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Syllabus</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {course.syllabus.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    {typeof item === 'object' && item !== null ? (
                      <div className="flex-1">
                        <div className="font-semibold">{(item as any).module || 'Module'}</div>
                        {Array.isArray((item as any).topics) && (item as any).topics.length > 0 && (
                          <ul className="ml-4 mt-1 space-y-1">
                            {(item as any).topics.map((topic: any, tidx: number) => (
                              <li key={tidx} className="text-sm text-gray-600">• {String(topic)}</li>
                            ))}
                          </ul>
                        )}
                        {(item as any).duration && <div className="text-sm text-gray-500 mt-1">{String((item as any).duration)}</div>}
                      </div>
                    ) : (
                      <span>{String(item)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {(course.requirements || []).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {course.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Availability Slots - Enhanced with Calendar & Filtering */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Available Slots</CardTitle>
            <CardDescription>Manage course availability and bookings</CardDescription>
          </div>
          <Button onClick={() => setShowAvailabilityDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Slot
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {availability.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No availability slots yet.</p>
              <p className="text-sm">Add one to enable bookings.</p>
            </div>
          ) : (
            <>
              {/* View Toggle & Filters */}
              <div className="space-y-4">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'calendar' | 'list')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="calendar">
                      <Calendar className="w-4 h-4 mr-2" />
                      Calendar View
                    </TabsTrigger>
                    <TabsTrigger value="list">
                      <Filter className="w-4 h-4 mr-2" />
                      List View
                    </TabsTrigger>
                  </TabsList>

                  {/* Calendar View */}
                  <TabsContent value="calendar" className="space-y-4">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <h3 className="font-semibold text-lg">
                        {format(currentMonth, 'MMMM yyyy')}
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="border rounded-lg p-4">
                      {/* Day headers */}
                      <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar cells */}
                      <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map(day => {
                          const daySlots = getSlotsForDate(day);
                          const hasSlots = daySlots.length > 0;
                          const isCurrentMonth = isSameMonth(day, currentMonth);
                          const currentDay = isToday(day);

                          return (
                            <div
                              key={day.toString()}
                              className={`
                                aspect-square border rounded-lg p-1 text-center text-sm transition-colors
                                ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                                ${currentDay ? 'border-blue-500 bg-blue-50' : ''}
                                ${hasSlots && isCurrentMonth ? 'bg-green-50 border-green-500' : ''}
                              `}
                            >
                              <div className="font-semibold">{format(day, 'd')}</div>
                              {hasSlots && isCurrentMonth && (
                                <div className="text-xs text-green-600 font-medium">
                                  {daySlots.length} slot{daySlots.length > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="mt-4 flex gap-6 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded border border-blue-500 bg-blue-50" />
                          <span>Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded border border-green-500 bg-green-50" />
                          <span>Has slots</span>
                        </div>
                      </div>
                    </div>

                    {/* Slots for selected month */}
                    <div className="space-y-3">
                      {filteredAvailability.length === 0 ? (
                        <p className="text-center text-gray-500 py-6">No slots in {format(currentMonth, 'MMMM yyyy')}</p>
                      ) : (
                        filteredAvailability.map(slot => (
                          <div key={slot.id} className="border rounded-lg p-3 bg-gradient-to-r from-blue-50 to-transparent">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="font-medium text-sm">
                                    {format(new Date(slot.startDate), 'MMM d')} - {format(new Date(slot.endDate), 'MMM d')}
                                  </span>
                                  <span className="text-xs text-gray-600">{slot.startTime} - {slot.endTime}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge variant="outline" className="text-xs">
                                    {getSlotStatus(slot)}
                                  </Badge>
                                  <span className="text-gray-600">
                                    {slot.spotsAvailable - slot.spotsBooked} / {slot.spotsAvailable} available
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditAvailability(slot)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAvailability(slot.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* List View with Filtering & Sorting */}
                  <TabsContent value="list" className="space-y-4">
                    {/* Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 block mb-2">Filter by Status</label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Slots</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="full">Full</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600 block mb-2">Sort by</label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Date (Earliest)</SelectItem>
                            <SelectItem value="spots">Available Spots</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* List */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredAvailability.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No slots match the selected filters
                        </div>
                      ) : (
                        filteredAvailability.map(slot => {
                          const status = getSlotStatus(slot);
                          const statusColors = {
                            available: 'bg-green-50 border-green-200',
                            full: 'bg-red-50 border-red-200',
                            expired: 'bg-gray-50 border-gray-200',
                          } as Record<string, string>;

                          return (
                            <div key={slot.id} className={`border rounded-lg p-4 ${statusColors[status as keyof typeof statusColors] || 'bg-gray-50'}`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-4 mb-2">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-gray-600" />
                                      <span className="font-medium">
                                        {format(new Date(slot.startDate), 'MMM d')} - {format(new Date(slot.endDate), 'MMM d, yyyy')}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-gray-600" />
                                      <span className="text-sm">{slot.startTime} - {slot.endTime}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                                    {slot.isOnline ? (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">🌐 Online</span>
                                    ) : slot.location ? (
                                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                        <MapPin className="w-3 h-3" />
                                        {slot.location}
                                      </div>
                                    ) : null}

                                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                      <Users className="w-3 h-3" />
                                      {slot.spotsBooked}/{slot.spotsAvailable} booked
                                    </div>

                                    <Badge variant={status === 'full' ? 'destructive' : 'secondary'} className="text-xs">
                                      {status}
                                    </Badge>
                                  </div>

                                  {slot.daysOfWeek && slot.daysOfWeek.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-600">
                                      <span className="font-medium">Days:</span> {slot.daysOfWeek.join(', ')}
                                    </div>
                                  )}

                                  {slot.notes && (
                                    <div className="mt-2 text-xs text-gray-700 bg-white bg-opacity-70 p-2 rounded border-l-2 border-blue-400">
                                      <span className="font-medium">Note:</span> {slot.notes}
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-2 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditAvailability(slot)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteAvailability(slot.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Availability Dialog */}
      <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAvailabilityId ? 'Edit Availability Slot' : 'Add Availability Slot'}
            </DialogTitle>
            <DialogDescription>
              Set up when this course is available for booking
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitAvailability} className="space-y-6">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Days of Week */}
            <div>
              <Label>Days of Week *</Label>
              <div className="grid grid-cols-7 gap-2 mt-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`py-2 rounded text-sm font-medium transition-colors ${
                      formData.daysOfWeek.includes(day)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Location & Format */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isOnline"
                  name="isOnline"
                  checked={formData.isOnline}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <Label htmlFor="isOnline" className="cursor-pointer">
                  Online Course
                </Label>
              </div>

              {!formData.isOnline && (
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g., Training Center, Room 101"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>

            {/* Available Spots */}
            <div>
              <Label htmlFor="spotsAvailable">Available Spots *</Label>
              <Input
                id="spotsAvailable"
                name="spotsAvailable"
                type="number"
                min="1"
                value={formData.spotsAvailable}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                name="notes"
                placeholder="Add any special instructions or notes..."
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingAvailabilityId ? 'Update' : 'Create'} Slot
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CourseDetailPage;
