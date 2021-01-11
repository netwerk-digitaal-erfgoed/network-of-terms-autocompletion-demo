window.addEventListener('DOMContentLoaded', (event) => {
    new ClipboardJS('.btn-copy');
});

window.addEventListener('load', (event) => {
    const inputField = document.getElementById("autocomplete");
    const resultsElement = document.getElementById("results");
    let currentQuery = "";

    const autocomplete = new TreeComplete();

    function isPrimaryLabel(quad) {
        const predicate = quad.predicate.value;
        return predicate === "http://schema.org/name" || predicate === "http://www.w3.org/2004/02/skos/core#prefLabel";
    }

    function selectLabels(matches, allQuads) {
        let primaryLabels = [];
        let secondaryLabels = [];

        for (const [quad, overlap] of matches) {
            const predicate = quad.predicate.value;
            const value = quad.object.value;

            let destination;
            if (isPrimaryLabel(quad)) {
                destination = primaryLabels;
            } else {
                destination = secondaryLabels;
            }

            destination.push([value, overlap]);
        }

        secondaryLabels = secondaryLabels.sort();

        // sort all matches that are primary labels
        // if no matches are primary labels, fallback to a non-matching one
        if (primaryLabels.length === 0) {
            let candidates = [];
            for (const quad of allQuads) {
                if (isPrimaryLabel(quad)) {
                    candidates.push([quad.object.value, []]);
                }
            }
            if (candidates.length > 0) {
                // retain only the first one
                candidates = candidates.sort();
                primaryLabels = [candidates[0]];
            } else {
                primaryLabels = [secondaryLabels[0]];
                secondaryLabels = secondaryLabels.slice(1);
            }
        } else {
            primaryLabels = primaryLabels.sort();
        }

        return [primaryLabels, secondaryLabels]
    }

    function formatPrimaryLabel(value, overlap) {
        const element = document.createElement('span');
        element.setAttribute("class", "primary");
        element.innerText = value;
        return element;
    }

    function formatSecondaryLabel(value, overlap) {
        const element = document.createElement('span');
        element.setAttribute("class", "secondary");
        element.innerText = value;
        return element;
    }

    function showResult(element, matches, allQuads) {
        while (element.lastElementChild) {
            element.removeChild(element.lastElementChild);
        }

        const [primaryLabels, secondaryLabels] = selectLabels(matches, allQuads);

        const primaryElements = primaryLabels.map((a) => formatPrimaryLabel(...a));
        element.appendChild(...primaryElements);

        if (secondaryLabels.length > 0) {
            const secondaryElements = secondaryLabels.map((a) => formatSecondaryLabel(...a));
            element.appendChild(...secondaryElements);
        };

        const marker = new Mark(element);
        marker.mark(currentQuery, { ignorePunctuation: ":;.,-–—‒_(){}[]!'\"+=".split("") });
    }

    function reset() {
        while (resultsElement.lastElementChild) {
            resultsElement.removeChild(resultsElement.lastElementChild);
        }
        currentResults = new Map();
    }

    autocomplete.on("reset", (meta) => {
        if (meta.query === currentQuery) {
            reset();
        }
    });

    let currentResults = new Map();

    autocomplete.on("data", (quad, meta) => {
        if (currentQuery !== meta.query) {
            return;
        }

        const subject = quad.subject.value;

        let termElement;
        if (!currentResults.has(subject)) {
            currentResults.set(subject, [[[quad, meta.overlap]], meta.quads]);

            const listGroupItem = document.createElement("a");
            listGroupItem.setAttribute("href", subject);
            listGroupItem.setAttribute("class", "list-group-item list-group-item-action");

            const row = document.createElement("div");
            row.setAttribute("class", "row");

            const termColumn = document.createElement("div");
            termColumn.setAttribute("class", "col-sm-8 text-left result");
            termElement = document.createElement("p");
            termElement.setAttribute("class", "mb-1");
            termElement.id = subject;
            termColumn.appendChild(termElement);

            const buttonColumn = document.createElement('div');
            buttonColumn.setAttribute("class", "col-sm-4 text-right");
            const buttonElement = document.createElement('button');
            buttonElement.setAttribute("class", "btn btn-secondary btn-copy");
            buttonElement.setAttribute("data-clipboard-text", subject);
            buttonElement.textContent = "Kopieer URI";
            buttonElement.addEventListener("click", (event) => event.preventDefault(), false);
            buttonColumn.appendChild(buttonElement);

            row.appendChild(termColumn);
            row.appendChild(buttonColumn);
            listGroupItem.appendChild(row);
            resultsElement.appendChild(listGroupItem);
        } else {
            termElement = document.getElementById(subject);
            const [matches, _] = currentResults.get(subject);
            matches.push([quad, meta.overlap])
        }

        const [matches, allQuads] = currentResults.get(subject);
        showResult(termElement, matches, allQuads);
    })

    inputField.addEventListener("input", function (e) {
        var a, b, i, val = this.value;

        if (!val) {
            reset();
            currentQuery = "";
        } else if (val.trim() !== currentQuery) {
            reset();
            currentQuery = val.trim();
            autocomplete.query(val);
        }
    });
});
