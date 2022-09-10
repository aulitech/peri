import { writable } from 'svelte/store';
export const tabs = writable({});
import data from '$lib/phrases.json';

const cardDetails = {};
let loaded = false;
let myTabs = {}

export const fetchCards = async() => {
    if (loaded) return;
    const loadedCards = data.map(makeTab);

    tabs.set(myTabs);
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