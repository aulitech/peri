import { writable } from 'svelte/store';
import { initializeModel, readSubtitlesFromFile, getTrigrams, fetchSubtitlesFromFile, getPredictions } from './prediction';
export const phrases = writable([]);
export const categoryWritable = writable(new Map());
export const tagWritable = writable(new Map());
import data from '$lib/phrasetable.json';
const phrasefile = "myphrases.json"

let loaded = false;
let myPhrases = data.phrases.map(phrase => makePhrases(phrase).phrase);
myPhrases = myPhrases.sort().map(phrase => phrase.trim()).filter(onlyUnique);
let defaultPhrases = data.phrases.map(phrase => makePhrases(phrase).phrase);
defaultPhrases = defaultPhrases.sort().map(phrase => phrase.trim()).filter(onlyUnique);
let phrasesWithCategories = data.phrases.map(makePhrases);
//console.log(phrasesWithCategories);
const customPhraseName = "Custom Phrase";
export let categoryMap = new Map();
export let tagMap = new Map();
populateCategoryMap();

let aliases = []
let starters = []
let counts = {}

const dbName = 'PhraseDatabase';
let db;
let lastTimeStampKey;
let trigramsRequested = true;
let trigramDBEmpty = false;

function populateCategoryMap() {
    for (const phraseObj of phrasesWithCategories) {
        if (categoryMap.has(phraseObj.category)) {
            let categorySet = categoryMap.get(phraseObj.category);
            categorySet.add(phraseObj.phrase);
            categoryMap.set(phraseObj.category, categorySet);
        } else {
            categoryMap.set(phraseObj.category, new Set([phraseObj.phrase]));
        }
    }
    if (!categoryMap.has(customPhraseName)) {
        categoryMap.set(customPhraseName, new Set());
    }
}


function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

export const fetchCards = async() => {
    if (loaded) return;
    aliases = data.aliases
    starters = myPhrases.map(phrase => phrase.split(' ').slice(0, 1).join(' '))
        // Determine the frequency of each Starter
    counts = starters.reduce(function(acc, key) {
        return acc[key] ? ++acc[key] : acc[key] = 1, acc
    }, {});
    // Sort the starters
    starters = Object.entries(counts).sort((a, b) => a[1] - b[1])
    loaded = true;
};

function expand(phrase) {
    // expand aliases here
    return {phrase: phrase.txt, category: phrase.category};
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

async function phraseStoreEmpty(database){
    const transaction = database.transaction(["phrases"], "readwrite");
    const objectStore = transaction.objectStore("phrases");
    return new Promise((resolve) => {
        const request = objectStore.count();
        request.onsuccess = (event) => {
            const phraseCount = event.target.result;
            if (phraseCount == 0){
                resolve(true);
            }else{
                resolve(false);
            }
        }
    });
}

export async function initializeApp(){
    try {
        const database = await openDatabase();
        myPhrases = await getAllPhrases(database);
        handleTimeStamps(database);
        updatePhrasesfromDB();
        populateCategoriesFromDB();
        populateTagsFromDB();
        console.log(categoryMap);
        console.log('tags', tagMap);
    } catch(error) {
        console.error('Database initialization error:', error);
    }
}



function handleTimeStamps(database) {
    resetPhraseWeights(database);
    getAllTimeStamps(database);
}

async function openDatabase() { //get rid of phrases argument
    console.log("Opening database...");
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName); // Open without a version to get the current version
  
      request.onerror = (event) => {
        console.error("Database error:", event.target.error);
        reject(event.target.error);
      };
      request.onsuccess = async (event) => {
        let phraseDBEmpty = false;
        db = event.target.result;
        const existingObjectStores = Array.from(db.objectStoreNames);
        if (!existingObjectStores.includes("phrases") || !existingObjectStores.includes("timeStamps") || (!existingObjectStores.includes("trigrams") && trigramsRequested) || (!existingObjectStores.includes("addedPhrases")) || (!existingObjectStores.includes("tags"))) {
          db.close(); // Close the current connection
          const upgradeRequest = indexedDB.open(dbName, db.version + 1); // Increment the version to trigger onupgradeneeded
  
          upgradeRequest.onerror = (event) => {
            console.error("Upgrade error:", event.target.error);
            reject(event.target.error);
          };
  
          upgradeRequest.onupgradeneeded = async (event) => {
            console.log("Upgrading database...");
            db = event.target.result;
            if (!db.objectStoreNames.contains("phrases")){
                db.createObjectStore("phrases", { keyPath: "phrase" });
                phraseDBEmpty = true;
            }
            if (!db.objectStoreNames.contains("timeStamps")){
                db.createObjectStore("timeStamps", { autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("trigrams") && trigramsRequested) {
                db.createObjectStore("trigrams", { keyPath: "starter"});
                trigramDBEmpty = true;
            }
            if (!db.objectStoreNames.contains("addedPhrases")) {
                db.createObjectStore("addedPhrases", {keyPath: "phrase"});
            }
            if (!db.objectStoreNames.contains("tags")) {
                db.createObjectStore("tags", {keyPath: "tag"});
            }
          };
  
          upgradeRequest.onsuccess = async (event) => {
            db = event.target.result;
            console.log("Database opened successfully. Version:", db.version);
            resolve(db);
            if (phraseDBEmpty) {
                setDefaultPhrases();
                phraseDBEmpty = false;
            }
            if (trigramDBEmpty) {
                console.log('here2');
                await fillNGramStore('trigrams');
                trigramDBEmpty = false;
            }
          };
        } else {
          console.log("Database already exists. Version:", db.version);
          if(await phraseStoreEmpty(db)){
            setDefaultPhrases();
          }
          resolve(db);
        }
      };
    });
}

