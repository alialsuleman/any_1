import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../env";
import User from "../models/User";

export const verify = async (req: Request, res: Response, next: NextFunction) => {
    const auth = req.header('Authorization');
    if (!auth)
        return res.status(401).send({
            success: false,
            message: 'Access denied!!!'
        })
    let token = auth.split(' ')[1];
    if (!token)
        return res.status(401).send({
            success: false,
            message: 'Access denied!!!'
        })
    try {

        const verify = jwt.verify(token, JWT_SECRET);

        res.locals.user = verify;
        res.locals.userId = res.locals.user.id as string;

        if (res.locals.userId) {
            const user = await User.findById(res.locals.userId);
            if (user && user.isRestricted) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been restricted. Please contact support.',
                    restrictedReason: user.restrictedReason
                });
            }
        }





        console.log("toke verfied and the userid is : " + res.locals.userId);
        next()
    } catch (err) {
        return res.status(400).send({
            success: false,
            message: 'Invalid token!!!',
        }

        )
    }
}
