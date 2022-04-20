import Pg from "pg"

export class DbClient {
	constructor(config){
		this.pool = new Pg.Pool(config)
	}

	async inTransaction(action){
		let client = await this.pool.connect()
		try {
			await client.query("BEGIN")
			await Promise.resolve(action(client))
			await client.query("COMMIT")
		} catch (e) {
			await client.query("ROLLBACK")
			throw e
		} finally {
			client.release();
		}
	}
}