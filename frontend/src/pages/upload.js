import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/lib/AuthContext';
import { tiktokApi } from '@/lib/api';
import { 
  Video, Upload, X, AlertCircle, CheckCircle, 
  Loader, ArrowLeft, Lock, Globe, Users,
  MessageSquare, Share2, Settings
} from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, tiktokConnected } = useAuth();
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState('PUBLIC');
  const [disableComment, setDisableComment] = useState(false);
  const [disableShare, setDisableShare] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Check TikTok connection
  useEffect(() => {
    if (isAuthenticated && !tiktokConnected) {
      setError('Please connect your TikTok account first before uploading videos.');
    }
  }, [isAuthenticated, tiktokConnected]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError('File is too large. Maximum size is 50MB.');
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setError('Invalid file type. Only MP4, MOV, AVI, and WebM videos are allowed.');
      } else {
        setError('Failed to accept file. Please try again.');
      }
      return;
    }
    
    if (acceptedFiles.length > 0) {
      const videoFile = acceptedFiles[0];
      setFile(videoFile);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(videoFile);
      setPreview(previewUrl);
      
      // Auto-fill title from filename
      const fileName = videoFile.name.replace(/\.[^/.]+$/, '');
      setTitle(fileName);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
      'video/webm': ['.webm']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false
  });

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setError(null);
    setUploadResult(null);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a video file first.');
      return;
    }

    if (!tiktokConnected) {
      setError('TikTok account not connected. Please logout and login again.');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', title || 'Video from PM3K');
      formData.append('description', description);
      formData.append('privacy_level', privacyLevel);
      formData.append('disable_comment', disableComment);
      formData.append('disable_share', disableShare);

      const response = await tiktokApi.uploadVideo(formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data?.success) {
        setUploadComplete(true);
        setUploadResult(response.data.data);
        setUploadProgress(100);
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      
      let errorMessage = 'Upload failed. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Upload timed out. Please try with a smaller file or check your connection.';
      }
      
      setError(errorMessage);
      setUploading(false);
    }
  };

  const handleReset = () => {
    removeFile();
    setTitle('');
    setDescription('');
    setPrivacyLevel('PUBLIC');
    setDisableComment(false);
    setDisableShare(false);
    setUploading(false);
    setUploadComplete(false);
    setUploadResult(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
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
        <title>Upload Video - PM3K</title>
      </Head>
      
      <div className="min-h-screen bg-dark-400">
        {/* Header */}
        <header className="bg-dark-300 border-b border-gray-800 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <h1 className="text-xl font-bold">Upload Video</h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          {!tiktokConnected && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-3">
              <Lock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-400 text-sm">
                Connect your TikTok account first to upload videos.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm">{error}</p>
                {!tiktokConnected && (
                  <Link href="/login" className="text-primary-400 text-sm hover:underline mt-1 inline-block">
                    Go to login
                  </Link>
                )}
              </div>
            </div>
          )}

          {uploadComplete && uploadResult ? (
            /* Success State */
            <div className="card text-center py-12">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Video Uploaded Successfully!</h2>
              <p className="text-gray-400 mb-6">
                Your video is now being processed by TikTok
              </p>
              
              {uploadResult.shareUrl && (
                <a
                  href={uploadResult.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-tiktok inline-flex items-center gap-2 mb-6"
                >
                  <Video className="w-5 h-5" />
                  View on TikTok
                </a>
              )}
              
              <div className="flex items-center justify-center gap-4">
                <button onClick={handleReset} className="btn-secondary">
                  Upload Another
                </button>
                <Link href="/dashboard" className="btn-primary">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            /* Upload Form */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Video Selection */}
              <div className="lg:col-span-2 space-y-6">
                <div className="card">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary-400" />
                    Select Video
                  </h2>
                  
                  {!file ? (
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
                        isDragActive 
                          ? 'border-primary-500 bg-primary-500/10' 
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="w-16 h-16 bg-dark-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className={`w-8 h-8 ${isDragActive ? 'text-primary-400' : 'text-gray-500'}`} />
                      </div>
                      <p className="text-lg font-medium mb-2">
                        {isDragActive ? 'Drop video here' : 'Drag & drop video here'}
                      </p>
                      <p className="text-gray-500 text-sm mb-4">
                        or click to select file
                      </p>
                      <p className="text-gray-600 text-xs">
                        Supported formats: MP4, MOV, AVI, WebM (Max 50MB)
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      {preview && (
                        <video
                          src={preview}
                          controls
                          className="w-full rounded-xl bg-black max-h-80"
                        />
                      )}
                      <button
                        onClick={removeFile}
                        disabled={uploading}
                        className="absolute top-3 right-3 p-2 bg-dark-500/80 hover:bg-dark-400 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Progress */}
                  {uploading && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Uploading...</span>
                        <span className="text-sm text-primary-400">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-dark-300 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-primary-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Video Details */}
              <div className="space-y-6">
                <div className="card">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary-400" />
                    Video Details
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter video title"
                        maxLength={2200}
                        className="input-field"
                        disabled={uploading}
                      />
                      <p className="text-xs text-gray-600 mt-1 text-right">
                        {title.length}/2200
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your video"
                        maxLength={2200}
                        rows={4}
                        className="input-field resize-none"
                        disabled={uploading}
                      />
                      <p className="text-xs text-gray-600 mt-1 text-right">
                        {description.length}/2200
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary-400" />
                    Privacy Settings
                  </h2>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-dark-300 rounded-xl cursor-pointer hover:bg-dark-100 transition-colors">
                      <input
                        type="radio"
                        name="privacy"
                        value="PUBLIC"
                        checked={privacyLevel === 'PUBLIC'}
                        onChange={() => setPrivacyLevel('PUBLIC')}
                        disabled={uploading}
                        className="w-4 h-4 text-primary-500"
                      />
                      <Globe className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="font-medium">Public</p>
                        <p className="text-xs text-gray-500">Anyone can view</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3 p-3 bg-dark-300 rounded-xl cursor-pointer hover:bg-dark-100 transition-colors">
                      <input
                        type="radio"
                        name="privacy"
                        value="FOLLOWERS_ONLY"
                        checked={privacyLevel === 'FOLLOWERS_ONLY'}
                        onChange={() => setPrivacyLevel('FOLLOWERS_ONLY')}
                        disabled={uploading}
                        className="w-4 h-4 text-primary-500"
                      />
                      <Users className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="font-medium">Followers Only</p>
                        <p className="text-xs text-gray-500">Only followers can view</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3 p-3 bg-dark-300 rounded-xl cursor-pointer hover:bg-dark-100 transition-colors">
                      <input
                        type="radio"
                        name="privacy"
                        value="SELF_ONLY"
                        checked={privacyLevel === 'SELF_ONLY'}
                        onChange={() => setPrivacyLevel('SELF_ONLY')}
                        disabled={uploading}
                        className="w-4 h-4 text-primary-500"
                      />
                      <Lock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Private</p>
                        <p className="text-xs text-gray-500">Only you can view</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="card">
                  <h2 className="text-lg font-semibold mb-4">Interactions</h2>
                  
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-dark-300 rounded-xl cursor-pointer hover:bg-dark-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-gray-400" />
                        <span>Allow Comments</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!disableComment}
                        onChange={(e) => setDisableComment(!e.target.checked)}
                        disabled={uploading}
                        className="w-5 h-5 text-primary-500 rounded"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between p-3 bg-dark-300 rounded-xl cursor-pointer hover:bg-dark-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Share2 className="w-5 h-5 text-gray-400" />
                        <span>Allow Sharing</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!disableShare}
                        onChange={(e) => setDisableShare(!e.target.checked)}
                        disabled={uploading}
                        className="w-5 h-5 text-primary-500 rounded"
                      />
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!file || uploading || !tiktokConnected}
                  className="btn-tiktok w-full py-4 text-lg flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="spinner w-5 h-5"></div>
                      Uploading... {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload to TikTok
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
