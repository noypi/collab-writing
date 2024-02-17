import { Socket } from "net";

export class client {
    topics: Set<string>
    socket: Socket;

    constructor() {
        this.topics = new Set<string>();
    }
}