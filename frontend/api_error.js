export class ApiError extends Error {
	constructor(type, msg){
		super(msg)
		this.apiErrorType = type
	}
}