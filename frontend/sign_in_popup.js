import {ApiError} from "./api_error"
import {Popup} from "./popup"
import {makeButton, tag} from "./utils"

export class SignInPopup extends Popup {

	constructor(doSignIn){
		super()
		this.doSignIn = doSignIn

		this.contentContainer.appendChild(
			this.loginInput = tag({
				tagName: "input", type: "text", name: "login", placeholder: "Логин"
			})
		)
		this.contentContainer.appendChild(
			this.passwordInput = tag({
				tagName: "input", type: "password", name: "password", placeholder: "Пароль"
			})
		)
		this.contentContainer.appendChild(
			tag({class: "buttons-container"}, [
				makeButton("Отмена", () => this.hide()),
				makeButton("Войти", () => this.trySignIn())
			])
		)

		this.loginErrLabel = null
		this.passwordErrLabel = null
	}

	trySignIn() {
		return this.tryDoFinalAction(async () => {
			let login = this.loginInput.value.trim()
			let password = this.passwordInput.value.trim()
			
			if(!login){
				this.setInputWarning("Введите логин", this.loginInput)
			}
	
			if(!password){
				this.setInputWarning("Введите пароль", this.passwordInput)
			}
			
			if(this.warningCount > 0){
				throw new Error("Has errors, completion aborted")
			}

			await this.doSignIn(login, password)
		})		
	}

}