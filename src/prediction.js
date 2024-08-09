import * as ngram from 'n-gram';
import fs from 'fs';
import path from 'path';

let ngramModel;
let trigramFrequencies;
const subtitlePhrases = await readSubtitlesFromFile();
await initializeModel(subtitlePhrases);
//console.log('model', ngramModel)
console.log('predictions', getPredictions('bro you cant count him'));

async function readSubtitlesFromFile() {
    try {
      const subtitleText = await fs.promises.readFile(path.join(process.cwd(), 'static', 'en.txt'), 'utf-8');
      return subtitleText;
    } catch (error) {
      console.error('Error reading subtitles from file:', error);
    }
  }

/*async function fetchSubtitlesFromFile() {
    console.log('why here?')
    const url = '/en.txt'; // Adjust the path if needed
    const chunkSize = 1024 * 1024; // 1MB chunks (adjust as needed)
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const reader = response.body.getReader(); 
  
      let subtitleText = '';
      let done, value;
  
      while (!(done && value === undefined)) {
        ({ done, value } = await reader.read());
        if (value) {
          subtitleText += new TextDecoder("utf-8").decode(value); // Decode the chunk
  
          // Process the chunk immediately or accumulate for later processing
          const extractedPhrases = extractPhrases(subtitleText);
          console.log(extractedPhrases);
          // ... (Do something with the extracted phrases, e.g., add to IndexedDB)
        }
      }
  
      return subtitleText; // Or return the accumulated extracted phrases
    } catch (error) {
      console.error('Error fetching subtitles:', error);
      // Handle the error appropriately
    }
}*/

async function initializeModel(phrases) {
    const trigramFunction = new ngram.nGram(3); // Create a trigram model (n=3)

    const trigrams = extractPhrases(phrases);
    //console.log(trigrams)
    trigramFrequencies = new Map();
    for (const trigram of trigrams) {
        const words = trigram.split(' ');
        const key = words.slice(0, 2).join(' '); // First two words as the key
        const continuation = words[2]; // Third word as the continuation
      
        if (!trigramFrequencies.has(key)) {
          trigramFrequencies.set(key, new Map()); // Initialize a new map for continuations
        }
      
        const continuationsMap = trigramFrequencies.get(key);
        const currentCount = continuationsMap.get(continuation) || 0;
        continuationsMap.set(continuation, currentCount + 1);
    }
    //console.log(trigramFrequencies);
}

function extractPhrases(text) {
    // 1. Split the text into lines (phrases) based on newline characters
    const lines = text.split('\n'); 
  
    // 2. Process each line separately
    const trigramFunction = ngram.nGram(3);
    let allTrigrams = [];
    for (const line of lines) {
      const words = line.trim().split(/\s+/); // Split on whitespace and trim
      if (3 <= words.length && words.length <= 5) { 
        //const phrase = words.join(' ').toLowerCase();
        //allTrigrams.push(...trigramFunction(words));
        for (let i = 0; i <= words.length - 3; i++) {
            const trigram = words.slice(i, i + 3).join(' ').toLowerCase(); 
            allTrigrams.push(trigram);
        }
      }
    }
    return allTrigrams;
}

export function getPredictions(searchTerm) {
    const words = searchTerm.toLowerCase().trim().split(/\s+/);
    const prefix = words.slice(-2).join(" ");
    if (trigramFrequencies.has(prefix)) {
        const continuationMap = trigramFrequencies.get(prefix);
        const sortedContinuations = Array.from(continuationMap.entries())
            .sort((a, b) => b[1] - a[1]);
        const topPredictions = sortedContinuations.slice(0, 5).map(([word]) => word);
        return topPredictions
    } else { //technically don't need else 
        return [];
    }
}