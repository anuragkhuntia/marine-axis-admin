/**
 * Mock Data Service
 * Provides fallback data when API is unavailable
 * Used for development and graceful degradation
 */

import { Analytics, Provider, Job, Blog, Approval } from '../types';

export const MOCK_ANALYTICS: Analytics = {
  totalProviders: 24,
  totalJobs: 12,
  totalBlogs: 8,
  totalUsers: 156,
  pendingApprovals: 3,
  activeJobs: 9,
  featuredProviders: 5,
  publishedBlogs: 7,
  monthlyStats: {
    providers: 3,
    jobs: 2,
    blogs: 1,
    applications: 25,
  },
  categoryStats: [
    { category: 'Marine Equipment', count: 4 },
    { category: 'Boat Maintenance', count: 3 },
    { category: 'Navigation & Electronics', count: 2 },
    { category: 'Safety Services', count: 2 },
    { category: 'Marina Services', count: 1 },
  ],
  topLocations: [
    { location: 'Miami, FL', count: 5 },
    { location: 'San Diego, CA', count: 4 },
    { location: 'Boston, MA', count: 3 },
    { location: 'Seattle, WA', count: 2 },
  ],
  recentActivity: [
    {
      id: '1',
      type: 'provider_created',
      title: 'New provider registered: Pacific Marine Solutions',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'job_created',
      title: 'New job posted: Marine Engineer',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      type: 'approval_pending',
      title: 'Approval required: Provider document verification',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
};

export const MOCK_PROVIDERS: Provider[] = [
  {
    id: '1',
    name: 'Pacific Marine Solutions',
    email: 'info@pacificmarine.com',
    phone: '+1-206-555-0123',
    website: 'https://pacificmarine.com',
    description: 'Leading provider of marine equipment and services in the Pacific Northwest.',
    location: 'Seattle, WA',
    verified: true,
    status: 'active',
    rating: 4.8,
    reviews: 24,
    services: ['Equipment Supply', 'Maintenance', 'Repair'],
    employees: '25-50',
    experience: '15 years',
    categories: ['1', '2'],
    logo: 'https://via.placeholder.com/200?text=Pacific+Marine',
    address: {
      street: '123 Marine Ave',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      country: 'USA',
    },
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: '2',
    name: 'Ocean Tech Services',
    email: 'contact@oceantech.com',
    phone: '+1-619-555-0456',
    website: 'https://oceantech.com',
    description: 'Specialized in marine electronics and navigation systems.',
    location: 'San Diego, CA',
    verified: true,
    status: 'active',
    rating: 4.6,
    reviews: 18,
    services: ['Electronics Installation', 'Navigation Systems', 'GPS Setup'],
    employees: '10-25',
    experience: '8 years',
    categories: ['3'],
    logo: 'https://via.placeholder.com/200?text=Ocean+Tech',
    address: {
      street: '456 Harbor Blvd',
      city: 'San Diego',
      state: 'CA',
      zipCode: '92101',
      country: 'USA',
    },
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z',
  },
];

export const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Marine Engineer',
    description: 'Experienced marine engineer for luxury yacht maintenance and repair.',
    providerId: '1',
    categoryIds: ['1', '2'],
    location: 'Miami, FL',
    salaryRange: { min: 75000, max: 95000, currency: 'USD' },
    requirements: ['5+ years experience', 'Marine engineering degree', 'Valid certifications'],
    benefits: ['Health insurance', '401k', 'Paid vacation'],
    type: 'full-time',
    remote: false,
    urgency: 'medium',
    status: 'published',
    expiresAt: '2024-03-15T00:00:00Z',
    applications: 12,
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-22T00:00:00Z',
  },
  {
    id: '2',
    title: 'Boat Captain',
    description: 'Looking for experienced boat captain for charter services.',
    providerId: '2',
    categoryIds: ['5'],
    location: 'San Diego, CA',
    salaryRange: { min: 60000, max: 80000, currency: 'USD' },
    requirements: ['Captain license', '10+ years experience', 'Clean record'],
    benefits: ['Competitive salary', 'Tips', 'Flexible schedule'],
    type: 'full-time',
    remote: false,
    urgency: 'high',
    status: 'published',
    expiresAt: '2024-02-28T00:00:00Z',
    applications: 8,
    createdAt: '2024-01-18T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z',
  },
];

