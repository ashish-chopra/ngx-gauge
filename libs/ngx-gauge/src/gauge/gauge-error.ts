export class NgxGaugeError extends Error {
    constructor(message: string) {
        super();
        this.message = message;
    }
}