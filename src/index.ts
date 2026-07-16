import dotenv from 'dotenv'
dotenv.config();
import express from 'express'
import bcrypt from 'bcryptjs';

import { connectDB } from './db/connect'
import { notFound } from './middleware/not-found'
import { errorHandlerMiddleware } from './middleware/error-handler'
import authRoute from './routes/user.route'
import protectedRoutes from './routes/protected.route'
import imgRoutes from './routes/img.route'
import carRoutes from './routes/car.route'
import rentalRoutes from './routes/rental.route'
import buyRoters from './routes/buy.route'
import reportRoutes from './routes/report.route'
import adminUserRoutes from './routes/admin.user.route'
import favoriteRoutes from './routes/favorite.routes';

import cors from 'cors';
import { MONGO_URI } from './env'
import User from './models/User';

//asdasd
const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const port = process.env.PORT || 3000;

// middleware
app.use(express.static('public'));

// Routes
app.use('/api/user', authRoute);
app.use('/api/protected', protectedRoutes);
app.use('/api/car', carRoutes)
app.use('/api/img', imgRoutes)
app.use('/api/rental', rentalRoutes)
app.use('/api/buy', buyRoters)
app.use('/api/reports', reportRoutes)
app.use('/api/admin', adminUserRoutes)
app.use('/api/favorites', favoriteRoutes);


app.use(notFound)
app.use(errorHandlerMiddleware)

// ==================== CREATE ADMIN SCRIPT ====================
async function createAdminIfNotExists() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminName = process.env.ADMIN_NAME || 'Admin User';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
        const adminPhone = process.env.ADMIN_PHONE || '+1234567890';
        const adminLicense = process.env.ADMIN_DIVING_LICENSE || 'DL-ADMIN-001';
        const adminAvatar = process.env.ADMIN_AVATAR || 'admin-avatar.png';
        const adminGender = process.env.ADMIN_GENDER || 'male';

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            if (existingAdmin.role === 'admin') {
                console.log(`✅ Admin already exists with email: ${adminEmail}`);
            } else {
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log(`✅ User ${adminEmail} has been promoted to admin`);
            }
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            const admin = new User({
                name: adminName,
                email: adminEmail,
                phoneNumber: adminPhone,
                divingLicenseNumber: adminLicense,
                avatarFilename: adminAvatar,
                password: hashedPassword,
                gender: adminGender,
                role: 'admin',
                date: new Date()
            });

            await admin.save();
            console.log('='.repeat(50));
            console.log('✅ ADMIN CREATED SUCCESSFULLY');
            console.log('='.repeat(50));
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
            console.log(`👤 Name: ${adminName}`);
            console.log('='.repeat(50));
            console.log('⚠️  IMPORTANT: Change the password after first login!');
            console.log('='.repeat(50));
        }
    } catch (error: any) {
        console.error('❌ Error creating admin:', error.message);
    }
}

// ==================== START SERVER ====================
const start = async () => {
    try {
        await connectDB(MONGO_URI as string);
        await createAdminIfNotExists();

        app.listen(port, () => {
            console.log(`\n🚀 Server is running on port ${port}`);
            console.log(`🌐 http://localhost:${port}`);
        });
    } catch (err) {
        console.error('❌ Server startup error:', err);
        process.exit(1);
    }
}

start()