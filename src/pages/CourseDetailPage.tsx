import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Plus, Edit, Trash2, Calendar, MapPin, Users, Clock, 
  DollarSign, Award, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api';
import { Course, CourseAvailability } from '../types';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
        setCourse(courseRes.data);
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

      {/* Availability Slots */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Available Slots</CardTitle>
            <CardDescription>Manage course availability for booking</CardDescription>
          </div>
          <Button onClick={() => setShowAvailabilityDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Slot
          </Button>
        </CardHeader>
        <CardContent>
          {availability.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No availability slots yet. Add one to enable bookings.
            </div>
          ) : (
            <div className="space-y-4">
              {availability.map(slot => (
                <div key={slot.id} className="border rounded-lg p-4 hover:bg-gray-50">
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
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {slot.isOnline ? (
                          <span>🌐 Online</span>
                        ) : slot.location ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{slot.location}</span>
                          </div>
                        ) : null}

                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{slot.spotsBooked}/{slot.spotsAvailable} booked</span>
                        </div>

                        <Badge variant={slot.status === 'full' ? 'destructive' : 'secondary'}>
                          {slot.status}
                        </Badge>
                      </div>

                      {slot.daysOfWeek && slot.daysOfWeek.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          {slot.daysOfWeek.join(', ')}
                        </div>
                      )}

                      {slot.notes && (
                        <div className="mt-2 text-sm text-gray-700 bg-blue-50 p-2 rounded">
                          {slot.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
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
              ))}
            </div>
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
