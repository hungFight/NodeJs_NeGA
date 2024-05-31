export interface PropsSelectUser {
    address?: boolean;
    biography?: boolean;
    birthday?: boolean;
    active?: boolean;
    hobby?: boolean;
    skill?: boolean;
    occupation?: boolean;
    schoolName?: boolean;
    firstPage?: boolean;
    secondPage?: boolean;
    thirdPage?: boolean;
    userIsRequested?: boolean;
    userRequest?: boolean;
    followed?: boolean;
    followings?: boolean;
    loved?: boolean;
    isLoved?: boolean;
}
export interface PropsUser {
    readonly id: string;
    avatar: any;
    fullName: string;
    gender: number;
    occupation: string | null;
    background: any;
    biography: string | null;
    firstPage: string;
    secondPage: string;
    thirdPage: string;
    active: boolean;
}
export interface PropsMores {
    id: string;
    followedAmount: number;
    followingAmount: number;
    friendAmount: number;
    loverAmount: number;
    position: string;
    star: number;
    language: string[];
    relationship: string;
    visitorAmount: number;
    privacy: {
        [position: string]: 'everyone' | 'friends' | 'only';
        address: 'everyone' | 'friends' | 'only';
        birthday: 'everyone' | 'friends' | 'only';
        relationship: 'everyone' | 'friends' | 'only';
        gender: 'everyone' | 'friends' | 'only';
        schoolName: 'everyone' | 'friends' | 'only';
        occupation: 'everyone' | 'friends' | 'only';
        hobby: 'everyone' | 'friends' | 'only';
        skill: 'everyone' | 'friends' | 'only';
        language: 'everyone' | 'friends' | 'only';
        subAccount: 'everyone' | 'friends' | 'only';
    };
    updatedAt: string;
    createdAt: string;
}
export interface PropsUserPer {
    readonly id: string;
    avatar: any;
    fullName: string;
    address: string;
    gender: number;
    birthday: string;
    background: any;
    biography: string;
    active: boolean;
    occupation: string;
    schoolName: string;
    skill: string[];
    hobby: string[];
    firstPage: string;
    secondPage: string;
    thirdPage: string;
    mores: PropsMores[];
    userRequest:
        | {
              id: string;
              idRequest: string;
              idIsRequested: string;
              level: number;
              createdAt: string | Date;
              updatedAt: string | Date;
          }[];
    userIsRequested:
        | {
              id: string;
              idRequest: string;
              idIsRequested: string;
              level: number;
              createdAt: string | Date;
              updatedAt: string | Date;
          }[];
    isLoved:
        | {
              id: string;
              userId: string;
              idIsLoved: string;
              createdAt: string | Date;
          }[];
    loved:
        | {
              id: string;
              userId: string;
              idIsLoved: string;
              createdAt: string | Date;
          }[];
    followings:
        | {
              id: string;
              idFollowing: string;
              idIsFollowed: string;
              following: number;
              followed: number;
              createdAt: string | Date;
          }[];
    followed:
        | {
              id: string;
              idFollowing: string;
              idIsFollowed: string;
              following: number;
              followed: number;
              createdAt: string | Date;
          }[];
    accountUser: {
        account: {
            id: string;
            fullName: string;
            avatar: string | null;
            gender: number;
            phoneNumberEmail: string;
        };
    }[];
}
