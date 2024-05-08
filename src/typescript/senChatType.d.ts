export interface PropsOldSeenBy {
    roomId: string;
    data: { filterId: string; data: { dataId: string; userId: string }[] }[];
}
export interface PropsInfoFile {
    id: string;
    type: string;
    tail: string;
    name: string;
    title?: string;
    id_sort?: number;
    width?: string;
    height?: string;
}
export interface PropsItemOperationsCon {
    userId: string;
    createdAt: string | Date;
    title: string;
}

interface PropsItemRoom {
    _id: string;
    chatId: string;
    full: boolean;
    index: number;
    count: number;
    createdAt: string | NativeDate;
    filter: {
        _id: string;
        count: number;
        full: boolean;
        index: number;
        data: {
            _id: string;
            text: { icon: string; t: string };
            imageOrVideos: { v: string; icon: string; _id: string }[];
            seenBy: string[];
            createdAt: string | NativeDate;
            secondary?: string;
            // user: { avatar: any; fullName: string; gender: number; id: string };
        }[];
        createdAt: string | NativeDate;
    }[];
}
interface PropsRoom {
    rooms: PropsItemRoom;
}
export interface PropsRooms {
    rooms: PropsItemRoom[];
}
export interface PropsRoomChat {
    _id: any;
    id_us: string[];
    background: {
        v: string;
        type: string;
        id: string;
        latestChatId: string;
        userId: string;
    };
    miss?: number;
    lastElement: { roomId: any; filterId: any };
    status: string;
    users: {
        id: string;
        avatar: any;
        fullName: string;
        gender: number;
    }[];
    user: {
        id: string;
        avatar: any;
        fullName: string;
        gender: number;
    };
    deleted: {
        id: string;
        createdAt: string | Date | NativeDate;
        show: boolean;
    }[];
    pins: {
        _id: string;
        chatId: string;
        userId: string;
        createdAt: string | Date | NativeDate;
        updatedAt: string | Date | NativeDate;
        latestChatId: string;
    }[];
    statusOperation: PropsItemOperationsCon[];
    createdAt: string | NativeDate;
}
