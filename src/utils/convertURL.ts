export function convertToURL(id: string, type: string) {
    if (type === 'image') return process.env.SERVER_FILE_GET_IMG_V1 + id;
    return process.env.SERVER_FILE_GET_VIDEO_V1 + id;
}
