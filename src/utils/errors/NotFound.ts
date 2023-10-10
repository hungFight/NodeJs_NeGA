class NotFound extends Error {
    private errorAny: any;
    private status: number;
    constructor(name: string, message: string, errorAny?: any, status?: number) {
        super();
        this.status = status || 404;
        this.name = name;
        this.message = message;
        this.errorAny = errorAny;
    }
}
export default NotFound;
