import {tag} from "./utils"

export class SwitchContainer {

	constructor(trueContent, falseContent){
		this.root = tag({class: "switch-container"}, [
			tag({class: "switch-container-true"}, [trueContent]),
			tag({class: "switch-container-false"}, [falseContent]),
		])
		this.setState(false)
	}

	setState(state){
		if(state){
			this.root.classList.remove("state-false")
			this.root.classList.add("state-true")
		} else {
			this.root.classList.add("state-false")
			this.root.classList.remove("state-true")
		}
	}


}