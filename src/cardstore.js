import { writable } from 'svelte/store';
export const phrases = writable([]);
import data from '$lib/phrasetable.json';
const phrasefile = "myphrases.json"

let loaded = false;
let myPhrases = data.phrases.map(makePhrases);
myPhrases = myPhrases.sort().map(phrase => phrase.trim()).filter(onlyUnique);
let defaultPhrases = data.phrases.map(makePhrases);
defaultPhrases = myPhrases.sort().map(phrase => phrase.trim()).filter(onlyUnique);
let phraseSet = new Set(myPhrases);

let aliases = []
let starters = []
let counts = {}

const dbName = 'MyTestDatabase';
let db;

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

export const fetchCards = async() => {
    if (loaded) return;
    aliases = data.aliases

    //myPhrases = data.phrases.map(makePhrases)

    // Create the phrase table

    //myPhrases = myPhrases.sort().map(phrase => phrase.trim()).filter(onlyUnique)

        // Create a new table with just the first three words
    
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

export async function initializeApp(){
    try {
        const database = await openDatabase();
        myPhrases = await getAllPhrases(database);
        handleTimeStamps(database);
        updatePhrasesfromDB();
        console.log('here1');
    } catch(error) {
        console.error('Database initialization error:', error);
    }
}

function handleTimeStamps(database) {
    resetPhraseWeights(database);
    getAllTimeStamps(database);
}

// Function to check if the database exists
async function checkDatabaseExists() {
    return new Promise((resolve) => {
        const request = indexedDB.open(dbName); // Open without version to check existence
        request.onerror = (event) => {
            resolve(false); // Database doesn't exist
        };
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(true); // Database exists
        };
    });
}

async function openDatabase() { //get rid of phrases argument
    console.log("Opening database...");
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName); // Open without a version to get the current version
  
      request.onerror = (event) => {
        console.error("Database error:", event.target.error);
        reject(event.target.error);
      };
      request.onsuccess = (event) => {
        db = event.target.result;
        const existingObjectStores = Array.from(db.objectStoreNames);
        console.log('object store:', existingObjectStores);
        if (!existingObjectStores.includes("phrases") || !existingObjectStores.includes("timeStamps")) {
          db.close(); // Close the current connection
          const upgradeRequest = indexedDB.open(dbName, db.version + 1); // Increment the version to trigger onupgradeneeded
  
          upgradeRequest.onerror = (event) => {
            console.error("Upgrade error:", event.target.error);
            reject(event.target.error);
          };
  
          upgradeRequest.onupgradeneeded = (event) => {
            console.log("Upgrading database...");
            db = event.target.result;
            if(!db.objectStoreNames.contains("phrases")){
                db.createObjectStore("phrases", { keyPath: "phrase" });
            }
            if(!db.objectStoreNames.contains("timeStamps")){
                db.createObjectStore("timeStamps", { autoIncrement: true });
            }
          };
          if (phraseStoreEmpty()) { //slight edge case that if the user deletes every phrase, it will repopulate but we can account for this with a boolean variable (come back to this)
            setDefaultPhrases();
          }
  
          upgradeRequest.onsuccess = (event) => {
            db = event.target.result;
            console.log("Database opened successfully. Version:", db.version);
            resolve(db);
          };
        } else {
          console.log("Database already exists. Version:", db.version);
          resolve(db);
        }
      };
    });
  }

////Come back and make phraseStoreEmpty more efficient!

async function phraseStoreEmpty(){ //!!!!!can make efficient by just checking if the first phrase in the phrase store exists instead of loading the entire store
    const phrases = await getAllPhrases(db)
    if (phrases.length == 0){
        return true;
    }
    return false;
}

export async function setDefaultPhrases(){
    const transaction = db.transaction(["phrases", "timeStamps"], "readwrite");
    const phraseStore = transaction.objectStore("phrases");
    const timeStampStore = transaction.objectStore("timeStamps");
    try {
        await timeStampStore.clear();
        await phraseStore.clear(); // Clear the existing object store
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
                        await timeStampStore.delete(timeStampId);
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
                            console.log(existingPhrase); 
                            if (existingPhrase) {
                            const timeElapsed = Date.now() - timeStampId.timeStamp;
                            const maxWeightAge = maxAgeDays * 24 * 60 * 60 * 1000;
                            //const weight = Math.max(0, (maxWeightAge - timeElapsed) / maxWeightAge);
                            const weight = 1 / (Date.now() - timeStampId.timeStamp + 1);
                            existingPhrase.weight = (existingPhrase.weight || 0) + weight;
                            phraseStore.put(existingPhrase); // Update the existing object 
                            //updatedPhrases.push(existingPhrase);
                            console.log("Phrase weight updated:", existingPhrase.phrase, existingPhrase.weight);
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

export async function addTimeStampToDB(phrase){
    const transaction = db.transaction(["timeStamps"], "readwrite");
    const timeStampStore = transaction.objectStore("timeStamps");
    const timeStamp = Date.now();
    const addRequest = timeStampStore.add({ timeStamp: timeStamp, phrase: phrase });
    addRequest.onsuccess = (event) => {
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

export async function addPhraseToDB(phrase){
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
                console.log('Phrase added:', phrase);
            };
            request.onerror = (event) => {
                console.error('Error adding phrase:', event.target.error);
            };
            updatePhrasesfromDB();
        }

        await new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error("Transaction error:", error);
        // Handle the transaction error (e.g., rollback, retry)
    }
    //myPhrases = await getAllPhrases(db);
    //const request = objectStore.add(phrase);
    //request.onsuccess = (event) => {
      //  console.log('success ' + event.target.result);
    //}
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

async function updatePhrasesfromDB(){
    const newPhrases = await getSortedPhrases();
    phrases.set(newPhrases);
}

export async function getPhraseFromDB(phrase){
    let result;
    return new Promise((resolve, reject) => {
        db.transaction("phrases")
        .objectStore("phrases")
        .get(phrase).onsuccess = (event) => {
            result = event.target.result;    
            console.log(result);  
            resolve(result);
        }
    });
    //output.then(return output);
    return result;
}
async function isObjectStoreEmpty(db, objectStoreName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([objectStoreName], "readonly");

        const countRequest = objectStore.count();

        countRequest.onsuccess = (event) => {
            resolve(event.target.result === 0);
        };

        countRequest.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

async function getAllPhrases(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["phrases"], "readonly");
        const objectStore = transaction.objectStore("phrases");
        const request = objectStore.getAll();

        request.onsuccess = (event) => {
            const phrases = event.target.result.map(item => item.phrase); // Extract the 'phrase' values
            /*
            if (phrases.length == 0) { //populating phrases shouldn't be here!!!! I think
                //const phraseObjectStore = event.target.transaction.objectStore("phrases");
                populatePhrases();
            }
            */
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
            console.log('phrases1:',phrases);
            /*
            if (phrases.length == 0) { //populating phrases shouldn't be here!!!! I think
                //const phraseObjectStore = event.target.transaction.objectStore("phrases");
                populatePhrases();
            }
            */
            resolve(phrases);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}