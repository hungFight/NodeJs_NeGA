import searchServiceSN from '../../../services/WebsServices/SocialNetwork/SearchServiceSN';

class searchController {
    getUser = async (req: any, res: any) => {
        try {
            const id = req.body.params.id;
            const data = await searchServiceSN.get(id);
            return res.status(200).json(data);
        } catch (error) {
            console.log(error);
        }
    };
}
export default new searchController();
