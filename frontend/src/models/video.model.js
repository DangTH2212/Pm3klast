import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  tiktok: {
    publish_id: { type: String, index: true },
    share_url: { type: String },
    video_id: { type: String }
  },
  
  title: { type: String, required: true, maxlength: 2200, trim: true },
  description: { type: String, maxlength: 2200, default: '' },
  tags: [{ type: String, trim: true, maxlength: 30 }],
  
  localFile: {
    filename: { type: String },
    originalName: { type: String },
    path: { type: String },
    size: { type: Number },
    mimeType: { type: String }
  },
  
  status: {
    type: String,
    enum: ['pending', 'uploading', 'processing', 'published', 'failed'],
    default: 'pending',
    index: true
  },
  
  postSettings: {
    privacy_level: { type: String, enum: ['PUBLIC', 'SELF_ONLY', 'FOLLOWERS_ONLY'], default: 'PUBLIC' },
    disable_comment: { type: Boolean, default: false },
    disable_share: { type: Boolean, default: false },
    creation_id: { type: String }
  },
  
  apiResponse: { type: mongoose.Schema.Types.Mixed, select: false },
  
  error: {
    message: String,
    code: String,
    retryCount: { type: Number, default: 0 },
    lastRetryAt: Date
  },
  
  publishedAt: Date,
  
  statusHistory: [{
    status: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ userId: 1, status: 1 });

videoSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({ status: this.status, message: `Status changed to ${this.status}`, timestamp: new Date() });
  }
  next();
});

videoSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.apiResponse;
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

export default mongoose.models.Video || mongoose.model('Video', videoSchema);
