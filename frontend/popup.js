import {ApiError} from "./api_error"
import {tag} from "./utils"

export class Popup {

	constructor(){
		this.warningLabels = []
		this.root = tag({class: "popup", style: {opacity: "0"}}, [
			this.contentContainer = tag({class: "popup-content"})
		])
	}

	show() {
		document.body.appendChild(this.root)
		void this.root.clientWidth // forced reflow
		this.root.style.opacity = "1"
	}

	hide() {
		this.lock()
		this.root.style.opacity = "0"
		setTimeout(() => {
			this.root.remove()
			this.unlock()
		}, 250)
	}

	lock(){
		this.root.classList.add("lock")
	}

	unlock(){
		this.root.classList.remove("lock")
	}

	setInputWarning(text, input){
		input ||= this.contentContainer.lastChild
		let el = tag({text, class: "input-err-label"})
		input.after(el)
		this.warningLabels.push(el)
	}

	clearWarnings(){
		for(let label of this.warningLabels){
			label.remove()
		}
		this.warningLabels.length = 0
	}

	get warningCount(){
		return this.warningLabels.length
	}

	async tryDoFinalAction(action){
		this.clearWarnings()
		this.lock()
		try {
			await Promise.resolve(action())
		} catch(e){
			if(e instanceof ApiError){
				this.setInputWarning(e.message)
			}
			this.unlock()
			return
		}
		this.hide()
	}

}