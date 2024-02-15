import axios from 'axios';
import HomeServiceSN from '../../../services/WebsServices/SocialNetwork/HomeServiceSN';
import ReactDOMServer from 'react-dom/server';
class homeController {
    setPost = async (req: any, res: any, next: any) => {
        try {
            console.log(req.body);

            const id = req.cookies.k_user;
            const io = res.io;

            const value = req.body.text;
            const files = req.files;
            const category = req.body.category ? JSON.parse(req.body.category) : undefined; // must be number
            const fontFamily = req.body.fontFamily;
            const act = req.body.act ? JSON.parse(req.body.act) : undefined;
            // const expire = req.body.expire;
            const privates = req.body.privacy ? JSON.parse(req.body.privacy) : undefined;
            const whoCanSeePost = req.body.whoSeePost ? JSON.parse(req.body.whoSeePost) : undefined;
            const imotions = req.body.imotions ? JSON.parse(req.body.imotions) : undefined;
            console.log(files, 'ss', whoCanSeePost, 'whoCanSeePost');

            // swiper

            const categoryOfSwiper = req.body.categoryOfSwiper ? JSON.parse(req.body.categoryOfSwiper) : undefined;
            const Centered1 = req.body.dataCentered1 ? JSON.parse(req.body.dataCentered1) : undefined;
            const Centered2 = req.body.dataCentered2 ? JSON.parse(req.body.dataCentered2) : undefined;
            const Centered3 = req.body.dataCentered3 ? JSON.parse(req.body.dataCentered3) : undefined;
            // grid
            const BgColor = req.body.BgColor;
            const columnGrid = req.body.columnOfGrid ? JSON.parse(req.body.columnOfGrid) : undefined;
            if (category === 1) {
                // swiper
                files.forEach((file: any) => {
                    if (file.metadata.title) {
                        if (JSON.parse(file.metadata.title) === 1) {
                            Centered1?.data.push(file.metadata.id_file);
                        }
                        if (JSON.parse(file.metadata.title) === 2) {
                            Centered2?.data.push(file.metadata.id_file);
                        }
                        if (JSON.parse(file.metadata.title) === 3) {
                            Centered3?.data.push(file.metadata.id_file);
                        }
                    }
                });
            }
            console.log(value, Centered1, Centered2, Centered3, 'body', categoryOfSwiper, 'categoryOfSwiper');
            const data = await HomeServiceSN.setPost(
                id,
                value, // value text
                category, // type post
                fontFamily,
                files,
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
            );
            return res.status(200).json(data);
        } catch (error) {
            console.log(error);
        }
    };
    search = () => {};
    getPosts = async (req: any, res: any, next: any) => {
        try {
            const id = req.cookies.k_user;
            const limit = req.query.limit;
            const offset = req.query.offset;
            const status = req.query.status;
            console.log('limit', limit, offset, 'offset', status, 'status');
            const data: any = await HomeServiceSN.getPosts(id, limit, offset, status);
            return res.status(200).json(data);
        } catch (error) {
            console.error('Error Server:', error);
        }
    };
}
export default new homeController();
