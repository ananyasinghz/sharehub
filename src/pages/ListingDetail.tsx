import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, MapPin, User, CheckCircle, ArrowLeft, Share2 } from 'lucide-react';
import { listingService } from '../services/listingService';
import { Listing } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Loader from '../components/Loader';

const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotification();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (id) {
      fetchListing(id);
    }
  }, [id]);

  const fetchListing = async (listingId: string) => {
    try {
      const data = await listingService.getListingById(listingId);
      setListing(data);
    } catch (error) {
      console.error('Failed to fetch listing:', error);
      addNotification({
        type: 'error',
        message: 'Failed to load listing details'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!listing || !user) return;

    if (!isAuthenticated) {
      addNotification({
        type: 'warning',
        message: 'Please sign in to claim items'
      });
      navigate('/auth');
      return;
    }

    if (listing.createdBy === user.id) {
      addNotification({
        type: 'warning',
        message: 'You cannot claim your own listing'
      });
      return;
    }

    setClaiming(true);
    try {
      const updatedListing = await listingService.claimListing(listing.id, user.id, user.name);
      setListing(updatedListing);
      addNotification({
        type: 'success',
        message: 'Item claimed successfully! Contact the owner to arrange pickup.'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to claim item. Please try again.'
      });
    } finally {
      setClaiming(false);
    }
  };

  const isExpired = () => {
    if (!listing) return false;
    const now = new Date();
    const expiry = new Date(listing.expiresAt);
    return now > expiry;
  };

  const isExpiringSoon = () => {
    if (!listing) return false;
    const now = new Date();
    const expiry = new Date(listing.expiresAt);
    const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry < 24 && hoursUntilExpiry > 0;
  };

  const getTimeUntilExpiry = () => {
    if (!listing) return '';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading listing details..." />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Listing not found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The item you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/listings"
              className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Image */}
          <div className="relative h-64 md:h-96">
            <img
              src={listing.imageUrl || 'https://images.pexels.com/photos/8556449/pexels-photo-8556449.jpeg?auto=compress&cs=tinysrgb&w=800'}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4">
              {listing.status === 'claimed' ? (
                <div className="bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Claimed</span>
                </div>
              ) : isExpired() ? (
                <div className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                  Expired
                </div>
              ) : isExpiringSoon() ? (
                <div className="bg-yellow-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                  Ending Soon
                </div>
              ) : (
                <div className="bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                  Available
                </div>
              )}
            </div>
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-md text-sm font-medium ${getCategoryColor(listing.category)}`}>
                {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {listing.title}
                </h1>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <User className="h-5 w-5 mr-2" />
                    <span>Shared by {listing.createdByName}</span>
                  </div>

                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{listing.campus}</span>
                  </div>

                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="h-5 w-5 mr-2" />
                    <span className={isExpiringSoon() || isExpired() ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                      {getTimeUntilExpiry()}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Description
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {listing.description}
                  </p>
                </div>

                {listing.status === 'claimed' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                      <div>
                        <p className="text-green-800 dark:text-green-200 font-medium">
                          This item has been claimed
                        </p>
                        <p className="text-green-700 dark:text-green-300 text-sm">
                          Claimed by {listing.claimedByName} on {new Date(listing.claimedAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Panel */}
              <div className="lg:w-80">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Item Details
                  </h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Category:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Campus:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {listing.campus}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Posted:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`font-medium ${
                        listing.status === 'available' ? 'text-green-600 dark:text-green-400' :
                        listing.status === 'claimed' ? 'text-blue-600 dark:text-blue-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {listing.status === 'available' && !isExpired() && (
                    <button
                      onClick={handleClaim}
                      disabled={claiming || (user && listing.createdBy === user.id)}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {claiming ? 'Claiming...' : 
                       user && listing.createdBy === user.id ? 'Your Item' : 
                       'Claim This Item'}
                    </button>
                  )}

                  {!isAuthenticated && listing.status === 'available' && !isExpired() && (
                    <Link
                      to="/auth"
                      className="block w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 transition-colors text-center"
                    >
                      Sign In to Claim
                    </Link>
                  )}

                  {(listing.status === 'claimed' || isExpired()) && (
                    <div className="text-center py-3 text-gray-500 dark:text-gray-400">
                      {listing.status === 'claimed' ? 'Item has been claimed' : 'Item has expired'}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: listing.title,
                            text: listing.description,
                            url: window.location.href,
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          addNotification({
                            type: 'success',
                            message: 'Link copied to clipboard!'
                          });
                        }
                      }}
                      className="w-full flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share this item</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;