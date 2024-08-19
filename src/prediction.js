import * as ngram from 'n-gram';
import fs from 'fs';
import path from 'path';
import { openSubtitleDatabase } from './database';

let trigramFrequencies;

export async function getTrigrams(){
    const subtitlePhrases = await fetchSubtitlesFromFile();
    const trigrams = await initializeModel(subtitlePhrases);
    return trigrams
}

export async function fetchSubtitlesFromFile() {
    const filePath = '/en.txt'; // Path relative to the 'static' folder
  
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const subtitleText = await response.text();
      return subtitleText;
    } catch (error) {
      console.error('Error fetching subtitles:', error);
      // Handle the error appropriately
    }
  }

export async function readSubtitlesFromFile() {
    try {
      const subtitleText = await fs.promises.readFile(path.join(process.cwd(), 'static', 'en.txt'), 'utf-8');
      return subtitleText;
    } catch (error) {
      console.error('Error reading subtitles from file:', error);
    }
}

export async function initializeModel(phrases) {
    console.log("Initializing Model...")
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
    return trigramFrequencies;
    //await openSubtitleDatabase(trigramFrequencies);
}   

function extractPhrases(text) {
    const lines = text.split('\n'); 
    let allTrigrams = [];
    for (const line of lines) {
      const words = line.trim().split(/\s+/); // Split on whitespace and trim
      if (3 <= words.length && words.length <= 5) { 
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