import * as Autocomplete from "@hdelva/termennetwerk_client";
import * as RdfString from "rdf-string";

let currentResults = [];

const client = new Autocomplete.StrictAutoComplete([
    "https://termen.opoi.org/nta",
    "https://termen.opoi.org/vtmk",
    "https://termen.opoi.org/cht",
    "https://termen.opoi.org/rkdartists"
], 10);

client.on("data", (quad, meta) => {
    const allQuads = [];
    for (const otherQuad of client.resolveSubject(quad.subject.value)) {
        // sending objects to the main thread implicitly serializes everything
        // we lose all the rdf-js methods, unless we explicitly (de)serialize those ourselves
        allQuads.push(RdfString.quadToStringQuad(otherQuad));
    }
    meta.quads = allQuads;
    currentResults.push([quad, meta]);
    postMessage(["data", RdfString.quadToStringQuad(quad), meta]);
})

client.on("reset", () => {
    currentResults = [];
    postMessage(["reset"]);
})

client.on("end", () => {
    postMessage(["reset"]);
    for (const [quad, meta] of currentResults) {
        const allQuads = [];
        for (const otherQuad of client.resolveSubject(quad.subject.value)) {
            allQuads.push(RdfString.quadToStringQuad(otherQuad));
        }
        meta.quads = allQuads;
        postMessage(["data", RdfString.quadToStringQuad(quad), meta]);
    }
    postMessage(["end"]);
})

onmessage = function (e) {
    currentResults = [];
    client.query(e.data);
}
