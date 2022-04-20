import {makeButton, tag} from "./utils"

export class SignedOutControls {

	constructor(onSignedInClick){
		let signInButton = makeButton("Войти", onSignedInClick)

		this.root = tag({class: "signed-out-controls"}, [
			signInButton
		])
	}

}