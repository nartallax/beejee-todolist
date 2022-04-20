import {makeButton, tag} from "./utils"

export class SignedInControls {

	constructor(onSignOut){
		this.onSignOut = onSignOut

		let signOutButton = makeButton("Выйти", () => this.onSignOut())

		this.root = tag({class: "signed-in-controls"}, [
			this.usernameEl = tag({class: "signed-in-username"}),
			signOutButton
		])
	}

	setUser(user){
		this.usernameEl.textContent = "Вы вошли как " + user.login
	}

}