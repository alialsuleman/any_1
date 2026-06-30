

import { Request } from 'express';
declare global {
declare namespace Express {
    export interface Request {
        // For attaching to request
        userId?: string
        user?: string | Object
    }
}
}
export {}



