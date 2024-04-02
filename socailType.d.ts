interface feel {
    onlyEmo: {
        id: number;
        icon: string;
        id_user: string[];
    }[];
    act: number;
}
export interface PropsComments {
    _id: string;
    id_user: string;
    user: {
        id: string;
        fullName: string;
        avatar: string | null;
        gender: number;
    };
    content: {
        text: string;
        imageOrVideos: string[];
    };
    feel: feel;
    reply: {
        id_user: string;
        content: { text: string; imageOrVideos: string[] };
        anonymous: boolean;
    }[];
    anonymous: boolean;
    createdAt: string | Date;
}
export interface PropsDataPosts {
    _id: string;
    user: { id: string; avatar: Buffer | undefined; fullName: string; gender: number }[];
    category: number;
    id_user: string;
    hashTag: { _id: string; value: string }[];
    feel: feel;
    comments: PropsComments[];
    amountComments: number;
    content: {
        text: string;
        fontFamily: string;
        options: {
            default: {
                comments: {
                    id_user: string;
                    content: {
                        text: string;
                        file: string[];
                    };
                    feel: feel;
                    reply: [
                        {
                            id_user: string;
                            content: {
                                text: string;
                                file: string[];
                            };
                            feel: feel;
                        },
                    ];
                };
                file: { id_sort: number; link: string; type: string };
                love: { id_user: string[] };
                title: string;
                _id: string;
            }[];
            swiper: {
                id: number;
                name: string;
                data: {
                    file: string[];
                    data?: {
                        file: string[];
                        centered: {
                            id: number;
                            column: number;
                            data: string[];
                        };
                    };
                };
            };
            grid: {
                file: string[];
                BgColor: string;
                column: number;
            };
            onlyImage: string[];
        };
    };
    whoCanSeePost: { id: string; name: string };
    anonymous: boolean;
    private: {
        id: string;
        name: string;
    }[];
    createdAt: string;
}
