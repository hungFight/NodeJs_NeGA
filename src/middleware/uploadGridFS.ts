import multer from 'multer';
import { v4 as primaryKey } from 'uuid';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
const crypto = require('crypto');
import Grid from 'gridfs-stream';
import { GridFsStorage } from 'multer-gridfs-storage';
const URL = 'mongodb+srv://Spaceship:hung0507200301645615023@cluster0.chumwfw.mongodb.net/spaceship';
let gfs: any;
const conn = mongoose.createConnection(URL);
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    console.log('connect');
});

export const upload = multer({
    storage: new GridFsStorage({
        url: URL,
        cache: true,

        file: async (req, files) => {
            console.log(req.body, files);
            const update: boolean = req.body.update;
            const background: string = req.body.background;
            const id_files: string[] = req.body.id_filesDel ? JSON.parse(req.body.id_filesDel) : [];
            console.log(background, 'background delete');

            if ((update && id_files?.length) || background) {
                try {
                    const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });
                    console.log(id_files, 'id_file delete');
                    // Find the file in GridFS using the id
                    if (background) {
                        await gfs.files.findOne(
                            { metadata: { id_file: background } },
                            (err: any, file: { _id: any }) => {
                                // // Delete the file
                                if (err) console.log(err);
                                console.log(file, 'delete file');

                                if (file) {
                                    bucket
                                        .delete(file._id)
                                        .then(() => {
                                            console.log('File deleted successfully');
                                        })
                                        .catch((error) => {
                                            console.error('Error deleting file:', error);
                                        });
                                }
                            },
                        );
                    } else {
                        id_files.forEach(async (f) => {
                            await gfs.files.findOne({ metadata: { id_file: f } }, (err: any, file: { _id: any }) => {
                                // // Delete the file
                                if (file) {
                                    bucket
                                        .delete(file._id)
                                        .then(() => {
                                            console.log('File deleted successfully');
                                        })
                                        .catch((error) => {
                                            console.error('Error deleting file:', error);
                                        });
                                }
                            });
                        });
                    }
                } catch (error) {
                    console.log(error, 'update file');
                }
            }
            return new Promise((resolve, reject) => {
                try {
                    crypto.randomBytes(16, (err: any, buf: { toString: (arg0: string) => any }) => {
                        if (err) {
                            return reject(err);
                        }
                        const filename = buf.toString('hex') + path.extname(files.originalname);
                        const fileInfo = {
                            filename: filename,
                            bucketName: 'uploads',
                            metadata: {
                                id_file: files.originalname, // Trường để lưu _id của tệp tin
                            },
                        };

                        resolve(fileInfo);
                    });
                } catch (error) {
                    console.log('Fuck', error);
                }
            });
        },
    }),
});
class FileGridFs {
    getFile = async (req: any, res?: any) => {
        const id_file = req.query.id_file;
        const type = req.query.type;
        console.log(id_file, 'id_file send');

        const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });
        await gfs.files.findOne({ metadata: { id_file } }, async (err: any, file: any) => {
            console.log(file, 'file');

            if (!file || file.length === 0) {
                return res.status(404).json({ message: { type: type, message: 'File not found' } }); // if change the message certainly change at client too
            }
            // Check if image
            if (
                ['image/jpg', 'image/jpeg', 'image/png', 'video/mp4', 'video/mov', 'video/x-matroska'].includes(
                    file.contentType,
                )
            ) {
                let dataTest: any = '';
                const file_ss: any = [];
                const downloadStream = bucket.openDownloadStream(file._id);
                downloadStream.on('data', (data) => {
                    file_ss.push(data);
                });
                downloadStream.on('end', () => {
                    const buffer = Buffer.concat(file_ss);
                    return res.status(200).json({ type: file.contentType, file: buffer });
                });
                downloadStream.on('error', (error) => {
                    // Handle the error
                    console.error('Error while reading the file:', error);
                });
            } else {
                return res.status(500).json({ message: 'This format is not support!' });
            }
        });
    };
    delete = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const id_file: string[] = req.body.id_file;
            console.log(id_file, 'id_file delete');

            // Find the file in GridFS using the id
            if (id_file.length) {
                const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });

                id_file.forEach(async (f) => {
                    await gfs.files.findOne({ metadata: { id_file: f } }, (err: any, file: { _id: any }) => {
                        if (err) {
                            return res.status(404).json({ error: 'File deleting' });
                        }
                        // // Delete the file
                        if (file) {
                            bucket
                                .delete(file._id)
                                .then(() => {
                                    console.log('File deleted successfully');
                                })
                                .catch((error) => {
                                    console.error('Error deleting file:', error);
                                });
                        }
                    });
                });
            }
            next();
        } catch (error) {
            console.log(error, 'Delete file');
        }
    };
}
export default new FileGridFs();
