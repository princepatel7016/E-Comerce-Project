class ApiError extends Error {
    constructor(
        statusCode,
        message= "something went wrong",
        error = [],
        statck = ""
    ){
        super(message);
        this.statusCode = statusCode;
        this.data = null
    }
}