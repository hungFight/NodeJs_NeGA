class Validation extends Error {
    private status: number = 0;
    private errorAny: any;
    constructor(name: string, message: string, errorAny?: any) {
        super();
        this.status = 403;
        this.message = message;
        this.name = name;
        this.errorAny = errorAny;
    }
}
export default Validation;
