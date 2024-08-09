import { setDefaultPhrases } from "./cardstore";

let db;
let dbName = 'SubtitleDatabase';
let subtitleDBEmpty = false;

export async function openSubtitleDatabase() {
    console.log("Opening subtitle database...");
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
        if (!existingObjectStores.includes("trigrams")) {
            db.close(); // Close the current connection
            const upgradeRequest = indexedDB.open(dbName, db.version + 1); // Increment the version to trigger onupgradeneeded
    
            upgradeRequest.onerror = (event) => {
            console.error("Upgrade error:", event.target.error);
            reject(event.target.error);
            };
    
            upgradeRequest.onupgradeneeded = async (event) => {
                console.log("Upgrading database...");
                db = event.target.result;
                if(!db.objectStoreNames.contains("trigrams")){
                    db.createObjectStore("trigrams", { keyPath: "starter" });
                    await fillNGramStore('trigrams');
                }
            };
    
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

async function fillNGramStore(storeName) {
    const transaction = db.transaction(storeName, "readwrite");
    const objectStore = transaction.objectStore(storeName);
    try {
        await objectStore.clear(); //maybe unneccesary
        console.log("objectStore cleared") 

        for (let [starter, value] of storeName) {
            await objectStore.add({starter:starter, prediction: value})
        }
        console.log('ngrams added');
    } catch (error) {
        console.error("Error filling Ngram store:", error);
    }
}
