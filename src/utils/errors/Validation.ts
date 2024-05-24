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
    public validEmail(email: string): boolean {
        if (/^\w+([\\.-]?\w+)*@\w+([\\.-]?\w+)*(\.\w{2,5})+$/.test(email)) return true;
        return false;
    }
    public validLength(value: string, start: number, end: number): boolean {
        if (value.length >= start && value.length <= end) return true;
        return false;
    }
    public validString(value: string): boolean {
        if (typeof value === 'string') return true;
        return false;
    }
    public validNumber(value: number): boolean {
        if (typeof value === 'number') return true;
        return false;
    }
    public validUUID(value: string | string[]): boolean {
        const uuidPattern: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
        if (typeof value === 'string') {
            return uuidPattern.test(value);
        } else {
            let check = true;
            value.map((v) => {
                if (!uuidPattern.test(v)) check = false;
            });
            return check;
        }
    }
    public validMongoID(value: string | string[]): boolean {
        const mongooseIdPattern: RegExp = /^[0-9a-fA-F]{24}$/;
        if (typeof value === 'string') {
            return mongooseIdPattern.test(value);
        } else {
            let check = true;
            value.map((v) => {
                if (!mongooseIdPattern.test(v)) check = false;
            });
            return check;
        }
    }
}
export default new Validation();
