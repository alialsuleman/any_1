import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
    category: string;
    subject: string;
    description: string;
    attachments?: string[];
    reportedCar: mongoose.Types.ObjectId;
    reporter: mongoose.Types.ObjectId;
    status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
    adminNotes?: string;
    resolvedBy?: mongoose.Types.ObjectId;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ReportSchema = new Schema<IReport>({
    category: {
        type: String,
        enum: [
            'Misleading vehicle information',
            'Fake Listing',
            'Incorrect location',
            'Scam or suspicious activity',
            'Offensive content',
            'Seller behavior'
        ],
        required: [true, 'Please select a category']
    },
    subject: {
        type: String,
        required: [true, 'Please provide a subject'],
        trim: true,
        maxlength: [100, 'Subject cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        trim: true,
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    attachments: {
        type: [String],
        default: [],
        validate: {
            validator: function (v: string[]) {
                return v.length <= 3;
            },
            message: 'Maximum 3 attachments allowed'
        }
    },
    reportedCar: {
        type: Schema.Types.ObjectId,
        ref: 'Car',
        required: [true, 'Please specify the reported car']
    },
    reporter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Reporter ID is required']
    },
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'resolved', 'rejected'],
        default: 'pending'
    },
    adminNotes: {
        type: String,
        trim: true,
        maxlength: [500, 'Admin notes cannot be more than 500 characters']
    },
    resolvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for better query performance
ReportSchema.index({ reportedCar: 1, status: 1 });
ReportSchema.index({ reporter: 1, createdAt: -1 });
ReportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IReport>('Report', ReportSchema);