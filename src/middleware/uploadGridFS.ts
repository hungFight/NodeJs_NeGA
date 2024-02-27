import { v4 as primaryKey } from 'uuid';
import http from '../utils/axiosCustom';
import multer from 'multer';
const crypto = require('crypto');
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        // Đường dẫn tới thư mục lưu trữ
        // cb(null, 'uploads/images');
        if (file) {
            req.body.mimetype = file.mimetype;
            req.body.originalname = file.originalname;
        }
        const fileBlob = new File([file.buffer], file.fieldname, { type: file.mimetype });
        const fo = new FormData();
        console.log(fileBlob, 'destination', file);
        fo.append('file', fileBlob);
        const result = await http.post('files/addFile', fo);

        //  axios
        //      .post('http://other-server/upload-file-info', req.body)
        //      .then((response) => {
        //          res.send(response.data);
        //      })
        //      .catch((error) => {
        //          console.error('Error saving file information:', error);
        //          res.status(500).send('Error saving file information');
        //      });
    },
});

const upload = multer({ storage: storage });
export default upload;
// multer({
//     storage: new GridFsStorage({
//         url: URL,
//         cache: true,

//         file: async (req, files) => {
//             console.log(req.body, files);

//             // const update: boolean = req.body.update; // update file
//             // const background: string = req.body.background; // bg of chat box
//             // const id_files: string[] = req.body.id_filesDel ? JSON.parse(req.body.id_filesDel) : []; // all by id_filesDel
//             // console.log(background, 'background delete');
//             // if (
//             //     [
//             //         'image/jpg',
//             //         'image/jpeg',
//             //         'image/webp',
//             //         'image/png',
//             //         'video/mp4',
//             //         'video/mov',
//             //         'video/x-matroska',
//             //     ].includes(files.mimetype)
//             // ) {
//             //     if ((update && id_files?.length) || background) {
//             //         try {
//             //             const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });
//             //             console.log(id_files, 'id_file delete');
//             //             // Find the file in GridFS using the id
//             //             if (background) {
//             //                 await gfs.files.findOne(
//             //                     { metadata: { id_file: background } },
//             //                     (err: any, file: { _id: any }) => {
//             //                         // // Delete the file
//             //                         if (err) console.log(err);
//             //                         console.log(file, 'delete file');

//             //                         if (file) {
//             //                             bucket
//             //                                 .delete(file._id)
//             //                                 .then(() => {
//             //                                     console.log('File deleted successfully');
//             //                                 })
//             //                                 .catch((error) => {
//             //                                     console.error('Error deleting file:', error);
//             //                                 });
//             //                         }
//             //                     },
//             //                 );
//             //             } else {
//             //                 id_files.forEach(async (f) => {
//             //                     await gfs.files.findOne(
//             //                         { metadata: { id_file: f } },
//             //                         (err: any, file: { _id: any }) => {
//             //                             // // Delete the file
//             //                             if (file) {
//             //                                 bucket
//             //                                     .delete(file._id)
//             //                                     .then(() => {
//             //                                         console.log('File deleted successfully');
//             //                                     })
//             //                                     .catch((error) => {
//             //                                         console.error('Error deleting file:', error);
//             //                                     });
//             //                             }
//             //                         },
//             //                     );
//             //                 });
//             //             }
//             //         } catch (error) {
//             //             console.log(error, 'update file');
//             //         }
//             //     }
//             //     return new Promise((resolve, reject) => {
//             //         try {
//             //             crypto.randomBytes(16, (err: any, buf: { toString: (arg0: string) => any }) => {
//             //                 if (err) {
//             //                     return reject(err);
//             //                 }
//             //                 const id = primaryKey();
//             //                 if (id) {
//             //                     const filename = buf.toString('hex') + path.extname(files.originalname);
//             //                     const fileInfo = {
//             //                         filename: filename,
//             //                         bucketName: 'uploads',
//             //                         metadata: {
//             //                             id_file: id, // Trường để lưu _id của tệp tin
//             //                         },
//             //                     };

//             //                     resolve(fileInfo);
//             //                 } else {
//             //                     console.log('Fuck id is empty upload file');
//             //                 }
//             //             });
//             //         } catch (error) {
//             //             console.log('Fuck', error);
//             //         }
//             //     });
//             // } else {
//             //     console.log('format is not supported!');
//             // }
//         },
//     }),
// });
// class FileGridFs {
//     getFile = async (req: any, res?: any) => {
//         const id_file = req.query.id_file;
//         const type = req.query.type;
//         console.log(id_file, 'id_file send');

//         const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });
//         await gfs.files.findOne({ metadata: { id_file } }, async (err: any, file: any) => {
//             console.log(file, 'file');

//             if (!file || file.length === 0) {
//                 return res.status(404).json({ message: { type: type, message: 'File not found' } }); // if change the message certainly change at client too
//             }
//             // Check if image
//             if (
//                 [
//                     'image/jpg',
//                     'image/jpeg',
//                     'image/webp',
//                     'image/png',
//                     'video/mp4',
//                     'video/mov',
//                     'video/x-matroska',
//                 ].includes(file.contentType)
//             ) {
//                 let dataTest: any = '';
//                 const file_ss: any = [];
//                 const downloadStream = bucket.openDownloadStream(file._id);
//                 downloadStream.on('data', (data) => {
//                     file_ss.push(data);
//                 });
//                 downloadStream.on('end', () => {
//                     const buffer = Buffer.concat(file_ss);
//                     return res.status(200).json({ type: file.contentType, file: buffer });
//                 });
//                 downloadStream.on('error', (error) => {
//                     // Handle the error
//                     console.error('Error while reading the file:', error);
//                 });
//             } else {
//                 return res.status(500).json({ message: 'This format is not support!' });
//             }
//         });
//     };
//     delete = async (req: any, res: any, next: express.NextFunction) => {
//         try {
//             const id_file: string[] = req.body.id_file;
//             console.log(id_file, 'id_file delete');

//             // Find the file in GridFS using the id
//             if (id_file.length) {
//                 const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });

//                 id_file.forEach(async (f) => {
//                     await gfs.files.findOne({ metadata: { id_file: f } }, (err: any, file: { _id: any }) => {
//                         if (err) {
//                             return res.status(404).json({ error: 'File deleting' });
//                         }
//                         // // Delete the file
//                         if (file) {
//                             bucket
//                                 .delete(file._id)
//                                 .then(() => {
//                                     console.log('File deleted successfully');
//                                 })
//                                 .catch((error) => {
//                                     console.error('Error deleting file:', error);
//                                 });
//                         }
//                     });
//                 });
//             }
//             next();
//         } catch (error) {
//             console.log(error, 'Delete file');
//         }
//     };
// }
// export default new FileGridFs();
