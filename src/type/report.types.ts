export interface CreateReportRequest {
    category: string;
    subject: string;
    description: string;
    attachments?: string[];
    carId: string;
}

export interface UpdateReportRequest {
    status?: 'pending' | 'reviewing' | 'resolved' | 'rejected';
    adminNotes?: string;
}

export interface ReportResponse {
    _id: string;
    category: string;
    subject: string;
    description: string;
    attachments: string[];
    reportedCar: {
        _id: string;
        brand: string;
        model: string;
        year: number;
        price: number;
    };
    reporter: {
        _id: string;
        name: string;
        email: string;
    };
    status: string;
    adminNotes?: string;
    resolvedBy?: {
        _id: string;
        name: string;
        email: string;
    };
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface GetReportsQuery {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}