export const MOCK_BLOGS: Blog[] = [
  {
    id: '1',
    title: 'Top 5 Marine Safety Tips for 2024',
    slug: 'top-5-marine-safety-tips-2024',
    content: 'Essential safety practices for marine operations...',
    excerpt: 'Learn the top 5 safety tips every marine operator should know.',
    author: 'John Smith',
    status: 'published',
    featured: true,
    category: 'Safety',
    tags: ['safety', 'marine', 'best-practices'],
    image: 'https://via.placeholder.com/800x400?text=Marine+Safety',
    gallery: [],
    views: 1234,
    publishedAt: '2024-01-20T00:00:00Z',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: '2',
    title: 'Marine Equipment Maintenance Guide',
    slug: 'marine-equipment-maintenance-guide',
    content: 'Complete guide to maintaining your marine equipment...',
    excerpt: 'Comprehensive maintenance tips for all types of marine equipment.',
    author: 'Sarah Johnson',
    status: 'published',
    featured: false,
    category: 'Maintenance',
    tags: ['maintenance', 'equipment', 'guides'],
    image: 'https://via.placeholder.com/800x400?text=Equipment+Maintenance',
    gallery: [],
    views: 856,
    publishedAt: '2024-01-15T00:00:00Z',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
];

export const MOCK_APPROVALS: Approval[] = [
  {
    id: '1',
    type: 'provider',
    title: 'Pacific Marine Solutions - Provider Approval',
    description: 'Provider registration and document verification',
    status: 'pending',
    submittedAt: '2024-01-25T10:30:00Z',
    submittedBy: 'John Smith',
    details: {
      companyName: 'Pacific Marine Solutions',
      location: 'Seattle, WA',
      services: ['Equipment Supply', 'Maintenance'],
    },
  },
  {
    id: '2',
    type: 'job',
    title: 'Marine Engineer Job - Content Review',
    description: 'Job posting verification',
    status: 'pending',
    submittedAt: '2024-01-24T14:00:00Z',
    submittedBy: 'Sarah Johnson',
    details: {
      jobTitle: 'Marine Engineer',
      location: 'Miami, FL',
    },
  },
];

export const MOCK_COUNTRIES = [
  'USA',
  'Canada',
  'United Kingdom',
  'Australia',
  'Norway',
  'Denmark',
  'Germany',
  'Netherlands',
  'Singapore',
  'Japan',
  'China',
  'India',
  'Brazil',
  'Mexico',
  'Others',
];

export const MOCK_CATEGORIES = [
  { id: '1', name: 'Marine Equipment', description: 'Marine equipment and supplies' },
  { id: '2', name: 'Boat Maintenance', description: 'Maintenance and repair services' },
  { id: '3', name: 'Electronics & Navigation', description: 'Navigation systems and electronics' },
  { id: '4', name: 'Safety Services', description: 'Marine safety services' },
  { id: '5', name: 'Marina Services', description: 'Marina and dock services' },
  { id: '6', name: 'Crew Services', description: 'Crew recruitment and training' },
];

export const MOCK_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'SGD' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
];

/**
 * Generate paginated response from mock data
 */
export function generatePaginatedResponse<T>(
  items: T[],
  page: number = 1,
  limit: number = 25
) {
  const start = (page - 1) * limit;
  const end = start + limit;
  const data = items.slice(start, end);
  const total = items.length;
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    message: 'Retrieved successfully (mock data)',
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
