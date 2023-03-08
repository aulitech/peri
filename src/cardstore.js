import { writable } from 'svelte/store';
export const phrases = writable([]);
import data from '$lib/phrasetable.json';
const phrasefile = "myphrases.json"

let loaded = false;
let myPhrases = []
let aliases = []
let starters = []
let counts = {}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

export const fetchCards = async() => {
    if (loaded) return;
    aliases = data.aliases
    myPhrases = data.phrases.map(makePhrases)

    // Create the phrase table
    myPhrases = myPhrases.sort().map(phrase => phrase.trim()).filter(onlyUnique)
        // Create a new table with just the first three words
    starters = myPhrases.map(phrase => phrase.split(' ').slice(0, 1).join(' '))
        // Determine the frequency of each Starter
    counts = starters.reduce(function(acc, key) {
        return acc[key] ? ++acc[key] : acc[key] = 1, acc
    }, {});
    // Sort the starters
    starters = Object.entries(counts).sort((a, b) => a[1] - b[1])
    phrases.set(myPhrases);
    loaded = true;
};

function expand(phrase) {
    // expand aliases here
    return phrase.txt
}

function makePhrases(phrase) {
    return expand(phrase)
}

function makeAliases() {
    return []
}

export async function savePhrases() {
    aliases = makeAliases()
    const opts = {
        startIn: 'documents',
        excludeAcceptAllOption: true,
        suggestedName: phrasefile,
        types: [{
            description: 'Phrase file (JSON)',
            accept: { 'application/json': ['.json'] },
        }],
    };
    // create a new handle
    const newHandle = await window.showSaveFilePicker(opts);

    // create a FileSystemWritableFileStream to write to
    const writableStream = await newHandle.createWritable();

    // write our file
    await writableStream.truncate(0)
    await writableStream.write('"{ aliases": ' + JSON.stringify(aliases) + ', "phrases": ' + JSON.stringify(myPhrases) + '}');
    // close the file and write the contents to disk.
    await writableStream.close();
}