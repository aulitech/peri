import fetch from 'node-fetch'

function onlyUnique(value, index, self) {
    // get rid of duplicate and null
    return (value === "") ? false : self.indexOf(value) === index;
}

async function fetchCompletions(term) {
    let url = 'https://api.typewise.ai/latest/completion/complete';
    const response = await fetch(url, {
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        //credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
                // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        //referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        method: 'POST',
        body: JSON.stringify({
            token: 'string',
            languages: ['en'],
            text: term,
            correctTypoInPartialWord: false,
            maxNumberOfPredictions: 20
        })
    });

    if (response.ok) {
        let comps = await response.json();
        //console.log("\n\nraw: " + JSON.stringify(comps))
        //comps = comps.predictions.map((p) => ((p.completionStartingIndex) ? term.slice(0, p.completionStartingIndex) : term) + p.text);
        comps = comps.predictions.map((p) => p.text);
        //console.log("\n\mapped: " + JSON.stringify(comps))
        comps = comps.filter(onlyUnique);
        //console.log("\n\nsorted: " + JSON.stringify(comps))
        return comps;
    } else {
        const message = `Error: ${response.status}`;
        throw new Error(message);
    }
}

fetchCompletions(process.argv.slice(2)[0]).then(
    function(value) {
        console.log(JSON.stringify(value))
    }
)