async function fillNGramStore(storeName) {
    let nGrams;
    if (storeName == 'bigrams') {
        //nGrams = await getB
    } else {
        nGrams = await getTrigrams()
        console.log(nGrams)
    }
    try {
        const transaction = db.transaction([storeName], "readwrite");
        const objectStore = transaction.objectStore(storeName);
        for (let [starter, value] of nGrams) {
            await objectStore.add({starter:starter, prediction: value});
        }
        console.log('ngrams added');
        //console.log(await getTrigramsFromDB());
    } catch (error) {
        console.error("Error filling Ngram store:", error);
    }
}

export async function getTrigramsFromDB() {
    const transaction = db.transaction(["trigrams"], "readwrite");
    const trigramStore = transaction.objectStore("trigrams");
    console.log("getting trigrams...");
    const allTrigrams = await getAllOfStore(trigramStore)
    console.log('trigrams', allTrigrams);
    return allTrigrams;
}

async function addPhraseToAddedPhrases(phraseObj) {
    const transaction = db.transaction(["addedPhrases"], 'readwrite');
    const phraseStore = transaction.objectStore("addedPhrases");
    phraseStore.put(phraseObj);
    const request = phraseStore.getAll();
    request.onsuccess = (event) => console.log('addedPhrases:', event.target.result);
}

function addPhraseToCategoryMap(phrase, category) {
    const currCategory = categoryMap.get(category);
    currCategory.add(phrase);
    categoryMap.set(category, currCategory);
}

async function populateCategoriesFromDB() {
    const transaction = db.transaction(["addedPhrases"], 'readwrite');
    const phraseStore = transaction.objectStore("addedPhrases");
    const request = phraseStore.getAll();
    request.onsuccess = (event) => {
        const addedPhrases = event.target.result;
        for (const phraseObj of addedPhrases) {
            if (categoryMap.has(phraseObj.category)) {
                let categorySet = categoryMap.get(phraseObj.category);
                categorySet.add(phraseObj.phrase);
                categoryMap.set(phraseObj.category, categorySet);
            } else {
                categoryMap.set(phraseObj.category, new Set([phraseObj.phrase]));
            }
        }
    };
}

async function populateTagsFromDB() {
    const transaction = db.transaction(["addedPhrases"], 'readwrite');
    const phraseStore = transaction.objectStore("addedPhrases");
    const request = phraseStore.getAll();
    request.onsuccess = (event) => {
        const addedPhrases = event.target.result;
        console.log('add', addedPhrases);
        for (const phraseObj of addedPhrases) {
            console.log(phraseObj);
            for (const tag of phraseObj.tags) {
                if (tagMap.has(tag)) {
                    let tagSet = tagMap.get(tag);
                    tagSet.add(tag);
                    tagMap.set(tag, tagSet);
                } else {
                    console.log(phraseObj.phrase);
                    tagMap.set(tag, new Set([phraseObj.phrase]));
                }
            }
        }
    };
}

