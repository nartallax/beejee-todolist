import {TaskEditPopup} from "./task_edit_popup"
import {makeButton, removeAllChildren, tag} from "./utils"

export class TaskContainer {

	constructor(getTasks, editTask, sortingOptions){
		this.getTasks = getTasks
		this.editTask = editTask
		this.sortingOptions = sortingOptions
		this.loading = false
		this.pageNum = 1
		this.currentPageTasks = []
		this.adminMode = false

		this.loadingLabel = tag({class: "task-loading-label", text: "Загрузка..."})
		this.root = tag({class: "task-container-wrap"}, [
			tag({class: "task-container-sorting-buttons"}, 
				this.renderSortingButtons()
			),
			tag({class: "task-container-positioner"}, [
				this.container = tag({class: "task-container"})
			]),
			this.paginationContainer = tag({class: "pagination-container"})
		])
	}

	async refresh(){
		await this.goToPage(this.pageNum)
	}

	setAdminMode(adminMode){
		this.adminMode = adminMode
		this.redrawCurrentPage()
	}

	async goToPage(pageNum){
		this.pageNum = pageNum
		this.currentPageTasks.length = 0
		removeAllChildren(this.container)
		this.container.appendChild(this.loadingLabel)

		this.loading = true
		let callResult
		try {
			callResult = await this.getTasks(pageNum - 1, this.sortBy, this.sortAsc)
		} finally {
			this.loading = false
			this.loadingLabel.remove()
		}
		let {tasks, count, pageSize} = callResult
		this.currentPageTasks = tasks

		this.redrawCurrentPage()
		this.updatePagination(pageNum, Math.ceil(count / pageSize))
	}

	redrawCurrentPage() {
		removeAllChildren(this.container)
		for(let task of this.currentPageTasks){
			let renderedTask = this.renderTask(task)
			this.container.appendChild(renderedTask)
		}
	}

	renderSortingButtons(){
		this.sortingButtons = {}
		let result = []
		for(let field in this.sortingOptions){
			if(!this.sortBy){
				this.sortBy = field
				this.sortAsc = false
			}
			let btn = makeButton(this.sortingOptions[field], () => {
				if(this.sortBy === field){
					this.sortAsc = !this.sortAsc
				} else {
					this.sortBy = field
					this.sortAsc = false
				}
				this.refresh()
				this.updateSortingButtons()
			})
			result.push(btn)
			this.sortingButtons[field] = btn
		}
		this.updateSortingButtons()
		return result
	}

	updateSortingButtons(){
		for(let field in this.sortingButtons){
			let btn = this.sortingButtons[field]
			let btnText = this.sortingOptions[field]
			if(field === this.sortBy){
				btnText += this.sortAsc? " ^": " v"
			}
			btn.textContent = btnText
		}
	}

	makePaginationButton(text, pageNum, otherArgs){
		let result = makeButton(text, () => {
			if(this.loading){
				return
			}
			this.goToPage(pageNum)
		})
		if(otherArgs?.locked){
			result.classList.add("locked")
		}
		this.paginationContainer.appendChild(result)
		return result
	}

	updatePagination(pageNum, maxPageCount){
		removeAllChildren(this.paginationContainer)
		if(maxPageCount === 1){
			return
		}
		this.makePaginationButton("<<", 1, {locked: pageNum < 2})
		this.makePaginationButton("<", pageNum - 1, {locked: pageNum < 2})
		for(let i = Math.max(1, pageNum - 3); i <= Math.min(maxPageCount, pageNum + 3); i++){
			this.makePaginationButton(i, i, {locked: i === pageNum})
		}
		this.makePaginationButton(">", pageNum + 1, {locked: pageNum === maxPageCount})
		this.makePaginationButton(">>", maxPageCount, {locked: pageNum === maxPageCount})
	}

	renderTask(task){
		let stateText = [
			task.completed? "Выполнено": "Не выполнено",
			task.editedByAdmin && "Отредактировано администратором"
		].filter(part => !!part).join(", ")
		return tag({class: "task-block"}, [
			tag({class: "task-header"}, [
				tag({class: "task-user-block"}, [
					tag({class: "task-username", text: task.username}),
					tag({tagName: "a", class: "task-email", href: "mailto:" + task.email, text: task.email}),
				]),
				tag({class: "task-user-state", text: stateText})
			]),
			tag({class: "task-body", text: task.body}),
			!this.adminMode? null: tag({class: "buttons-container"}, [
				makeButton("Редактировать", () => this.editTask(task))
			])
		])
	}

}