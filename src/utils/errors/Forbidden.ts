class Forbidden extends Error {
    private status: number;
    private messageObject: any;
    constructor(name: string, message: any) {
        super();
        this.status = 401;
        this.name = name;
        this.messageObject = message;
    }
}
export default Forbidden;
