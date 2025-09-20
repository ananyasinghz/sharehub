import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { listingService } from '../services/listingService';
import { Listing, Claim } from '../types';
import { User, Plus, Package, Gift, Clock, CheckCircle, XCircle, Calendar, MapPin } from 'lucide-react';
import Loader from '../components/Loader';
import ListingCard from '../components/ListingCard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'listings' | 'claims'>('profile');
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [userClaims, setUserClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalClaims: 0,
    completedClaims: 0
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load user's listings
      const listings = await listingService.getUserListings(user.id);
      setUserListings(listings);
      
      // Load user's claims (mock for now)
      const claims: Claim[] = []; // This would come from a claims service
      setUserClaims(claims);
      
      // Calculate stats
      setStats({
        totalListings: listings.length,
        activeListings: listings.filter(l => l.status === 'available').length,
        totalClaims: claims.length,
        completedClaims: claims.filter(c => c.status === 'completed').length
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await listingService.deleteListing(listingId);
      setUserListings(prev => prev.filter(l => l.id !== listingId));
      showNotification('Listing deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete listing:', error);
      showNotification('Failed to delete listing', 'error');
    }
  };

  if (loading) {
    return <Loader message="Loading your dashboard..." />;
  }

  const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: number; subtitle?: string }> = ({ icon, title, value, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg">
            {icon}
          </div>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{value}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=10b981&color=fff`}
                  alt={user?.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {user?.campus} • Member since {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'recently'}
                </p>
              </div>
            </div>
            <Link
              to="/create-listing"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Share Item
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Package className="w-5 h-5 text-green-600 dark:text-green-400" />}
            title="Total Listings"
            value={stats.totalListings}
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            title="Active Listings"
            value={stats.activeListings}
          />
          <StatCard
            icon={<Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            title="Items Claimed"
            value={stats.totalClaims}
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />}
            title="Completed"
            value={stats.completedClaims}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <User className="w-4 h-4 inline-block mr-2" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('listings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'listings'
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Package className="w-4 h-4 inline-block mr-2" />
                My Listings ({userListings.length})
              </button>
              <button
                onClick={() => setActiveTab('claims')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'claims'
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Gift className="w-4 h-4 inline-block mr-2" />
                My Claims ({userClaims.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Account Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <p className="text-gray-900 dark:text-white">{user?.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <p className="text-gray-900 dark:text-white">{user?.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Campus</label>
                        <p className="text-gray-900 dark:text-white flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                          {user?.campus}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Member Since</label>
                        <p className="text-gray-900 dark:text-white flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                          {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Activity Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Items shared</span>
                        <span className="font-medium text-gray-900 dark:text-white">{stats.totalListings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Items claimed</span>
                        <span className="font-medium text-gray-900 dark:text-white">{stats.totalClaims}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Success rate</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {stats.totalListings > 0 ? Math.round((stats.completedClaims / stats.totalListings) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Your Listings
                  </h3>
                  <Link
                    to="/create-listing"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Listing
                  </Link>
                </div>

                {userListings.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No listings yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Start sharing items with your campus community.
                    </p>
                    <Link
                      to="/create-listing"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Listing
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userListings.map((listing) => (
                      <div key={listing.id} className="relative">
                        <ListingCard listing={listing} showActions={false} />
                        <div className="absolute top-2 right-2 flex space-x-2">
                          <button
                            onClick={() => handleDeleteListing(listing.id)}
                            className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Claims Tab */}
            {activeTab === 'claims' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Your Claims
                </h3>
                
                {userClaims.length === 0 ? (
                  <div className="text-center py-12">
                    <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No claims yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Browse available items to find something you need.
                    </p>
                    <Link
                      to="/listings"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Browse Items
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userClaims.map((claim) => (
                      <div key={claim.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {claim.listingTitle}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Claimed on {new Date(claim.claimedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            claim.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {claim.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