export async function setDefaultPhrases() {
    const transaction = db.transaction(["phrases", "timeStamps", "addedPhrases", "tags"], "readwrite");
    const phraseStore = transaction.objectStore("phrases");
    const timeStampStore = transaction.objectStore("timeStamps");
    const addedStore = transaction.objectStore("addedPhrases");
    const tagStore = transaction.objectStore("tags");
    try {
        await timeStampStore.clear();
        await phraseStore.clear(); // Clear the existing object store
        await addedStore.clear();
        await tagStore.clear();
        tagMap = new Map();
        console.log("Object store cleared");

        // Add default phrases with frequencies
        for (const phrase of defaultPhrases) {
            await phraseStore.add({ phrase: phrase, frequency: 0, weight: 0 });
        }
        updatePhrasesfromDB();
        console.log("Default phrases added");
    } catch (error) {
        console.error("Error resetting to defaults:", error);
        // Handle the error appropriately (e.g., display an error message)
    }
}

async function getSortedPhrases() {
    const unsortedPhrases = await getAllPhraseFrequencies(db);

    const alphabeticalPhrases = unsortedPhrases.sort((a, b) => { //sort alphabetically
        const phraseA = a.phrase.toLowerCase();
        const phraseB = b.phrase.toLowerCase();
        if (phraseA < phraseB) return -1;
        if (phraseA > phraseB) return 1;
        return 0;
    });
    const sortedPhrases = alphabeticalPhrases.sort((a, b) => b.weight - a.weight); // Sort in descending order of frequency
    return sortedPhrases.map(item => item.phrase);
}

async function getAllTimeStamps(db, maxAgeDays = 7) {
    return new Promise(async (resolve, reject) => {
        const transaction = db.transaction(["timeStamps", "phrases"], "readwrite");
        const timeStampStore = transaction.objectStore("timeStamps");
        const phraseStore = transaction.objectStore("phrases");

        const request = timeStampStore.getAll();
        request.onsuccess = async (event) => {
            let timeStamps = event.target.result;
            const expirationTimestamp = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
            
            for (let i = 0; i < timeStamps.length; i++){
                const timeStampId = timeStamps[i];
                if (timeStampId.timeStamp < expirationTimestamp){
                    try {
                        await timeStampStore.delete(timeStampId.id);
                        timeStamps.splice(i, 1);
                        i--;
                    } catch(error) {
                        console.error("Error deleting timestamp", error);
                    } 
                } else {
                    try {
                        const phraseRequest = phraseStore.get(timeStampId.phrase);
                        phraseRequest.onsuccess = (event) => {
                            const existingPhrase = event.target.result;
                            if (existingPhrase) {
                                const timeElapsed = Date.now() - timeStampId.timeStamp;
                                const maxWeightAge = maxAgeDays * 24 * 60 * 60 * 1000;
                                //const weight = Math.max(0, (maxWeightAge - timeElapsed) / maxWeightAge);
                                const weight = 1 / (Date.now() - timeStampId.timeStamp + 1);
                                existingPhrase.weight = (existingPhrase.weight || 0) + weight;
                                phraseStore.put(existingPhrase); // Update the existing object 
                                //updatedPhrases.push(existingPhrase);
                                //console.log("Phrase weight updated:", existingPhrase.phrase, existingPhrase.weight);
                            }
                        }
                    } catch (error) {
                        console.error("Transaction error:", error);
                    }
                }
            }
        }
        request.onerror = (event) => {
            reject(event.target.error);
        }
    });
}

function addPhraseToTagMap(phrase, tags) {
    for (const tag of tags) {
        if (tagMap.has(tag)) {
            const currTag = tagMap.get(tag);
            currTag.add(phrase);
            tagMap.set(tag, currTag);
        } else {
            tagMap.set(tag, new Set([phrase]));
        }
        console.log(tag);
    }
    console.log(tagMap);
}

export function addPhrase(phrase, metaData = {category: customPhraseName, tags: []}) {
    const category = metaData.category;
    const tags = metaData.tags;
    addPhraseToDB(phrase);
    addTimeStampToDB(phrase);
    if (!defaultPhrases.includes(phrase)) {
        console.log(tags);
        addPhraseToTagMap(phrase, tags);
        addPhraseToCategoryMap(phrase, category);
        addPhraseToAddedPhrases({ phrase:phrase, category: category, tags: tags });
    }
    getPredictionsFromDB(phrase);
    updatePhrasesfromDB();
    //console.log('map', categoryMap);
}

