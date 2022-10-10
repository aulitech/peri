import { writable } from 'svelte/store';
export const tabs = writable({});
export const phrases = writable([]);
import data from '$lib/phrases.json';

const cardDetails = {};
let loaded = false;
let myTabs = {}
let myPhrases = []
let starters = []
let counts = {}


function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

export const fetchCards = async() => {
    if (loaded) return;
    const loadedCards = data.map(makeTab);

    tabs.set(myTabs);
    // Create the phrase table
    myPhrases = myPhrases.sort().map(phrase => phrase.trim()).filter(onlyUnique);
    // Create a new table with just the first three words
    starters = myPhrases.map(phrase => phrase.split(' ').slice(0, 1).join(' '));
    // Determine the frequency of each Starter
    counts = starters.reduce(function(acc, key) {
        return acc[key] ? ++acc[key] : acc[key] = 1, acc
    }, {});
    // Sort the starters
    starters = Object.entries(counts).sort((a, b) => a[1] - b[1]);
    phrases.set(myPhrases);
    loaded = true;
};

function makeUniqueKey(s) {
    // This should Scan and make sure the key is unique
    // When is built correctly. This is a hack OK
    let key = (!s) ? "" : s.replace(/[^0-9_a-zA-Z ]/g, "-")
    let keys = Object.keys(myTabs)

    let suffix = 1;
    while (key in keys) {
        key = key.replace(/_*\d*$/, "_" + suffix++)
    }

    return key
}

function addPhrase(phrase) {
    myPhrases.push(phrase.phrase)
}

function makeTab(data, index) {
    const key = makeUniqueKey(data.category);
    if (!myTabs[key]) myTabs[key] = [];
    myTabs[key].id = index;
    data.phrases.forEach((phrase, phraseIndex) => {
        myTabs[key].push({
            name: phrase.phrase,
            id: phraseIndex,
            image: ``
        })
        addPhrase(phrase);
    })
}

export const getCardsById = async(id) => {

    return null;
    /*
        if (cardDetails[id]) return cardDetails[id];

        try {
            const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
            const res = await fetch(url);
            const data = await res.json();
            cardDetails[id] = data;
            return data;
        } catch (err) {
            console.error(err);
            return null;
        }
        */
};