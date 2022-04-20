import {ApiError} from "./api_error"
import {Popup} from "./popup"
import {SignInPopup} from "./sign_in_popup"
import {makeButton, tag} from "./utils"

export class TaskEditPopup extends Popup {

	constructor(task, mode, onEditCompleted, showSignInPopup){
		super()
		this.task = task
		this.onEditCompleted = onEditCompleted
		this.showSignInPopup = showSignInPopup

		let disabledForAdmin = mode === "admin"? {disabled: "disabled"}: {}
		let disabledForUser = mode === "user"? {disabled: "disabled"}: {}

		this.contentContainer.appendChild(
			this.usernameInput = tag({
				tagName: "input", type: "text", name: "username", placeholder: "Имя пользователя",
				value: task?.username ?? "",
				...disabledForAdmin
			})
		)
		this.contentContainer.appendChild(
			this.emailInput = tag({
				tagName: "input", type: "text", name: "email", placeholder: "Е-мейл",
				value: task?.email ?? "",
				...disabledForAdmin
			})
		)
		this.contentContainer.appendChild(
			this.bodyInput = tag({
				tagName: "textarea", name: "body", placeholder: "Текст задачи",
				text: task?.body ?? "",
			})
		)
		if(mode === "admin" || task){
			this.contentContainer.appendChild(
				tag({class: "checkbox-and-label"}, [
					tag({tagName: "label", for: "completed", text: "Задача завершена: "}),
					this.completedInput = tag({
						tagName: "input", type: "checkbox", name: "completed",
						...(task?.completed ? {checked: "checked"}: {}),
						...disabledForUser
					}),
				])
			)
		}

		this.contentContainer.appendChild(
			tag({class: "buttons-container"}, [
				makeButton("Отмена", () => this.hide()),
				makeButton("Сохранить", () => this.tryCompleteEdit())
			])
		)

	}

	tryCompleteEdit() {
		return this.tryDoFinalAction(async () => {
			let username = this.usernameInput.value.trim()
			let email = this.emailInput.value.trim()
			let body = this.bodyInput.value.trim()
			let completed = this.completedInput?.checked ?? this.task?.checked ?? false
			
			if(!username){
				this.setInputWarning("Введите имя", this.usernameInput)
			}

			if(!email){
				this.setInputWarning("Введите е-мейл", this.emailInput)
			} else if(!email.match(/^\S+@\S+\.\S+$/)){
				this.setInputWarning("Е-мейл невалиден", this.emailInput)
			}

			if(!body){
				this.setInputWarning("Введите текст задачи", this.bodyInput)
			}
			
			if(this.warningCount > 0){
				throw new Error("Has errors, completion aborted")
			}

			await this.onEditCompleted({
				...(this.task || {}),
				username, email, body, completed
			})
		})
	}
	
}