const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Local authentication fields
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  
  // TikTok OAuth fields
  tiktok: {
    open_id: {
      type: String,
      unique: true,
      sparse: true // Allows null values while maintaining uniqueness
    },
    union_id: {
      type: String,
      sparse: true
    },
    display_name: {
      type: String,
      default: ''
    },
    avatar_url: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    follower_count: {
      type: Number,
      default: 0
    },
    following_count: {
      type: Number,
      default: 0
    },
    video_count: {
      type: Number,
      default: 0
    },
    likes_count: {
      type: Number,
      default: 0
    }
  },
  
  // OAuth tokens (stored securely)
  tokens: {
    access_token: {
      type: String,
      select: false // Don't expose in queries
    },
    refresh_token: {
      type: String,
      select: false
    },
    token_type: {
      type: String,
      default: 'Bearer'
    },
    expires_at: {
      type: Date,
      select: false
    },
    refresh_expires_at: {
      type: Date,
      select: false
    }
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  lastLogin: {
    type: Date
  },
  lastTokenRefresh: {
    type: Date
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for faster queries
userSchema.index({ 'tiktok.open_id': 1 });
userSchema.index({ 'tokens.expires_at': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if token is expired
userSchema.methods.isTokenExpired = function() {
  if (!this.tokens.expires_at) return true;
  return new Date() >= new Date(this.tokens.expires_at);
};

// Check if refresh token is expired
userSchema.methods.isRefreshTokenExpired = function() {
  if (!this.tokens.refresh_expires_at) return true;
  return new Date() >= new Date(this.tokens.refresh_expires_at);
};

// Get safe user object (without sensitive data)
userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.tokens;
  delete obj.__v;
  return obj;
};

// Transform output
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.tokens;
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
