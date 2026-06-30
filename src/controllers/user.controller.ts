import { Response, Request } from "express";
import User, { IUser } from "../models/User";
import { createNotification } from "./notification.controller";
import { asyncWrapper } from "../middleware/asyncWrapper";
import path from "path";





export const updateUserHandler = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.userId;
        const updateData = req.body;




        const updatedUser = await updateUserMethod(userId, updateData);

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "user is not found ! "
            });
        }
        createNotification({
            userId: userId,
            msg: "Payment information has been successfully submitted."
        })
        res.status(200).json({
            success: true,
            message: "user is updated !",
            user: updatedUser,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "something wrong happen !"
        });
    }
};



export const updateUserMethod = async (userId: string, updateData: Partial<IUser>): Promise<IUser | null> => {

    if (updateData.email) {
        delete updateData.email;
    }
    if (updateData.password) {
        delete updateData.password;
    }
    if (updateData.gender) {
        delete updateData.gender;
    }

    if (updateData.cardFullName) {
        updateData.role = 'trader';
    }


    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    return updatedUser;
};


export const addAvatar = async (req: Request, res: Response) => {

    const userId: string = res.locals.userId || '';
    console.log(userId);
    // @ts-ignore
    const { filename, path } = req.file;

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { avatarFilename: `/avatars/${filename}` } },
        { new: true, runValidators: true }
    );

    if (!updatedUser) {
        return res.status(404).json({
            success: false,
            message: "user is not found ! "
        });
    }
    else
        res.status(200).json({
            success: true,
            message: "avatar is updated !"
        });


}

export const getAvatar = async (req: Request, res: Response) => {

    const userId: string = req.body.userId || '';
    const user = await User.findById(userId);
    console.log(userId);
    // console.log(user);
    if (user) {
        console.log("find it ");
        const imagePath = user.avatarFilename;
        console.log("path " + imagePath);
        console.log(imagePath);
        res.status(200).json({
            success: true,
            imagePath: imagePath
        });

    }
    else res.send({
        success: false,
        message: 'something wrong!'

    });

}