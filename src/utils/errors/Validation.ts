class Validation extends Error {
    private status: number = 0;
    private errorAny: any;
    constructor(name?: string, message?: string, errorAny?: any) {
        super();
        this.status = 403;
        if (name && message) {
            this.message = message;
            this.name = name;
        }
        this.errorAny = errorAny;
    }
    validEmail(email: string): boolean {
        if (/^\w+([\\.-]?\w+)*@\w+([\\.-]?\w+)*(\.\w{2,5})+$/.test(email)) return true;
        return false;
    }
    validLength(value: string, start: number, end: number): boolean {
        if (value.length >= start && value.length <= end) return true;
        return false;
    }
}
export default Validation;
