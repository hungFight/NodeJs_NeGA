class ServerError extends Error {
    private status: number;
    private messageObject: any;
    constructor(name: string, message: any) {
        super();
        this.status = 500;
        this.name = name;
        this.messageObject = message;
    }
}
export default ServerError;
