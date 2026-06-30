import { verify } from "../middleware/verify-token";
import { Request, Response, Router } from "express";
import { asyncWrapper } from "../middleware/asyncWrapper";
const router = Router();

import multer from 'multer'
import { ImageModel } from "../models/Img";


import path from 'path';


// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './uploads')
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + '-' + file.originalname)
//     }
// })

// const upload = multer({ storage })




// router.post('/addNewCarImage', verify, upload.single('image'), asyncWrapper(async (req: Request, res: Response) => {
//     console.log(req.file);
//     console.log(req.body);

//     // @ts-ignore
//     const { filename, path } = req.file;

//     const image = new ImageModel({
//         filename, path, cardId: req.body.carId
//     });
//     await image.save();
//     res.send({ ok: 1 });
// }))


// router.post('/getcarimagesid', asyncWrapper(async (req: Request<{}, {}, { cardId: string }, {}>, res: Response) => {
//     const imagesId = await ImageModel.find({ cardId: req.body.cardId }
//         , { _id: 1 }).exec();
//     const carImagesId: string[] = [];
//     imagesId.map(x => {
//         carImagesId.push(x._id.toString());
//         return x;
//     });

//     res.send({ carImagesId: carImagesId });
// }))

// router.post('/getcarimagebyimageid', asyncWrapper(async (req: Request<{}, {}, { imageId: string }, {}>, res: Response) => {
//     const image = await ImageModel.findById(req.body.imageId);
//     if (image) {
//         console.log("find it ");
//         const imagePath = path.join(__dirname, "..", "..", "uploads", image.filename);
//         console.log(imagePath);
//         res.sendFile(imagePath);
//     }
//     else res.send({ ok: 0 });
// }))





export default router