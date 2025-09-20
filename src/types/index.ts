export interface User {
  id: string;
  name: string;
  email: string;
  campus: string;
  joinedAt: string;
  avatar?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: Category;
  campus: string;
  imageUrl?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  expiresAt: string;
  status: 'available' | 'claimed' | 'expired';
  claimedBy?: string;
  claimedByName?: string;
  claimedAt?: string;
}

export type Category = 'food' | 'books' | 'electronics' | 'furniture' | 'clothing' | 'other';

export interface Claim {
  id: string;
  listingId: string;
  listingTitle: string;
  claimedBy: string;
  claimedByName: string;
  claimedAt: string;
  status: 'pending' | 'completed' | 'cancelled';
}