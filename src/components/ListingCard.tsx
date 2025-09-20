import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, User, CheckCircle } from 'lucide-react';
import { Listing } from '../types';

interface ListingCardProps {
  listing: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const isExpiringSoon = () => {
    const now = new Date();
    const expiry = new Date(listing.expiresAt);
    const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry < 24 && hoursUntilExpiry > 0;
  };

  const isExpired = () => {
    const now = new Date();
    const expiry = new Date(listing.expiresAt);
    return now > expiry;
  };

  const getTimeUntilExpiry = () => {
    const now = new Date();
    const expiry = new Date(listing.expiresAt);
    const diffInMs = expiry.getTime() - now.getTime();
    
    if (diffInMs < 0) return 'Expired';
    
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} left`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else {
      return `${minutes}m left`;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      food: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      books: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      electronics: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      furniture: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      clothing: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <Link to={`/listings/${listing.id}`}>
        <div className="relative">
          <img
            src={listing.imageUrl || 'https://images.pexels.com/photos/8556449/pexels-photo-8556449.jpeg?auto=compress&cs=tinysrgb&w=400'}
            alt={listing.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2">
            {listing.status === 'claimed' ? (
              <div className="bg-green-600 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Claimed</span>
              </div>
            ) : isExpired() ? (
              <div className="bg-red-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                Expired
              </div>
            ) : isExpiringSoon() ? (
              <div className="bg-yellow-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                Ending Soon
              </div>
            ) : (
              <div className="bg-green-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                Available
              </div>
            )}
          </div>
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getCategoryColor(listing.category)}`}>
              {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/listings/${listing.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-green-600 dark:hover:text-green-400 transition-colors">
            {listing.title}
          </h3>
        </Link>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
          {listing.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <User className="h-4 w-4 mr-1" />
            <span>{listing.createdByName}</span>
          </div>

          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{listing.campus}</span>
          </div>

          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4 mr-1" />
            <span className={isExpiringSoon() || isExpired() ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
              {getTimeUntilExpiry()}
            </span>
          </div>
        </div>

        {listing.status === 'available' && !isExpired() && (
          <Link
            to={`/listings/${listing.id}`}
            className="mt-4 block w-full bg-green-600 text-white text-center py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            View Details
          </Link>
        )}

        {listing.status === 'claimed' && (
          <div className="mt-4 text-center py-2 text-sm text-gray-500 dark:text-gray-400">
            Claimed by {listing.claimedByName}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingCard;