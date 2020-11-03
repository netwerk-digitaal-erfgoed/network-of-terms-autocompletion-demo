import AutoComplete from "@hdelva/termennetwerk_client";
import * as RdfString from "rdf-string";

let currentSubjects = [];

const client = new AutoComplete.examples.StrictAutoComplete([
    "https://termen.opoi.org/nta",
    "https://termen.opoi.org/vtmk",
    "https://termen.opoi.org/cht",
    "https://termen.opoi.org/rkdartists"
], 10);

client.on("data", (data) => {
    currentSubjects.push(data.subject.value);
    const results = [];
    for (const quad of client.resolveSubject(data.subject.value)) {
        results.push(RdfString.quadToStringQuad(quad));
    }
    postMessage(["member", results]);
})

client.on("reset", () => {
    currentSubjects = [];
    postMessage(["reset"]);
})

client.on("end", () => {
    postMessage(["reset"]);
    for (const subject of currentSubjects) {
        const results = [];
        for (const quad of client.resolveSubject(subject)) {
            results.push(RdfString.quadToStringQuad(quad));
        }
        postMessage(["member", results]);
    }
    postMessage(["end"]);
})

onmessage = function (e) {
    currentSubjects = new Set();
    client.query(e.data);
}
