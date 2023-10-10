import multer from 'multer';
import { v4 as primaryKey } from 'uuid';
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
        file: (req, files) => {
            return new Promise((resolve, reject) => {
                try {
                    crypto.randomBytes(16, (err: any, buf: { toString: (arg0: string) => any }) => {
                        if (err) {
                            return reject(err);
                        }
                        const id = primaryKey();
                        const filename = buf.toString('hex') + path.extname(files.originalname);
                        const fileInfo = {
                            filename: filename,
                            bucketName: 'uploads',
                            metadata: {
                                id_file: id, // Trường để lưu _id của tệp tin
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
    getFile = async (req: any, res: any) => {
        const id_file = req.query.id_file;
        console.log(id_file, 'id_file send');

        const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });
        await gfs.files.findOne({ metadata: { id_file } }, async (err: any, file: any) => {
            console.log(file._id, 'file');

            if (!file || file.length === 0) {
                return res.status(404).json('Files are not exist!');
            }
            // Check if image
            if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
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
            }
        });
    };
}
export default new FileGridFs();
