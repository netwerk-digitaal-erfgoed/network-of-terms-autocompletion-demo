import Worker from "./workers/worker";
import * as RdfString from "rdf-string";
import { EventEmitter } from "events";

export default class AutoCompleteWorker extends EventEmitter {
    protected worker: Worker;

    constructor() {
        super();
        this.worker = new Worker();

        const self = this;
        this.worker.onmessage = (e) => {
            const [type, meta, value] = e.data;
            if (type == "reset") {
                self.emit("reset", meta);
            } else if (type == "end") {
                self.emit("end", meta);
            } else {
                const allQuads = [];
                for (const otherQuad of meta.quads) {
                    allQuads.push(RdfString.stringQuadToQuad(otherQuad));
                }
                meta.quads = allQuads;
                self.emit("data", RdfString.stringQuadToQuad(value), meta);
            }
        }
    }

    public async query(input: string) {
        this.worker.postMessage(input);
    }
}
