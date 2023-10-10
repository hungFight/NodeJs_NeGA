export const typeChats = `
    {
            _id: String
            text: InfoText
            imageOrVideos: [InfoIV]
            seenBy: [String]
            createdAt: String
    }
    type InfoText{
        t: String
        icon: String
    }
    type InfoIV{
        v: String
        icon: String
        _id: String
    }
`;
