import * as Http from "http"
import {promises as Fs} from "fs"
import * as Path from "path"
import * as Mime from "mime-types"

// сервер, раздающий немного статики и дергающий за апи. отвечает за роутинг.
// имеет немного захардкоженных значений, но для тестового задания пойдет
export class HttpServer {

	constructor(staticDir, onApiCall, port, incomingRequestSizeLimit){
		this.staticDir = staticDir
		this.onApiCall = onApiCall
		this.port = port
		this.knownStaticFiles = new Set()
		this.incomingRequestSizeLimit = incomingRequestSizeLimit
		this.server = Http.createServer(this.handleRequest.bind(this));
	}

	async start(){
		await this.findStaticFiles()
		await new Promise((ok, bad) => {
			try {
				this.server.listen(this.port, ok)
			} catch(e){
				bad(e)
			}
		})
	}

	async findStaticFiles(){
		let filenames = await Fs.readdir(this.staticDir)
		for(let name of filenames){
			let fullPath = Path.resolve(this.staticDir, name)
			let stat = await Fs.stat(fullPath)
			if(!stat.isDirectory()){
				this.knownStaticFiles.add(name.toLowerCase())
			}
		}
	}

	readBody(req){
		return new Promise((ok, bad) => {
			try {
				if((req.method).toUpperCase() !== "POST"){
					return ok(null);
				}
				let body = []
				let len = 0
		
				let onData = chunk => {
					try {
						len += chunk.length;
						if(len > this.incomingRequestSizeLimit){
							req.off("data", onData);
							bad(new Error("Payload size exceeded."));
						}
			
						body.push(chunk);
					} catch(e){
						bad(e)
					}
				}
		
				req.on("data", onData);
				req.on("error", bad);
				req.on("end", () => ok(Buffer.concat(body, len)));
			} catch(e){
				bad(e)
			}
		})
	}

	async handleRequest(req, res){
		try {
			console.error(new Date().toLocaleString() + "\t| " + req.url)
			await this.innerHandleRequest(req, res)
		} catch(e){
			console.error(e.stack)
			res.writeHead(500)
			res.end("Server-side error")
		}
	}

	async innerHandleRequest(req, res){
		// отключаем кеш
		// в реальном проекте так делать не надо бы,
		// но там обычно бывают более изящные средства управления кешем
		res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
		res.setHeader("Pragma", "no-cache")
		res.setHeader("Expires", "0")
		
		let url = new URL(req.url, "http://localhost")
		let path = url.pathname.toLowerCase()
		if(req.method.toUpperCase() === "GET"){
			let fileName;
			if(path.length < 1){
				fileName = path
			} else if(!path.startsWith("/")){
				throw new Error("Invalid path") // ???
			} else {
				fileName = path.substring(1)
			}
			if(fileName === ""){
				fileName = "index.html"
			}
			if(this.knownStaticFiles.has(fileName + ".js")){
				fileName += ".js"
			}
			if(!this.knownStaticFiles.has(fileName)){
				res.writeHead(404)
				res.end("Not Found")
				return
			}
			let encoding = fileName.endsWith("ttf")? undefined: "utf-8"
			let fileContent = await Fs.readFile(Path.resolve("./frontend", fileName), encoding)
			res.setHeader("Content-Type", Mime.lookup(fileName));
			res.writeHead(200)
			res.end(fileContent)
		} else if(req.method.toUpperCase() === "POST") {
			if(!path.startsWith("/api/")){
				res.writeHead(404)
				res.end("Not Found")
				return
			}
			path = path.substring("/api/".length)
			let body = JSON.parse(await this.readBody(req))
			await this.onApiCall(path, body, req, res)
		} else {
			res.writeHead(405)
			res.end("Method Not Allowed")
		}
	}
}