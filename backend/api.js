import * as Crypto from "crypto"
import {ApiError} from "../frontend/api_error.js"

export let apiFunctions = {

	sign_in: async (db, {login, password}, response) => {
		let admin = (await db.query(
			"select * from admins where login = $1 limit 1", 
			[login]
		)).rows[0]
		if(!admin){
			throw new ApiError("no_user", "Логин и/или пароль неправильный.")
		}
		if(admin.passwordHash !== secureHash(password, login)){
			throw new ApiError("no_user", "Логин и/или пароль неправильный.")
		}
		if(!admin.token){
			// тут можно было бы наворотить кучу всякого про рефреш-токены, или JWT
			// но для тестового проекта пусть будет самый простой вариант - рандомный токен в базе
			admin.token = secureHash(Math.random() + "" + Math.random() + "" + Math.random(), "salt")
			await db.query(
				"update admins set token = $1 where login = $2",
				[admin.token, login]
			)
		}
		response.setHeader("Set-Cookie", `${tokenCookieName}=${admin.token}; path=/; HttpOnly; expires=Fri, 31 Dec 9999 23:59:59 GMT`)
		return admin
	},

	sign_out: async (db, _, response, request) => {
		let admin = await getCurrentUser(request, db)
		await db.query(
			"update admins set token = null where login = $1", 
			[admin.login]
		)
		response.setHeader("Set-Cookie", `${tokenCookieName}=null; path=/; HttpOnly; expires=Thu, 01 Jan 1970 00:00:00 GMT`);
		return null
	},

	get_current_user: async (db, _, __, request) => {
		let admin = getCurrentUser(request, db)
		delete admin.passwordHash
		return admin
	},

	fetch_tasks: async (db, {page, sortBy, sortAsc}) => {
		// в реальном проекте обычно есть способ делать это более красиво
		// средствами ОРМ, например, или валидацией на входе
		// но тут сделаем по-простому
		if(!allowedSortingFields.has(sortBy)){
			throw new ApiError("bad_data", "Нельзя сортировать по этому полю.")
		}
		// неоптимально, но ничего лучше сходу не придумалось
		let count = (await db.query("select count(*) as c from tasks")).rows[0].c
		let tasks = (await db.query(
			`select * from tasks order by "${sortBy}" ${sortAsc? "asc": "desc"}, id offset $1 limit $2`, 
			[page * pageSize, pageSize]
		)).rows
		return {count, tasks, pageSize}
	},

	create_task: async (db, {username, email, body}) => {
		if(!username.trim() || !email.match(/^\S+@\S+\.\S+$/) || !body.trim()){
			throw new ApiError("bad_data", "Входные данные невалидны.")
		}
		
		let resultId = (await db.query(
			"insert into tasks(username, email, body) values($1, $2, $3) returning id", 
			[ username, email, body ]
		)).rows[0].id
		return resultId
	},

	update_task: async (db, {id, body, completed}, _, request) => {
		if(!body.trim()){
			throw new ApiError("bad_data", "Входные данные невалидны.")
		}
		await getCurrentUser(request, db)
		let oldTask = (await db.query(
			"select * from tasks where id = $1",
			[id]
		)).rows[0]
		if(!oldTask){
			throw new ApiError("bad_data", "Нет задачи с таким ID.")
		}
		let editedByAdmin = oldTask.editedByAdmin || oldTask.body !== body
		await db.query(
			`update tasks set body = $1, completed = $2, "editedByAdmin" = $3 where id = $4`,
			[ body, !!completed, editedByAdmin, id ]
		)
	}
	
}

let allowedSortingFields = new Set(["email", "username", "completed"])
let pageSize = 3
let tokenCookieName = "beejee_admin_token"

// получить текущего пользователя, или выкинуть ошибку, если такого нет
async function getCurrentUser(req, db){
	let token = (req.headers.cookie || "")
		.split(";")
		.map(cookieItemStr => {
			let [key, value] = cookieItemStr.trim().split("=")
			return {key: key.trim(), value: value.trim()}
		})
		.filter(cookieItem => cookieItem.key === tokenCookieName)
		.map(cookieItem => cookieItem.value)[0]
	if(!token){
		throw new ApiError("not_logged_in", "Вы не залогинены.")
	}
	let admin = (await db.query(
		"select * from admins where token = $1 limit 1", 
		[token]
	)).rows[0]
	if(!admin){
		throw new ApiError("not_logged_in", "Вы не залогинены.")
	}
	return admin
}

function secureHash(content, salt) {
	return Crypto
		.createHmac("sha512", salt)
		.update(content.toLowerCase())
		.digest("hex")
		.toLowerCase()
}