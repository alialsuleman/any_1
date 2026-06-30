import { Response, Request } from "express";
import User, { IUser } from "../models/User";
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken";
import { JWT_LIFETIME, JWT_SECRET } from "../../env";
import { asyncWrapper } from "../middleware/asyncWrapper";
import path from "path";



type RequestBody = {
    name: string;
    email: string;
    password: string;
    divingLicenseNumber: string;
    phoneNumber: string;
    gender: string
}





export const registerUser = async (req: Request, res: Response) => {
    const { name, email, password, divingLicenseNumber, phoneNumber, gender }: RequestBody = req.body;
    let avatarFilename = 'male.png';
    if (gender == 'female') avatarFilename = 'female.jpg';
    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // store the user in db
    const user = new User({
        name: name,
        email: email,
        password: hashedPassword,
        divingLicenseNumber,
        phoneNumber,
        gender,
        avatarFilename
    });
    try {
        await user.save();
        res.send({
            success: true,
            message: 'user is created !',
            user: user._id
        })
    } catch (err) {
        res.status(400).send({
            success: false,
            message: err
        }
        )
    }
}

// success: false,
//     message: 'Invalid car ID format'



export const loginUser = async (req: Request, res: Response) => {
    // Create and assign a JWT

    const userId: string = res.locals.userId || '';

    console.log(userId);
    console.log(JWT_SECRET);
    console.log(JWT_LIFETIME);

    const token = jwt.sign({ id: userId }, JWT_SECRET, {
        expiresIn: JWT_LIFETIME
    });

    let user: any = await User.findById(userId).select('-password');;

    res.header('Authorization', `Bearer ${token}`).send({
        success: true,
        message: 'You have successfully logged in.',
        user,
        token
    });
}


/*
user 1 :  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNDE1NjE4MzlkNGI5ZWQwZWExZGI4NiIsImlhdCI6MTc4MjgwMTc5MSwiZXhwIjoxNzgyOTgxNzkxfQ.whU2aoZlKhRJ5Avgwcx0SZFWHEp31v_LK3KseGJua18
car 

user 2 : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNDM2NWFiOGUyZGIyNDcwYmJmOWRjZiIsImlhdCI6MTc4MjgwMTgzOSwiZXhwIjoxNzgyOTgxODM5fQ.G6HmWEePXCdspa3WIIiO3wjtNiF6fn-pSi3CW1dULaI

report

Admin  : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNDM2NTZhOTE0MDk5M2NmNTA2YTg0YyIsImlhdCI6MTc4MjgwMTg4MCwiZXhwIjoxNzgyOTgxODgwfQ.LZ8Y9QEpPJi_knlBKA_aOT4AzSycc2YQnr6oUJuwRLc
accept



*/