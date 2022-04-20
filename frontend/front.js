// я не стал заморачиваться с упаковкой всех кусков скрипта в один файл
// в реальном проекте, конечно, надо бы, хотя бы чем-нибудь простым вроде rollup
// но для тестового сойдет и так
import {serverApi} from "./server_api"
import {makeButton, waitDocumentLoaded} from "./utils"
import {SignInPopup} from "./sign_in_popup"
import {SwitchContainer} from "./switch_container"
import {SignedInControls} from "./signed_in_controls"
import {SignedOutControls} from "./signed_out_controls"
import {TaskEditPopup} from "./task_edit_popup"
import {TaskContainer} from "./task_container"
import {ApiError} from "./api_error"

let signedInControls = new SignedInControls(async () => {
	await serverApi.signOut()
	onUserChanged(null)
})

function showSignInPopup(){
	new SignInPopup(async (login, password) => {
		onUserChanged(await serverApi.signIn(login, password))
	}).show()
}

let signedOutControls = new SignedOutControls(showSignInPopup)

let signInSwitchboard = new SwitchContainer(signedInControls.root, signedOutControls.root)

let taskContainer = new TaskContainer(
	(page, sortBy, sortAsc) => serverApi.fetchTasks(page, sortBy, sortAsc),
	task => new TaskEditPopup(task, "admin", async task => {
		await serverApi.updateTask(task.id, task.body, task.completed)
		taskContainer.refresh()
	}, showSignInPopup).show(),
	{
		username: "Сортировать по имени",
		email: "Сортировать по е-мейлу",
		completed: "Сортировать по статусу"
	}
)

function onUserChanged(user){
	if(!user){
		signInSwitchboard.setState(false)
		signedInControls.setUser({login: ""})
		taskContainer.setAdminMode(false)
	} else {
		signedInControls.setUser(user)
		signInSwitchboard.setState(true)
		taskContainer.setAdminMode(true)
	}
}

async function main(){
	await waitDocumentLoaded()
	let placeholder = document.querySelector(".loading-placeholder")
	let header = document.querySelector("header")
	header.appendChild(signInSwitchboard.root)
	header.appendChild(makeButton("Создать задачу", () => new TaskEditPopup(null, "user", async task => {
		await serverApi.createTask(task.username, task.email, task.body)
		taskContainer.refresh()
	}, showSignInPopup).show()))

	placeholder.after(taskContainer.root)
	placeholder.remove()
	taskContainer.refresh()


	try {
		onUserChanged(await serverApi.getCurrentUser())
	} catch(e) {
		if(e instanceof ApiError && e.apiErrorType === "not_logged_in"){
			// ничего, мы просто не залогинены
		} else {
			console.error("Failed to retrieve user initially: " + e.stack)
		}
	}
}

main()