export function getTagsAndFormatPhrase(tagPhrase) {
    const phraseWords = tagPhrase.split(' ');
    let formattedPhraseArr = [];
    let tags = [];
    let endTagged = true;
    console.log(tagPhrase);
    for (let i = phraseWords.length - 1; i >= 0; i--) {
        if (phraseWords[i].length > 0 && phraseWords[i].charAt(0) === '#' && endTagged) { //make sure word exists
            tags.unshift(phraseWords[i]); // maybe push to improve performance (but reverse order)
        } else if (phraseWords[i].length > 0 && phraseWords[i].charAt(0) === '#') {
            tags.unshift(phraseWords[i]);
            formattedPhraseArr.unshift(phraseWords[i].substring(1));
        } else {
            endTagged = false;
            formattedPhraseArr.unshift(phraseWords[i]);
        }
    }
    const formattedPhrase = formattedPhraseArr.join(' ');
    return [tags, formattedPhrase];
}

export function addPhraseWithTag(tagPhrase) {
    const formattedObject = getTagsAndFormatPhrase(tagPhrase);
    const tags = formattedObject[0];
    const formattedPhrase = formattedObject[1];
    addTagsToDB(tags);
    const metaDataObj = {category: customPhraseName, tags: tags};
    addPhrase(formattedPhrase, metaDataObj);
}

async function addTagsToDB(newTags) {
    const transaction = db.transaction(["tags"], "readwrite");
    const tagStore = transaction.objectStore("tags");
    for (const tag of newTags) {
        await tagStore.put({tag: tag});
    }
    //console.log(await getAllOfStore(tagStore));
}

async function getPredictionsFromDB(searchTerm) {
    const prefix = await getPrefixFromSearch(searchTerm, 2);
    console.log('prefix', prefix);
    const transaction = db.transaction(["trigrams"], "readwrite");
    const trigramStore = transaction.objectStore("trigrams");
    const existingTrigram = await (new Promise((resolve, reject) => {
        console.log(prefix);
        const trigramRequest = trigramStore.get(prefix);
        trigramRequest.onsuccess = (event) => resolve(event.target.result);
        trigramRequest.onerror = (event) => resolve();
    }));
    if (existingTrigram) {
        console.log('exists', existingTrigram);
        
    } else {
        console.log('doesnt exist');
    }
}

async function getPrefixFromSearch(searchTerm, suffixSize) {
    const words = searchTerm.toLowerCase().trim().split(/\s+/);
    return words.slice(-2).join(" ");
}

async function addTimeStampToDB(phrase){
    const transaction = db.transaction(["timeStamps"], "readwrite");
    const timeStampStore = transaction.objectStore("timeStamps");
    const timeStamp = Date.now();
    const addRequest = timeStampStore.add({ timeStamp: timeStamp, phrase: phrase });
    addRequest.onsuccess = (event) => {
        const addedKey = event.target.result;
        console.log('key', addedKey);
        timeStampStore.put({id: addedKey, timeStamp, phrase})
        lastTimeStampKey = addedKey;
        console.log('Timestamp added:', timeStampStore);
    }
    addRequest.onerror = (event) => {
        console.error("Error adding timestamp:", event.target.error);
    };
}

async function resetPhraseWeights(db) {
    const phrases = await getAllPhrases(db);
    try {
        for (const phrase of phrases) {
            const transaction = db.transaction(["phrases"], "readwrite");
            const phraseStore = transaction.objectStore("phrases");
            const phraseRequest = phraseStore.get(phrase);
            phraseRequest.onsuccess = (event) => {
                const currentPhrase = event.target.result;
                currentPhrase.weight = 0;
                phraseStore.put(currentPhrase);
            }
        }
    } catch (error) {
        console.error("Error resetting weights:", error);
    }
}

