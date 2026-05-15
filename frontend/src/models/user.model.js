import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  username: { type: String, required: true, unique: true, trim: true },
  
  tiktok: {
    open_id: { type: String, unique: true, sparse: true },
    union_id: { type: String, sparse: true },
    display_name: { type: String, default: '' },
    avatar_url: { type: String, default: '' },
    bio: { type: String, default: '' },
    follower_count: { type: Number, default: 0 },
    following_count: { type: Number, default: 0 },
    video_count: { type: Number, default: 0 },
    likes_count: { type: Number, default: 0 }
  },
  
  tokens: {
    access_token: { type: String, select: false },
    refresh_token: { type: String, select: false },
    token_type: { type: String, default: 'Bearer' },
    expires_at: { type: Date, select: false },
    refresh_expires_at: { type: Date, select: false }
  },
  
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  lastTokenRefresh: { type: Date }
}, { timestamps: true });

userSchema.index({ 'tiktok.open_id': 1 });
userSchema.index({ 'tokens.expires_at': 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) { next(error); }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isTokenExpired = function() {
  if (!this.tokens.expires_at) return true;
  return new Date() >= new Date(this.tokens.expires_at);
};

userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.tokens;
  delete obj.__v;
  return obj;
};

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

export default mongoose.models.User || mongoose.model('User', userSchema);
