import {ApiError} from "./api_error"

async function callServer(methodName, body){
	let result = await fetch("/api/" + methodName, {
		body: JSON.stringify(body || {}),
		method: "POST"
	})
	let respJson = await result.json()
	if(!respJson.success || !result.ok){
		if(respJson.errorType === "generic_error" || !respJson.errorType){
			throw new Error("Failed to call " + methodName)
		} else {
			throw new ApiError(respJson.errorType, respJson.errorMessage)
		}
	}
	return respJson.result
}

export let serverApi = {
	signIn: (login, password) => callServer("sign_in", {login, password}),
	signOut: () => callServer("sign_out"),
	getCurrentUser: () => callServer("get_current_user"),
	fetchTasks: (page, sortBy, sortAsc) => callServer("fetch_tasks", {page, sortBy, sortAsc}),
	createTask: (username, email, body) => callServer("create_task", {username, email, body}),
	updateTask: (id, body, completed) => callServer("update_task", {id, body, completed}),
	getTaskCount: () => callServer("get_task_count")
}