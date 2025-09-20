import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { listingService } from '../services/listingService';
import { Claim, Listing } from '../types';
import { 
  Gift, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar, 
  MapPin, 
  Package,
  ArrowLeft,
  MessageCircle,
  Star
} from 'lucide-react';
import Loader from '../components/Loader';

const Claims: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<(Claim & { listing: Listing })[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    if (user) {
      loadClaims();
    }
  }, [user]);

  const loadClaims = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Mock claims data - in real app, this would come from an API
      const mockClaims: (Claim & { listing: Listing })[] = [
        {
          id: '1',
          listingId: '1',
          listingTitle: 'Calculus Textbook',
          claimedBy: user.id,
          claimedByName: user.name,
          claimedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          listing: {
            id: '1',
            title: 'Calculus Textbook',
            description: 'Stewart Calculus 8th edition, barely used',
            category: 'books',
            campus: user.campus,
            imageUrl: 'https://images.pexels.com/photos/256455/pexels-photo-256455.jpeg',
            createdBy: '2',
            createdByName: 'Jane Smith',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'claimed',
            claimedBy: user.id,
            claimedByName: user.name,
            claimedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        },
        {
          id: '2',
          listingId: '2',
          listingTitle: 'Study Desk Lamp',
          claimedBy: user.id,
          claimedByName: user.name,
          claimedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          listing: {
            id: '2',
            title: 'Study Desk Lamp',
            description: 'LED desk lamp with adjustable brightness',
            category: 'electronics',
            campus: user.campus,
            imageUrl: 'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg',
            createdBy: '3',
            createdByName: 'Mike Johnson',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'claimed',
            claimedBy: user.id,
            claimedByName: user.name,
            claimedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      ];

      setClaims(mockClaims);
    } catch (error) {
      console.error('Failed to load claims:', error);
      showNotification('Failed to load claims', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClaim = async (claimId: string) => {
    if (!window.confirm('Are you sure you want to cancel this claim?')) {
      return;
    }

    try {
      // In real app, this would make an API call
      setClaims(prev => prev.map(claim => 
        claim.id === claimId ? { ...claim, status: 'cancelled' as const } : claim
      ));
      showNotification('Claim cancelled successfully', 'success');
    } catch (error) {
      console.error('Failed to cancel claim:', error);
      showNotification('Failed to cancel claim', 'error');
    }
  };

  const handleMarkCompleted = async (claimId: string) => {
    try {
      setClaims(prev => prev.map(claim => 
        claim.id === claimId ? { ...claim, status: 'completed' as const } : claim
      ));
      showNotification('Claim marked as completed!', 'success');
    } catch (error) {
      console.error('Failed to mark claim as completed:', error);
      showNotification('Failed to update claim status', 'error');
    }
  };

  if (loading) {
    return <Loader message="Loading your claims..." />;
  }

  const filteredClaims = claims.filter(claim => 
    activeFilter === 'all' || claim.status === activeFilter
  );

  const getStatusBadge = (status: Claim['status']) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: XCircle }
    };

    const { color, icon: Icon } = config[status];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard"
                className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
          </div>
          
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Claims
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track items you've claimed and manage pickup arrangements
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Gift className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{claims.length}</p>
                <p className="text-gray-600 dark:text-gray-400">Total Claims</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {claims.filter(c => c.status === 'pending').length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Pending</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {claims.filter(c => c.status === 'completed').length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {claims.length > 0 ? Math.round((claims.filter(c => c.status === 'completed').length / claims.length) * 100) : 0}%
                </p>
                <p className="text-gray-600 dark:text-gray-400">Success Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {(['all', 'pending', 'completed', 'cancelled'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeFilter === filter
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {filter} ({filter === 'all' ? claims.length : claims.filter(c => c.status === filter).length})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Claims List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          {filteredClaims.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {activeFilter === 'all' ? 'No claims yet' : `No ${activeFilter} claims`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {activeFilter === 'all' 
                  ? 'Start browsing available items to find something you need.'
                  : `You don't have any ${activeFilter} claims at the moment.`
                }
              </p>
              <Link
                to="/listings"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Package className="w-4 h-4 mr-2" />
                Browse Items
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClaims.map((claim) => (
                <div key={claim.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex space-x-4">
                      <div className="flex-shrink-0">
                        <img
                          src={claim.listing.imageUrl || 'https://images.pexels.com/photos/3965548/pexels-photo-3965548.jpeg'}
                          alt={claim.listing.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                            {claim.listing.title}
                          </h3>
                          {getStatusBadge(claim.status)}
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            <span>Shared by {claim.listing.createdByName}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{claim.listing.campus}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Claimed {getTimeAgo(claim.claimedAt)}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 mt-2 text-sm">
                          {claim.listing.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {claim.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleMarkCompleted(claim.id)}
                            className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Complete
                          </button>
                          <button
                            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Contact Owner
                          </button>
                          <button
                            onClick={() => handleCancelClaim(claim.id)}
                            className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel
                          </button>
                        </>
                      )}
                      
                      {claim.status === 'completed' && (
                        <div className="text-center">
                          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-1" />
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                            Successfully received!
                          </p>
                        </div>
                      )}
                      
                      {claim.status === 'cancelled' && (
                        <div className="text-center">
                          <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-1" />
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                            Claim cancelled
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Claims;
