import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { Blog, CreateBlogForm } from '../types';
import api from '../lib/api';

export function EditBlogPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBlog, setIsLoadingBlog] = useState(true);
  const [formData, setFormData] = useState<CreateBlogForm>({
    title: '',
    excerpt: '',
    content: '',
    tags: [],
    featured: false,
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: [],
    },
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [showSeoPreview, setShowSeoPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load blog data
  useEffect(() => {
    const loadBlog = async () => {
      if (!id) {
        toast({
          title: 'Error',
          description: 'Blog ID not found',
          variant: 'destructive',
        });
        navigate('/blogs');
        return;
      }

      try {
        setIsLoadingBlog(true);
        const response = await api.blogs.get(id);
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to load blog');
        }

        const blog = response.data as Blog;
        setFormData({
          title: blog.title,
          excerpt: blog.excerpt,
          content: blog.content,
          tags: blog.tags || [],
          featured: blog.featured || false,
          seo: {
            metaTitle: blog.seo?.metaTitle || '',
            metaDescription: blog.seo?.metaDescription || '',
            keywords: blog.seo?.keywords || [],
          },
        });
      } catch (error: any) {
        console.error('Failed to load blog:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load blog',
          variant: 'destructive',
        });
        navigate('/blogs');
      } finally {
        setIsLoadingBlog(false);
      }
    };

    loadBlog();
  }, [id, navigate, toast]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.excerpt.trim()) newErrors.excerpt = 'Excerpt is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (formData.tags.length === 0) newErrors.tags = 'At least one tag is required';

    if (formData.title.length > 60) newErrors.title = 'Title should be under 60 characters for SEO';
    if (formData.excerpt.length > 160) newErrors.excerpt = 'Excerpt should be under 160 characters for SEO';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSeoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      seo: { ...prev.seo, [field]: value }
    }));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag('');
      if (errors.tags) {
        setErrors(prev => ({ ...prev, tags: '' }));
      }
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleAddKeyword = () => {
    if (currentKeyword.trim() && !formData.seo.keywords.includes(currentKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        seo: { ...prev.seo, keywords: [...prev.seo.keywords, currentKeyword.trim()] }
      }));
      setCurrentKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      seo: { ...prev.seo, keywords: prev.seo.keywords.filter(k => k !== keyword) }
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
      const response = await api.blogs.update(id, formData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update blog');
      }

      toast({
        title: 'Success',
        description: 'Blog post updated successfully',
      });

      navigate('/blogs');
    } catch (error: any) {
      console.error('Failed to update blog:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update blog post',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingBlog) {
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
          onClick={() => navigate('/blogs')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Blog Post</h1>
          <p className="text-muted-foreground">Update the blog post details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Blog Details</CardTitle>
            <CardDescription>Edit the main content of your blog post</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter blog title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
              <p className="text-xs text-muted-foreground">{formData.title.length}/60 characters</p>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt *</Label>
              <Textarea
                id="excerpt"
                placeholder="Enter blog excerpt"
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                rows={3}
                className={errors.excerpt ? 'border-red-500' : ''}
              />
              {errors.excerpt && <p className="text-red-500 text-sm">{errors.excerpt}</p>}
              <p className="text-xs text-muted-foreground">{formData.excerpt.length}/160 characters</p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Enter blog content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={10}
                className={errors.content ? 'border-red-500' : ''}
              />
              {errors.content && <p className="text-red-500 text-sm">{errors.content}</p>}
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="featured">Featured Post</Label>
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => handleInputChange('featured', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags *</CardTitle>
            <CardDescription>Add tags to categorize your blog post</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter tag"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.tags && <p className="text-red-500 text-sm">{errors.tags}</p>}
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-2">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Optimize your blog post for search engines</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSeoPreview(!showSeoPreview)}
              >
                {showSeoPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showSeoPreview && (
              <div className="border rounded p-4 bg-muted/50 space-y-2">
                <h4 className="font-semibold text-blue-600">{formData.seo.metaTitle || 'Blog Title'}</h4>
                <p className="text-green-600 text-sm">yoursite.com › blog › post</p>
                <p className="text-gray-600 text-sm">{formData.seo.metaDescription || 'Description preview...'}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                placeholder="Enter meta title"
                value={formData.seo.metaTitle}
                onChange={(e) => handleSeoChange('metaTitle', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{formData.seo.metaTitle.length}/60 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                placeholder="Enter meta description"
                value={formData.seo.metaDescription}
                onChange={(e) => handleSeoChange('metaDescription', e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{formData.seo.metaDescription.length}/160 characters</p>
            </div>

            <div className="space-y-2">
              <Label>Keywords</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter keyword"
                  value={currentKeyword}
                  onChange={(e) => setCurrentKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddKeyword} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.seo.keywords.map((keyword) => (
                  <Badge key={keyword} variant="outline" className="gap-2">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/blogs')}
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
              'Update Blog Post'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default EditBlogPage;
