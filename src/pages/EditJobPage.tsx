import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X, Calendar, DollarSign, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

import { Job, CreateJobForm } from '../types';
import api from '../lib/api';

export function EditJobPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingJob, setIsLoadingJob] = useState(true);
  const [providers, setProviders] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState<CreateJobForm>({
    title: '',
    description: '',
    providerId: '',
    categoryIds: [],
    location: '',
    salaryRange: {
      min: 0,
      max: 0,
      currency: 'USD',
    },
    requirements: [],
    benefits: [],
    type: 'full-time',
    remote: false,
    urgency: 'medium',
    expiresAt: '',
  });

  const [currentRequirement, setCurrentRequirement] = useState('');
  const [currentBenefit, setCurrentBenefit] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load job data
  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        toast({
          title: 'Error',
          description: 'Job ID not found',
          variant: 'destructive',
        });
        navigate('/jobs');
        return;
      }

      try {
        setIsLoadingJob(true);
        
        // Load providers and categories
        const [providersRes, categoriesRes, jobRes] = await Promise.all([
          api.providers.list({ limit: 100 }),
          api.categories.list(),
          api.jobs.get(id),
        ]);

        if (providersRes.success) {
          setProviders(providersRes.data.map((p: any) => ({ id: p.id, name: p.name })));
        }

        if (categoriesRes.success) {
          setCategories(categoriesRes.data.map((c: any) => ({ id: c.id, name: c.name })));
        }

        if (!jobRes.success) {
          throw new Error(jobRes.message || 'Failed to load job');
        }

        const job = jobRes.data as Job;
        setFormData({
          title: job.title,
          description: job.description,
          providerId: job.providerId,
          categoryIds: job.categoryIds || [],
          location: job.location,
          salaryRange: job.salaryRange || { min: 0, max: 0, currency: 'USD' },
          requirements: job.requirements || [],
          benefits: job.benefits || [],
          type: job.type || 'full-time',
          remote: job.remote || false,
          urgency: job.urgency || 'medium',
          expiresAt: job.expiresAt ? job.expiresAt.split('T')[0] : '',
        });
      } catch (error: any) {
        console.error('Failed to load job:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load job',
          variant: 'destructive',
        });
        navigate('/jobs');
      } finally {
        setIsLoadingJob(false);
      }
    };

    loadData();
  }, [id, navigate, toast]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';
    if (!formData.providerId) newErrors.providerId = 'Provider is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (formData.categoryIds.length === 0) newErrors.categoryIds = 'At least one category is required';
    if (formData.requirements.length === 0) newErrors.requirements = 'At least one requirement is required';
    if (formData.benefits.length === 0) newErrors.benefits = 'At least one benefit is required';
    if (!formData.expiresAt) newErrors.expiresAt = 'Expiration date is required';

    if (formData.salaryRange.min <= 0) newErrors.salaryMin = 'Minimum salary must be greater than 0';
    if (formData.salaryRange.max <= 0) newErrors.salaryMax = 'Maximum salary must be greater than 0';
    if (formData.salaryRange.min >= formData.salaryRange.max) {
      newErrors.salaryRange = 'Maximum salary must be greater than minimum salary';
    }

    if (formData.expiresAt) {
      const expiryDate = new Date(formData.expiresAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expiryDate <= today) {
        newErrors.expiresAt = 'Expiration date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSalaryChange = (field: 'min' | 'max', value: number) => {
    setFormData(prev => ({
      ...prev,
      salaryRange: { ...prev.salaryRange, [field]: value }
    }));
  };

  const handleAddRequirement = () => {
    if (currentRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, currentRequirement.trim()],
      }));
      setCurrentRequirement('');
      if (errors.requirements) {
        setErrors(prev => ({ ...prev, requirements: '' }));
      }
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const handleAddBenefit = () => {
    if (currentBenefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, currentBenefit.trim()],
      }));
      setCurrentBenefit('');
      if (errors.benefits) {
        setErrors(prev => ({ ...prev, benefits: '' }));
      }
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const handleToggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    if (!id) return;

    try {
      setIsLoading(true);
      const response = await api.jobs.update(id, formData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update job');
      }

      toast({
        title: 'Success',
        description: 'Job updated successfully',
      });

      navigate('/jobs');
    } catch (error: any) {
      console.error('Failed to update job:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update job',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingJob) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/jobs')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Job</h1>
          <p className="text-muted-foreground">Update the job details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
            <CardDescription>Update the basic job details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Marine Engineer"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the job responsibilities and requirements"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            {/* Provider */}
            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              <Select value={formData.providerId} onValueChange={(value) => handleInputChange('providerId', value)}>
                <SelectTrigger className={errors.providerId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.providerId && <p className="text-red-500 text-sm">{errors.providerId}</p>}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location *
              </Label>
              <Input
                id="location"
                placeholder="e.g., Miami, FL"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={errors.location ? 'border-red-500' : ''}
              />
              {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
            </div>

            {/* Job Type and Remote */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Job Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remote">Remote</Label>
                <div className="flex items-center gap-2 h-10">
                  <Checkbox
                    id="remote"
                    checked={formData.remote}
                    onCheckedChange={(checked) => handleInputChange('remote', checked)}
                  />
                  <Label htmlFor="remote" className="font-normal cursor-pointer">
                    This is a remote position
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categories *</CardTitle>
            <CardDescription>Select one or more categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={formData.categoryIds.includes(category.id)}
                    onCheckedChange={() => handleToggleCategory(category.id)}
                  />
                  <Label htmlFor={`category-${category.id}`} className="font-normal cursor-pointer">
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
            {errors.categoryIds && <p className="text-red-500 text-sm">{errors.categoryIds}</p>}
          </CardContent>
        </Card>

        {/* Salary */}
        <Card>
          <CardHeader>
            <CardTitle>Salary Range *</CardTitle>
            <CardDescription>Set the minimum and maximum salary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salaryMin" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Minimum Salary *
                </Label>
                <Input
                  id="salaryMin"
                  type="number"
                  placeholder="0"
                  value={formData.salaryRange.min}
                  onChange={(e) => handleSalaryChange('min', Number(e.target.value))}
                  className={errors.salaryMin ? 'border-red-500' : ''}
                />
                {errors.salaryMin && <p className="text-red-500 text-sm">{errors.salaryMin}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salaryMax" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Maximum Salary *
                </Label>
                <Input
                  id="salaryMax"
                  type="number"
                  placeholder="0"
                  value={formData.salaryRange.max}
                  onChange={(e) => handleSalaryChange('max', Number(e.target.value))}
                  className={errors.salaryMax ? 'border-red-500' : ''}
                />
                {errors.salaryMax && <p className="text-red-500 text-sm">{errors.salaryMax}</p>}
              </div>
            </div>
            {errors.salaryRange && <p className="text-red-500 text-sm">{errors.salaryRange}</p>}
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements *</CardTitle>
            <CardDescription>Add job requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter requirement"
                value={currentRequirement}
                onChange={(e) => setCurrentRequirement(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRequirement();
                  }
                }}
              />
              <Button type="button" onClick={handleAddRequirement} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.requirements && <p className="text-red-500 text-sm">{errors.requirements}</p>}
            <div className="space-y-2">
              {formData.requirements.map((req, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                  <span className="text-sm">{req}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRequirement(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Benefits *</CardTitle>
            <CardDescription>Add job benefits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter benefit"
                value={currentBenefit}
                onChange={(e) => setCurrentBenefit(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBenefit();
                  }
                }}
              />
              <Button type="button" onClick={handleAddBenefit} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.benefits && <p className="text-red-500 text-sm">{errors.benefits}</p>}
            <div className="space-y-2">
              {formData.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                  <span className="text-sm">{benefit}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBenefit(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>Set urgency and expiration date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency</Label>
                <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expiration Date *
                </Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                  className={errors.expiresAt ? 'border-red-500' : ''}
                />
                {errors.expiresAt && <p className="text-red-500 text-sm">{errors.expiresAt}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/jobs')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Job'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default EditJobPage;
