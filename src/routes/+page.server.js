// +page.server.js
import { error } from '@sveltejs/kit'; // Import the error function for handling errors
import fs from 'fs';
import path from 'path';

async function load() {
  try {
    // 1. Read the file (assuming it's in the 'static' folder)
    console.log('first')
    const subtitleText = await fs.promises.readFile(path.join(process.cwd(), '././static', 'en.txt'), 'utf-8');
    // 2. Extract phrases
    const extractedPhrases = extractPhrases(subtitleText);
    console.log(extractedPhrases);

    // 3. Return the phrases as props
    return {
      props: {
        phrases: extractedPhrases 
      }
    };
  } catch (err) {
    // 4. Handle errors gracefully
    console.error('Error loading subtitles:', err);
    throw error(500, 'Internal Server Error'); 
  }
}

function extractPhrases(text) {
    const lines = text.split('\n'); 
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