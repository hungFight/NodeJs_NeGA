import { typeUser } from "./userSchema";
import { typeChats } from "./chatsShema";
import { typeWarningData } from "./warningData";
const typeDefs = `#graphql
    scalar JSON
    type Chats${typeChats}
    type WarningData${typeWarningData}
    type Query{
        warningData(id: String!): WarningData
        chats(id_room: String,limit: Int,offset: Int): [Chats]
    }
`;
export default typeDefs;
//  id: 'id',
//                 avatar: 'avatar',
//                 background: 'background',
//                 fullName: 'fullName',
//                 nickName: 'nickName',
//                 status: 'status',
//                 gender: 'gender',
//                 as: 'as',
//                 sn: 'sn',
//                 l: 'l',
//                 w: 'w',
