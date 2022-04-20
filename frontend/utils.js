export function waitDocumentLoaded() {
	return new Promise(ok => {
		let check = () => {
			if(document.readyState === "interactive"){
				document.removeEventListener("readystatechange", check, false)
				ok()
				return true
			}
			return false
		}

		if(check()){
			return
		}

		document.addEventListener("readystatechange", check, false)
	})
}

export function tag(maybeDescriptionOrChildren, maybeChildren) {
	let description
	let children = undefined
	if(!maybeDescriptionOrChildren){
		description = {}
		children = maybeChildren || undefined
	} else if(Array.isArray(maybeDescriptionOrChildren)){
		description = {}
		children = maybeDescriptionOrChildren
	} else {
		description = maybeDescriptionOrChildren
		children = maybeChildren || undefined
	}

	let res = document.createElement(description.tagName || "div")

	for(let k in description){
		let v = description[k]
		switch(k){
			case "tagName":
				break
			case "text":
				res.textContent = v + ""
				break
			case "class":
				res.className = Array.isArray(v) ? v.filter(x => !!x).join(" ") : v + ""
				break
			case "style":{
				for(let key in v){
					res.style[key] = v[key] + ""
				}
				break
			}
			default:
				res.setAttribute(k, v + "")
				break
		}
	}

	if(children){
		for(let child of children){
			if(!child){
				continue
			}
			res.appendChild(child instanceof HTMLElement ? child : tag(child))
		}
	}

	return res
}

export function makeButton(text, onclick){
	let result = tag({tagName: "a", href: "#", class: "button", text})
	result.addEventListener("click", e => {
		e.preventDefault()
		onclick(e)
	})
	return result
}

export function removeAllChildren(el){
	while(el.firstChild){
		el.firstChild.remove()
	}
}