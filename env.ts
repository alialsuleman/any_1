

export const PORT: number = process.env.PORT ? +process.env.PORT : 3030;
export const MONGO_URI: string = process.env.MONGO_URI ? process.env.MONGO_URI : "mongodb://localhost:27017/RentalApplication";
export const JWT_SECRET: string = process.env.JWT_SECRET ? process.env.JWT_SECRET : "any";
export const JWT_LIFETIME: number = process.env.JWT_LIFETIME ? +process.env.JWT_LIFETIME : 30 * 60 * 1000;
//process.env.MONGO_URI ? process.env.MONGO_URI : "mongodb://localhost:27017/RentalApplication"
