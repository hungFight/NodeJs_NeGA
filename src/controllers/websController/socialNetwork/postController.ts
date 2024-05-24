import PostServiceSN from '../../../services/WebsServices/SocialNetwork/PostServiceSN';
import express from 'express';
import Validation from '../../../utils/errors/Validation';
import { io } from '../../..';
class homeController {
    setPost = async (req: any, res: any, next: express.NextFunction) => {
        try {
            console.log(req.body);

            const id = req.cookies.k_user,
                io = res.io,
                hashTags = req.body.hashTags ? JSON.parse(req.body.hashTags) : undefined,
                tags = req.body.tags ? JSON.parse(req.body.tags) : undefined,
                value = req.body.text,
                category = req.body.category ? JSON.parse(req.body.category) : undefined, // must be number
                fontFamily = req.body.fontFamily,
                bg_default = req.body.bg_default,
                data_file = req.body.id_file,
                act = req.body.act ? JSON.parse(req.body.act) : undefined,
                //  expire = req.body.expire;
                privates = req.body.privacy ? JSON.parse(req.body.privacy) : undefined,
                whoCanSeePost = req.body.whoSeePost ? JSON.parse(req.body.whoSeePost) : undefined,
                imotions = req.body.imotions ? JSON.parse(req.body.imotions) : undefined,
                // swiper
                categoryOfSwiper = req.body.categoryOfSwiper ? JSON.parse(req.body.categoryOfSwiper) : undefined,
                Centered1 = req.body.dataCentered1 ? JSON.parse(req.body.dataCentered1) : undefined,
                Centered2 = req.body.dataCentered2 ? JSON.parse(req.body.dataCentered2) : undefined,
                Centered3 = req.body.dataCentered3 ? JSON.parse(req.body.dataCentered3) : undefined,
                // grid
                BgColor = req.body.BgColor,
                columnGrid = req.body.columnOfGrid ? JSON.parse(req.body.columnOfGrid) : undefined;
            // if (category === 1) {
            //     // swiper
            //     files.forEach((file: any) => {
            //         if (file.metadata.title) {
            //             if (JSON.parse(file.metadata.title) === 1) {
            //                 Centered1?.data.push(file.metadata.id_file);
            //             }
            //             if (JSON.parse(file.metadata.title) === 2) {
            //                 Centered2?.data.push(file.metadata.id_file);
            //             }
            //             if (JSON.parse(file.metadata.title) === 3) {
            //                 Centered3?.data.push(file.metadata.id_file);
            //             }
            //         }
            //     });
            // }
            console.log(value, Centered1, Centered2, Centered3, 'body', imotions, 'categoryOfSwiper');
            const data = await PostServiceSN.setPost(
                id,
                value, // value text
                category, // type post
                fontFamily,
                privates, //privacy fiels of post
                whoCanSeePost,
                imotions,
                categoryOfSwiper,
                Centered1, // centered
                Centered2,
                Centered3,
                BgColor,
                columnGrid,
                act, //icon imotion
                hashTags,
                tags,
                bg_default,
                data_file,
            );
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    search = () => {};
    setEmotion = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const _id = req.body._id;
            if (!Validation.validMongoID(_id)) return res.status(404).json('Invalid Mongodb Id');
            const index = req.body.index,
                id_user = req.body.id_user,
                state = req.body.state,
                oldIndex = req.body.oldIndex,
                id_comment = req.body.id_comment,
                groupCommentId = req.body.groupCommentId;
            const data = await PostServiceSN.setEmotion({ _id, index, id_user, state, oldIndex, id_comment, groupCommentId });
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    getPosts = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user,
                limit = req.query.limit,
                offset = req.query.offset,
                status = req.query.status;
            const data: any = await PostServiceSN.getPosts(id, limit, offset, status);
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    sendComment = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user,
                postId = req.body.postId,
                onAnonymous = req.body.onAc,
                emos = req.body.emos,
                text = req.body.text,
                commentId = req.body.commentId,
                repliedId = req.body.repliedId;

            if (!Validation.validUUID(id)) return res.status(404).json('Id of user is invalid!');
            if (!Validation.validMongoID(postId)) return res.status(404).json('postId of the post is invalid!');
            //  postId: dataPost._id, text: reply_com.text, anonymousC: onAc, emos, commentId: reply_com.id, repliesId: reply_com.id_user
            const data = await PostServiceSN.sendComment(postId, id, text, onAnonymous, emos, commentId, repliedId);
            if (data) io.emit(`comment_post_${postId}`, data);
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    getComments = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const postId = req.body.postId,
                offset = req.body.offset,
                userId = req.cookies.k_user,
                limit = req.body.limit;
            if (!Validation.validMongoID(postId)) return res.status(404).json('Id of the post is invalid!');
            const data = await PostServiceSN.getComments(postId, userId, offset, limit);
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
}
export default new homeController();
