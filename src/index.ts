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
            const [type, value] = e.data;
            if (type == "reset") {
                self.emit("reset");
            } else if (type == "end") {
                self.emit("end");
            } else {
                const r = [];
                for (const s of value) {
                    r.push(RdfString.stringQuadToQuad(s));
                }
                self.emit("member", r);
            }
        }
    }

    public async query(input: string) {
        this.worker.postMessage(input);
    }
}
