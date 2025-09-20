import axios, { AxiosInstance } from 'axios';
import { Listing, Category, User } from '../types';
import { authService } from './authService';
import { s3Service } from './s3Service';
import { env } from '../config/aws';
import { v4 as uuidv4 } from 'uuid';

export interface CreateListingData {
  title: string;
  description: string;
  category: Category;
  expiresAt?: string;
  image?: File | null;
}

export interface ListingFilters {
  category?: Category;
  campus?: string;
  status?: 'available' | 'claimed' | 'expired';
  search?: string;
  limit?: number;
  offset?: number;
}

class ListingService {
  private api: AxiosInstance;
  private fallbackData: Listing[] = []; // Fallback mock data for development

  constructor() {
    this.api = axios.create({
      baseURL: env.AWS_API_GATEWAY_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await authService.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Try to refresh token
          try {
            await authService.refreshSession();
            // Retry the original request
            const token = await authService.getAuthToken();
            if (token) {
              error.config.headers.Authorization = `Bearer ${token}`;
              return this.api.request(error.config);
            }
          } catch (refreshError) {
            // Redirect to login if refresh fails
            await authService.logout();
            window.location.href = '/auth';
          }
        }
        return Promise.reject(error);
      }
    );

    // Initialize fallback data for development
    this.initializeFallbackData();
  }

  private initializeFallbackData(): void {
    this.fallbackData = [
      {
        id: '1',
        title: 'Calculus Textbook - Stewart 8th Edition',
        description: 'Used calculus textbook in excellent condition. All pages intact, minimal highlighting. Perfect for MATH 101/102 courses.',
        category: 'books',
        campus: 'Main Campus',
        imageUrl: 'https://images.pexels.com/photos/256455/pexels-photo-256455.jpeg?auto=compress&cs=tinysrgb&w=800',
        createdBy: '2',
        createdByName: 'Jane Smith',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'available'
      },
      {
        id: '2',
        title: 'Study Desk Lamp - LED',
        description: 'Adjustable LED desk lamp with multiple brightness settings. Great for late-night study sessions.',
        category: 'electronics',
        campus: 'North Campus',
        imageUrl: 'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=800',
        createdBy: '3',
        createdByName: 'Mike Johnson',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'available'
      },
      {
        id: '3',
        title: 'Surplus Pizza from Event',
        description: 'Leftover pizza from student organization event. 3 large pepperoni pizzas, still warm! Pick up from student center.',
        category: 'food',
        campus: 'Main Campus',
        imageUrl: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800',
        createdBy: '1',
        createdByName: 'John Doe',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        status: 'available'
      }
    ];
  }

  /**
   * Get all listings with optional filtering
   */
  async getListings(filters: ListingFilters = {}): Promise<Listing[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.campus) params.append('campus', filters.campus);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const response = await this.api.get(`/listings?${params.toString()}`);
      return response.data.items || response.data;
    } catch (error) {
      console.error('Failed to fetch listings from API, using fallback data:', error);
      
      // Apply filters to fallback data
      let filteredData = this.fallbackData.filter(listing => {
        if (filters.status && listing.status !== filters.status) return false;
        if (filters.category && listing.category !== filters.category) return false;
        if (filters.campus && listing.campus !== filters.campus) return false;
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          return (
            listing.title.toLowerCase().includes(searchTerm) ||
            listing.description.toLowerCase().includes(searchTerm) ||
            listing.createdByName.toLowerCase().includes(searchTerm)
          );
        }
        return true;
      });

      // Apply pagination
      if (filters.offset && filters.limit) {
        filteredData = filteredData.slice(filters.offset, filters.offset + filters.limit);
      } else if (filters.limit) {
        filteredData = filteredData.slice(0, filters.limit);
      }

      return filteredData;
    }
  }

  /**
   * Get a specific listing by ID
   */
  async getListingById(id: string): Promise<Listing | null> {
    try {
      const response = await this.api.get(`/listings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch listing from API, using fallback data:', error);
      return this.fallbackData.find(listing => listing.id === id) || null;
    }
  }

  /**
   * Create a new listing
   */
  async createListing(data: CreateListingData): Promise<Listing> {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Must be authenticated to create listing');
    }

    try {
      let imageUrl: string | undefined;

      // Upload image if provided
      if (data.image) {
        const uploadResult = await s3Service.uploadFile(data.image, 'listings');
        imageUrl = uploadResult.url;
      }

      const listingData = {
        title: data.title,
        description: data.description,
        category: data.category,
        campus: currentUser.campus,
        imageUrl,
        expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
        createdBy: currentUser.id,
        createdByName: currentUser.name
      };

      const response = await this.api.post('/listings', listingData);
      return response.data;
    } catch (error) {
      console.error('Failed to create listing via API, using fallback:', error);
      
      // Fallback creation for development
      const newListing: Listing = {
        id: uuidv4(),
        title: data.title,
        description: data.description,
        category: data.category,
        campus: currentUser.campus,
        imageUrl: data.image ? URL.createObjectURL(data.image) : undefined,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        createdAt: new Date().toISOString(),
        expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'available'
      };

      this.fallbackData.unshift(newListing);
      return newListing;
    }
  }

  /**
   * Update a listing
   */
  async updateListing(id: string, updates: Partial<CreateListingData>): Promise<Listing> {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Must be authenticated to update listing');
    }

    try {
      let imageUrl: string | undefined;

      // Upload new image if provided
      if (updates.image) {
        const uploadResult = await s3Service.uploadFile(updates.image, 'listings');
        imageUrl = uploadResult.url;
      }

      const updateData = {
        ...updates,
        imageUrl: imageUrl || undefined,
        image: undefined // Remove file object from API call
      };

      const response = await this.api.put(`/listings/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update listing via API:', error);
      throw new Error('Failed to update listing');
    }
  }

  /**
   * Delete a listing
   */
  async deleteListing(id: string): Promise<void> {
    try {
      await this.api.delete(`/listings/${id}`);
    } catch (error) {
      console.error('Failed to delete listing via API, using fallback:', error);
      
      // Fallback deletion for development
      this.fallbackData = this.fallbackData.filter(listing => listing.id !== id);
    }
  }

  /**
   * Claim a listing
   */
  async claimListing(id: string): Promise<Listing> {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Must be authenticated to claim listing');
    }

    try {
      const response = await this.api.post(`/listings/${id}/claim`);
      return response.data;
    } catch (error) {
      console.error('Failed to claim listing via API:', error);
      throw new Error('Failed to claim listing');
    }
  }

  /**
   * Get listings created by a specific user
   */
  async getUserListings(userId: string): Promise<Listing[]> {
    try {
      const response = await this.api.get(`/users/${userId}/listings`);
      return response.data.items || response.data;
    } catch (error) {
      console.error('Failed to fetch user listings from API, using fallback data:', error);
      return this.fallbackData.filter(listing => listing.createdBy === userId);
    }
  }

  /**
   * Get listings by category
   */
  async getListingsByCategory(category: Category): Promise<Listing[]> {
    return this.getListings({ category });
  }

  /**
   * Get listings by campus
   */
  async getListingsByCampus(campus: string): Promise<Listing[]> {
    return this.getListings({ campus });
  }

  /**
   * Search listings
   */
  async searchListings(query: string): Promise<Listing[]> {
    return this.getListings({ search: query });
  }

  /**
   * Get expired listings (for cleanup)
   */
  async getExpiredListings(): Promise<Listing[]> {
    try {
      const response = await this.api.get('/listings/expired');
      return response.data.items || response.data;
    } catch (error) {
      console.error('Failed to fetch expired listings:', error);
      
      // Check fallback data for expired items
      const now = new Date();
      return this.fallbackData.filter(listing => new Date(listing.expiresAt) < now);
    }
  }

  /**
   * Get stats for dashboard
   */
  async getListingStats(userId?: string): Promise<any> {
    try {
      const endpoint = userId ? `/users/${userId}/stats` : '/stats';
      const response = await this.api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch listing stats:', error);
      
      // Return basic stats from fallback data
      const totalListings = this.fallbackData.length;
      const activeListings = this.fallbackData.filter(l => l.status === 'available').length;
      const claimedListings = this.fallbackData.filter(l => l.status === 'claimed').length;
      
      return {
        totalListings,
        activeListings,
        claimedListings,
        categories: {
          food: this.fallbackData.filter(l => l.category === 'food').length,
          books: this.fallbackData.filter(l => l.category === 'books').length,
          electronics: this.fallbackData.filter(l => l.category === 'electronics').length,
          furniture: this.fallbackData.filter(l => l.category === 'furniture').length,
          clothing: this.fallbackData.filter(l => l.category === 'clothing').length,
          other: this.fallbackData.filter(l => l.category === 'other').length
        }
      };
    }
  }
}

export const listingService = new ListingService();