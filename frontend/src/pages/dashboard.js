import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { videosApi, profileApi } from '@/lib/api';
import { 
  Video, Upload, LogOut, User, Settings, 
  CheckCircle, Clock, XCircle, Loader, 
  RefreshCw, AlertCircle, ExternalLink, 
  TrendingUp, Film, Calendar, AlertTriangle
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState(null);
  const [tiktokProfile, setTiktokProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tokenStatus, setTokenStatus] = useState(null);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch data
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [videosRes, statsRes, profileRes] = await Promise.all([
        videosApi.getVideos({ limit: 10 }),
        videosApi.getStats(),
        profileApi.getCachedTikTokProfile()
      ]);
      
      if (videosRes.data?.success) {
        setVideos(videosRes.data.data.videos || []);
      }
      
      if (statsRes.data?.success) {
        setStats(statsRes.data.data.stats);
      }
      
      if (profileRes.data?.success) {
        setTiktokProfile(profileRes.data.data.profile);
        setTokenStatus(profileRes.data.data.tokenStatus);
      }
    } catch (err) {
      console.error('Fetch data error:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    setRefreshing(true);
    try {
      const response = await profileApi.getCachedTikTokProfile();
      if (response.data?.success) {
        setTokenStatus(response.data.data.tokenStatus);
      }
    } catch (err) {
      console.error('Refresh token status error:', err);
    }
    setRefreshing(false);
  };

  const formatTimeRemaining = (expiresAt) => {
    if (!expiresAt) return 'Unknown';
    const expires = new Date(expiresAt).getTime();
    const now = Date.now();
    const diff = expires - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} left`;
    }
    return `${hours}h ${minutes}m left`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout(false);
    router.push('/login');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
      case 'uploading':
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      published: 'status-published',
      pending: 'status-pending',
      uploading: 'status-uploading',
      processing: 'status-processing',
      failed: 'status-failed'
    };
    return classes[status] || 'status-pending';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Dashboard - PM3K</title>
      </Head>
      
      <div className="min-h-screen bg-dark-400">
        {/* Header */}
        <header className="bg-dark-300 border-b border-gray-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-pink-500 rounded-xl flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold gradient-text">PM3K</span>
                </Link>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                
                <Link 
                  href="/upload"
                  className="btn-tiktok flex items-center gap-2 text-sm py-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Video
                </Link>
                
                <div className="flex items-center gap-3">
                  {user?.tiktok?.avatar_url && (
                    <img 
                      src={user.tiktok.avatar_url} 
                      alt="Avatar"
                      className="w-8 h-8 rounded-full border-2 border-primary-500"
                    />
                  )}
                  <span className="text-sm text-gray-300">{user?.username || 'User'}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-dark-200 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Sandbox Limitation Notice */}
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 text-sm font-medium">TikTok Sandbox Mode</p>
              <p className="text-gray-400 text-xs mt-1">
                You are in sandbox environment. Videos are uploaded to your sandbox account only. 
                Sandbox tokens expire after 24 hours - refresh before uploading new videos.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* TikTok Profile Card */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-primary-400" />
                TikTok Profile
              </h2>
              <div className="flex items-center gap-2">
                {tokenStatus && !tokenStatus.isExpired && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeRemaining(tokenStatus.expiresAt)}
                  </span>
                )}
                {tokenStatus?.isExpired && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Token Expired
                  </span>
                )}
                <button
                  onClick={handleRefreshToken}
                  disabled={refreshing}
                  className="p-1.5 hover:bg-dark-200 rounded-lg transition-colors text-gray-400 hover:text-primary-400"
                  title="Refresh token status"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            
            {tiktokProfile ? (
              <div className="flex items-center gap-6">
                {tiktokProfile.avatar_url ? (
                  <img 
                    src={tiktokProfile.avatar_url} 
                    alt={tiktokProfile.display_name}
                    className="w-20 h-20 rounded-full border-2 border-primary-500"
                  />
                ) : (
                  <div className="w-20 h-20 bg-dark-300 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-gray-500" />
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold">{tiktokProfile.display_name || 'TikTok User'}</h3>
                    {tokenStatus?.hasToken && !tokenStatus?.isExpired ? (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Needs Refresh
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mb-3">{tiktokProfile.bio || 'No bio'}</p>
                  
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold">{tiktokProfile.follower_count?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{tiktokProfile.following_count?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500">Following</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{tiktokProfile.video_count?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500">Videos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{tiktokProfile.likes_count?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500">Likes</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No TikTok profile data available</p>
                <p className="text-gray-500 text-sm">Please reconnect your TikTok account</p>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                  <Film className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-sm text-gray-500">Total Videos</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.byStatus?.published || 0}</p>
                  <p className="text-sm text-gray-500">Published</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Loader className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {(stats?.byStatus?.pending || 0) + (stats?.byStatus?.processing || 0) + (stats?.byStatus?.uploading || 0)}
                  </p>
                  <p className="text-sm text-gray-500">Processing</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.byStatus?.failed || 0}</p>
                  <p className="text-sm text-gray-500">Failed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Videos */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Video className="w-5 h-5 text-primary-400" />
                Recent Videos
              </h2>
              <Link 
                href="/videos"
                className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                View All
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
            
            {videos.length > 0 ? (
              <div className="space-y-4">
                {videos.map((video) => (
                  <div 
                    key={video.id}
                    className="flex items-center gap-4 p-4 bg-dark-300 rounded-xl hover:bg-dark-100 transition-colors"
                  >
                    <div className="w-16 h-16 bg-dark-400 rounded-lg flex items-center justify-center overflow-hidden">
                      {video.localFile?.filename ? (
                        <Video className="w-8 h-8 text-gray-600" />
                      ) : (
                        <Video className="w-8 h-8 text-gray-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{video.title}</h3>
                      <p className="text-sm text-gray-500 truncate">
                        {video.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {new Date(video.createdAt).toLocaleDateString()}
                        {video.localFile?.size && (
                          <>
                            <span>•</span>
                            {(video.localFile.size / (1024 * 1024)).toFixed(2)} MB
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`status-badge ${getStatusBadge(video.status)} flex items-center gap-1`}>
                        {getStatusIcon(video.status)}
                        {video.status}
                      </span>
                      
                      {video.tiktok?.share_url && (
                        <a
                          href={video.tiktok.share_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
                          title="View on TikTok"
                        >
                          <ExternalLink className="w-4 h-4 text-primary-400" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No videos uploaded yet</p>
                <Link href="/upload" className="btn-primary inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Your First Video
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
