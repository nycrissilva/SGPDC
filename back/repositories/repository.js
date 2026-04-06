import Database from "../db/database.js";

export default class Repository {
    constructor() {
        this.banco = new Database();
    }
}