async function addPhraseToDB(phrase){
    const transaction = db.transaction(["phrases"], "readwrite");
    const objectStore = transaction.objectStore("phrases");
    try {
        const existingPhrase = await (new Promise((resolve, reject) => {
            const getRequest = objectStore.get(phrase);
            getRequest.onsuccess = (event) => resolve(event.target.result);
            getRequest.onerror = (event) => reject(event.target.error);
        }));
        
        if (existingPhrase) {
            existingPhrase.frequency++;
            await objectStore.put(existingPhrase);
            console.log("Phrase frequency updated:", phrase, existingPhrase.frequency);
        } else {
            const request = objectStore.add({ phrase: phrase, frequency: 1, weight: 0 }); // Ensure you're adding an object with a 'phrase' property
            request.onsuccess = (event) => {
                console.log('Phrase added:', event.target.result);
            };
            request.onerror = (event) => {
                console.error('Error adding phrase:', event.target.error);
            };
        }
        updatePhrasesfromDB();
        await new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error("Transaction error:", error);
    }
}

export async function deletePhraseFromDB(phrase){
    const transaction = db.transaction(["phrases"], "readwrite");
    const objectStore = transaction.objectStore("phrases");
    try {
        const existingPhrase = await (new Promise((resolve, reject) => {
            const getRequest = objectStore.get(phrase);
            getRequest.onsuccess = (event) => resolve(event.target.result);
            getRequest.onerror = (event) => reject(event.target.error);
        }));
        if(existingPhrase){
            const request = objectStore.delete(phrase);
            request.onsuccess = (event) => {
                console.log('Phrase deleted:', phrase);
            };
            request.onerror = (event) => {
                console.error('Error deleting phrase:', event.target.error);
            };
            updatePhrasesfromDB();
        } else {
            console.log(`phrase ${phrase} does not exist`);
        }
        await new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error("Transaction error:", error);
    }
}

async function getObjectFromStore(objectStore, objectKey) {
    return new Promise((resolve, reject) => {
        const objectRequest = objectStore.get(objectKey);
        objectRequest.onsuccess = (event) => {
            resolve(event.target.result);
        }
        objectRequest.onerror = (event) => {
            reject(event.target.error);
        }
    });
}

export async function undoAddPhrase() {
    const transaction = db.transaction(["phrases", "timeStamps"], "readwrite");
    const phraseStore = transaction.objectStore("phrases");
    const timeStampStore = transaction.objectStore("timeStamps");
    try {
        const lastTimeStamp = await getObjectFromStore(timeStampStore, lastTimeStampKey);
        console.log('phrases1', await getAllOfStore(phraseStore));

        const phraseRequest = phraseStore.get(lastTimeStamp.phrase);
        phraseRequest.onsuccess = (event) => {
            const existingPhrase = event.target.result;
            console.log(existingPhrase); 
            if (existingPhrase && existingPhrase.frequency > 1) {
                existingPhrase.frequency -= 1
                phraseStore.put(existingPhrase);
                console.log("Phrase frequency updated:", existingPhrase.phrase, existingPhrase.frequency);
            } else if(existingPhrase && existingPhrase.frequency == 1) {
                phraseStore.delete(existingPhrase.phrase);
                console.log('phraseDeleted', existingPhrase);
            }
        }
    } catch (error) {
        console.error("Transaction error:", error);
    }
    await timeStampStore.delete(lastTimeStampKey);
    lastTimeStampKey = null;
    updatePhrasesfromDB();
}

async function getAllOfStore(objectStore) {
    return new Promise((resolve, reject) => {
        const request = objectStore.getAll();
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        }
        request.onerror = (event) => {
            reject(event.target.error);
        }
    });
}

async function updatePhrasesfromDB(){
    getAllTimeStamps(db);
    const newPhrases = await getSortedPhrases();
    phrases.set(newPhrases);
    categoryWritable.set(categoryMap);
    tagWritable.set(tagMap);
}

export async function getPhraseFromDB(phrase){
    let result;
    return new Promise((resolve, reject) => {
        db.transaction("phrases")
        .objectStore("phrases")
        .get(phrase).onsuccess = (event) => {
            result = event.target.result; 
            resolve(result);
        }
    });
}

async function getAllPhrases(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["phrases"], "readonly");
        const objectStore = transaction.objectStore("phrases");
        const request = objectStore.getAll();

        request.onsuccess = (event) => {
            const phrases = event.target.result.map(item => item.phrase); // Extract the 'phrase' values
            resolve(phrases);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

async function getAllPhraseFrequencies(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["phrases"], "readonly");
        const objectStore = transaction.objectStore("phrases");
        const request = objectStore.getAll();

        request.onsuccess = (event) => {
            const phrases = event.target.result; // Extract the 'phrase' values
            resolve(phrases);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}