import {promises as Fs} from "fs"
import {HttpServer} from "./http_server.js"
import {DbClient} from "./db_client.js"
import {apiFunctions} from "./api.js"
import {ApiError} from "../frontend/api_error.js"

async function main(){
	let config = JSON.parse(await Fs.readFile("./backend/config.json", "utf-8"))
	config.db.password = (await Fs.readFile(config.db.pwd_file, "utf-8")).trim()

	let dbClient = new DbClient(config.db)
	let server = new HttpServer("./frontend", handleApiCall, config.http.port, config.http.request_size_limit)
	await server.start()

	async function handleApiCall(apiFnName, apiFnBody, req, res){
		let apiFn = apiFunctions[apiFnName]
		if(!apiFn){
			res.writeHead(404)
			res.end("Not Found")
			return
		}
		await dbClient.inTransaction(async db => {
			try {
				let callResult = await apiFn(db, apiFnBody, res, req)
				res.setHeader("Content-Type", "application/json");
				res.writeHead(200)
				res.end(JSON.stringify({success: true, result: callResult}))
			} catch(e){
				if(e instanceof ApiError){
					console.error(e.message)
					res.setHeader("Content-Type", "application/json");
					res.writeHead(500)
					res.end(JSON.stringify({success: false, errorType: e.apiErrorType, errorMessage: e.message}))
				} else {
					console.error(e.stack)
					res.setHeader("Content-Type", "application/json");
					res.writeHead(500)
					res.end(JSON.stringify({success: false, errorType: "generic_error", errorMessage: "Что-то пошло не так."}))
				}
			}
		})
	}
}

main()