import {Schema, type} from "@colyseus/schema";

class Player extends Schema {
    @type("string") name: string;
    @type("number") x: number;
    @type("number") y: number;
    
    constructor(name: string) {
        super();
        this.name = name;
        this.x = Math.floor(Math.random() * 400);
        this.y = Math.floor(Math.random() * 400);
    }
}

export default Player