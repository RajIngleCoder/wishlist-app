export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currency?: string;
};

export type WishList = {
  id: string;
  name: string;
  description?: string;
  type: 'personal' | 'group' | 'event';
  visibility: 'private' | 'public' | 'shared';
  collaborators?: string[];
  tags?: string[];
  category?: string;
  imageUrl?: string;
  createdAt: string;
  userId: string;
  shareId?: string;
  lastModified?: string;
  modifiedBy?: string;
};

export type Wish = {
  id: string;
  title: string;
  description: string;
  price: string;
  priority: 'low' | 'medium' | 'high';
  link?: string;
  imageUrl?: string;
  listId?: string;
  tags?: string[];
  category?: string;
  createdAt: string;
  userId: string;
  status: 'active' | 'reserved' | 'purchased';
  source?: 'manual' | 'amazon' | 'etsy' | 'other';
  metadata?: {
    brand?: string;
    rating?: number;
    reviews?: number;
    availability?: string;
    originalPrice?: string;
  };
  isFavorite?: boolean;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string | null | undefined;
  url?: string;
  source: string;
  rating?: number;
  reviews?: number;
  metadata?: {
    brand?: string;
    availability?: string;
    originalPrice?: string;
    specifications?: Record<string, string>;
  };
};

export type Collaborator = {
  id: string;
  name: string;
  color: string;
  isActive?: boolean;
};
