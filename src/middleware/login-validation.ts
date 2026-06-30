import { Request, Response, NextFunction } from 'express'
import { z } from "zod";
import bcrypt from 'bcryptjs'
import User from '../models/User';

type RequestBody = {
    email: string;
    password: string
}

// zod Validations
const loginSchema = z.object({
    email: z.string().min(6).email(),
    password: z.string().min(6)
}).strict();

export const loginValidation = async (req: Request, res: Response, next: NextFunction) => {
    // validating using zod
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
        res.status(400).send({
            success: false,
            message: parsed.error
        })
    else {


        const { email: emailFromBody, password: passwordFromBody }: RequestBody = req.body;
        // checking if the email exists
        const user = await User.findOne({ email: emailFromBody })
        if (user) {
            // checking if the password is correct
            const validPass = await bcrypt.compare(passwordFromBody, user.password)
            if (validPass) {


                if (user && user.isRestricted) {
                    return res.status(403).json({
                        success: false,
                        message: 'Your account has been restricted. Please contact support.',
                        restrictedReason: user.restrictedReason
                    });
                }



                res.locals.userId = user._id as string;
                next();
            }
            else
                res.status(400).send({
                    success: false,
                    message: 'Invalid Email or Password!!!'
                })
        }
        else
            res.status(400).send({
                success: false,
                message: 'Invalid Email or Password!!!'
            })
    }

}