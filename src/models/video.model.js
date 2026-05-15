const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // TikTok publish info
  tiktok: {
    publish_id: {
      type: String,
      index: true
    },
    share_url: {
      type: String
    },
    video_id: {
      type: String
    }
  },
  
  // Video metadata
  title: {
    type: String,
    required: [true, 'Video title is required'],
    maxlength: [2200, 'Title cannot exceed 2200 characters'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [2200, 'Description cannot exceed 2200 characters'],
    default: ''
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  
  // Local file info
  localFile: {
    filename: {
      type: String
    },
    originalName: {
      type: String
    },
    path: {
      type: String
    },
    size: {
      type: Number
    },
    mimeType: {
      type: String
    }
  },
  
  // Upload status
  status: {
    type: String,
    enum: ['pending', 'uploading', 'processing', 'published', 'failed'],
    default: 'pending',
    index: true
  },
  
  // Post settings
  postSettings: {
    privacy_level: {
      type: String,
      enum: ['PUBLIC', 'SELF_ONLY', 'FOLLOWERS_ONLY'],
      default: 'PUBLIC'
    },
    disable_comment: {
      type: Boolean,
      default: false
    },
    disable_share: {
      type: Boolean,
      default: false
    },
    branded_content: {
      type: Boolean,
      default: false
    },
    creation_id: {
      type: String
    }
  },
  
  // Response from TikTok API
  apiResponse: {
    type: mongoose.Schema.Types.Mixed,
    select: false // Don't expose raw API responses
  },
  
  // Error handling
  error: {
    message: String,
    code: String,
    retryCount: {
      type: Number,
      default: 0
    },
    lastRetryAt: Date
  },
  
  // Timestamps
  publishedAt: Date,
  
  // Status history
  statusHistory: [{
    status: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Compound index for user's videos
videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ userId: 1, status: 1 });

// Add status change to history
videoSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      message: `Status changed to ${this.status}`,
      timestamp: new Date()
    });
  }
  next();
});

// Transform output
videoSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.apiResponse;
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model('Video', videoSchema);
