class SearchService {
    get(id: string) {
        return new Promise(async (resolve, reject) => {
            try {
                // const data = await db.users.findOne({
                //     where: { id: id },
                //     attributes: { exclude: ['phoneNumberEmail', 'password', 'lg', 'updatedAt'] },
                //     raw: true,
                // });
                // if (data) {
                //     resolve({ status: 1, data: data, message: 'Successful!' });
                // }
                // resolve({ status: 0, message: 'No users found!' });
            } catch (error) {
                reject(error);
            }
        });
    }
}
export default new SearchService();
