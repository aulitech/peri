<script>
	import { addPhraseWithTag, categoryWritable, tagWritable, getTagsAndFormatPhrase, fetchCards, phrases, categoryMap, savePhrases, initializeApp, undoAddPhrase, getPhraseFromDB, deletePhraseFromDB, addPhrase, setDefaultPhrases, getTrigramsFromDB } from '../cardstore';
	import Record from '../components/record.svelte';
	import Text from '../components/text.svelte';
	import Speak from '../components/speak.svelte';
	import Pause from '../components/pause.svelte';
	import Settings from '../components/settings.svelte';
	import { onMount } from 'svelte';
	//import { voiceMap } from '../lib/voices.js';

	let triedOnce = 0;
	let searchTerm = '';
	let startsWith = [];
	let contains = [];
	let starters = [];
	let completions = [];
	let nextWord = [];
	let dwellTimer;
	let dwellInterval = 1000;
	let searchKey = '';
	let keylength = 0;
	let editDeletedPhrase = null;
	let isPaused = true;
	let undoShown = false;
	let initialUndoClick = false;
	let settingsShown = false;
	let buttonVersion = false;
	let replaceVersion = true;
	let versionColor = 'white'; //red
	let voices = new Map();
	let femaleVoice = true;
	let currCategory;
	let currTag;
	let categoryArr = [];
	let tagArr = [];
	const defaultCategory = 'Select Category';
	const defaultTag = 'Select Tag';
	let apiCounter = 0;
	export let options = [];
	let selectedValue;
	let isDropdownOpen = false;

	function toggleDropdown() {
		console.log(isDropdownOpen);
		isDropdownOpen = !isDropdownOpen;
	}

    function showUndoButton() {
		//console.log(undoShown, 'shown');
        undoShown = true;
    }

    // Function to handle clicks anywhere on the page
    let handleClickOutside;

    onMount(() => {
		initializeApp();
        handleClickOutside = (event) => {
            const clickedElement = event.target;
            const undoButton = document.getElementById('undoButton'); // Get the undo button element
            if (undoButton && !undoButton.contains(clickedElement) && !initialUndoClick) { // Check if click is outside the button
				undoShown = false;
            } else if (undoButton && !undoButton.contains(clickedElement) && initialUndoClick) {
				initialUndoClick = false;
			}
        }

		if ('speechSynthesis' in window) {
			speechSynthesis.onvoiceschanged = function() {
				populateVoices();
			};
		}

        window.addEventListener('click', handleClickOutside);

        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    });

	function populateCategorySelect(categories) {
		const selectElement = document.getElementById('categorySelect');
		categories.forEach(item => {
			const option = document.createElement('option');
			option.value = item;
			option.text = item;
			selectElement.appendChild(option);
		});
	}

	function handleCategoryOption(newCategory) {
		if (newCategory === 'All Categories') {
			currCategory = null;
		} else {
			currCategory = newCategory;
		}
	}

	function handleCategoryChange(event) {
		console.log(event);
		const selectedCategory = event.target.value;
		console.log('select', selectedCategory);
		if (selectedCategory === defaultCategory || selectedCategory === 'All Phrases') {
			currCategory = null;
		} else {	
			currCategory = selectedCategory;
		}
	}

	function handleTagChange(event) {
		const selectedTag = event.target.value;
		if (selectedTag === defaultTag) {
			currTag = null;
		} else {
			currTag = selectedTag;
		}
	}

	function speakNow(txt) {
		var msg = new SpeechSynthesisUtterance();
		msg.text = txt;
		console.log('before', msg);
		if (voices) {
			console.log('voices!');
		}
		if (!voices) {
			console.error('voices not on');
		}
		if (femaleVoice) {
			msg.voice = voices.get('Samantha');
		} else {
			msg.voice = voices.get('Aaron');
		}
		console.log('after', msg)
		window.speechSynthesis.speak(msg);
		searchTerm = '';
	}

	function populateVoices() {
		var msg = new SpeechSynthesisUtterance();
		const allVoices = speechSynthesis.getVoices();
		voices.set('Samantha', allVoices[0]);
		voices.set('Aaron', allVoices[1]);
		voices.set('Albert', allVoices[2]);
		voices.set('Arthur', allVoices[8]);
		voices.set('Catherine', allVoices[15]);
	}

	function toggleFullScreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		} else if (document.exitFullscreen) {
			document.exitFullscreen();
		}
	}

	function switchPredictionVersion() {
		replaceVersion = !replaceVersion;
		/*if (versionColor === 'red') { //bring back later
			versionColor = 'white';
		} else {
			versionColor = 'red';
		}*/
	}

	function switchVoice() {
		femaleVoice = !femaleVoice;
	}

	async function handleKeydown(e){
		let enteredPhrase = event.target.value;
		if(e.key == 'Enter'){
			//addPhrase(enteredPhrase);
			//getPhraseFromDB('A little better');
			const selectedPhrase = await getPhraseFromDB('A little better');
		}
		if(e.key == 'option'){
			deletePhrase(enteredPhrase);
		}
	}

	function handleHoverSelect() {
		const selectDropdown = document.getElementById('categorySelect');

		if (selectDropdown) {
			clearTimeout(dwellTimer);
			dwellTimer = setTimeout(() => {
				const event = new MouseEvent('click', {
					bubbles: true,
					cancelable: true,
					view: window
				});
				selectDropdown.dispatchEvent(event);
				console.log(event);
			}, dwellInterval);
		}
	}

	function handleHoverLeave(){
		const selectDropdown = document.getElementById('categorySelect');
		selectDropdown.size = 1;
		console.log(selectDropdown);
	}

	function handleAddPhrase(userInput = document.getElementById('txt').value){
		if (userInput.includes('#')) {
			addPhraseWithTag(userInput);
		} else {
			addPhrase(userInput);
		}
		setTimeout(showUndoButton, 5); //show undo after hide undo
		initialUndoClick = true;
		searchTerm = '';
	}

	function handleDeletePhrase(){
		const userInput = document.getElementById('txt').value;
		deletePhraseFromDB(userInput);
		searchTerm = '';
	}

	function handleEditPhrase(){
		const userInput = document.getElementById('txt').value;
		if (editDeletedPhrase) {
			deletePhraseFromDB(editDeletedPhrase);
			addPhraseToDB(userInput);
			editDeletedPhrase = null;
		} else {
			editDeletedPhrase = userInput;
		}
	}

	function handleUndo(){
		undoAddPhrase();
		undoShown = false;
	}

	function handleSetDefaults(){
		setDefaultPhrases();
	}

	function handleSpeakButton(userInput = document.getElementById("txt").value){
		const formattedInput = getTagsAndFormatPhrase(userInput)[1];
		speakNow(formattedInput);
		handleAddPhrase(userInput);
		getContextCompletions(userInput);
	}

	async function togglePause() {
        isPaused = !isPaused;
		console.log('here', await getCompletions('hey there'))
    }

	function openSettings() {
		settingsShown = true;
		//setDefaultPhrases();
	}

	function switchPeriType() {
		buttonVersion = !buttonVersion;
	}

	function uploadNgrams() {

	}

	function closeSettings() {
		settingsShown = false;
	}

	function handleClick(event){
        const undoButton = document.getElementById('undoButton');
		if (undoButton) {
			undoShown = false;
		}
		if (event.button === 2 && event.target.id == "txt"){ //right click
			handleDeletePhrase()
		}
	}

	function handleSelectReplacement(prediction) {
		prediction[0] = prediction[0].replace(/-/g, ' ');
		const termArr = searchTerm.split(' ');
		const lastWord = termArr[termArr.length - 1];
		let beginTerm = termArr.slice(0, -2);
		if (lastWord) {	
			beginTerm = termArr.slice(0, -1);
		}
		clearTimeout(dwellTimer);
		searchTerm = beginTerm.join(' ') + ' ' + prediction[0] + ' ';
		searchTerm = searchTerm.replace('-', ' ');
		searchTerm = searchTerm.replace(/ {2,}/g, ' ');
	}

	function handleSelectContinuation(prediction) {
		//prediction[0] = prediction[0].replace(/-/g, ' ');
		searchTerm = searchTerm.trim();
		searchTerm = searchTerm + prediction[0];
		searchTerm = searchTerm.replace(/-/g, ' ');
		searchTerm = searchTerm.replace(/ {2,}/g, ' ');
	}

	// not easy to localize
	let kbd = [...Array(26)].map((_, i) => String.fromCharCode('a'.charCodeAt(0) + i));
	kbd.unshift('#');

	const fs = {
		display:
			'<svg class="h-6 w-6" viewBox="0 0 448 512"><path fill="currentColor" d="M0 180V56c0-13.3 10.7-24 24-24h124c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H64v84c0 6.6-5.4 12-12 12H12c-6.6 0-12-5.4-12-12zM288 44v40c0 6.6 5.4 12 12 12h84v84c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12V56c0-13.3-10.7-24-24-24H300c-6.6 0-12 5.4-12 12zm148 276h-40c-6.6 0-12 5.4-12 12v84h-84c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h124c13.3 0 24-10.7 24-24V332c0-6.6-5.4-12-12-12zM160 468v-40c0-6.6-5.4-12-12-12H64v-84c0-6.6-5.4-12-12-12H12c-6.6 0-12 5.4-12 12v124c0 13.3 10.7 24 24 24h124c6.6 0 12-5.4 12-12z"/></svg>',

		f: () => {
			toggleFullScreen();
		}
	};

	const reset = [
		{
			// collapse <svg fill={#fedd68} viewBox="0 0 448 512"><path d="M4.686 427.314L104 328l-32.922-31.029C55.958 281.851 66.666 256 88.048 256h112C213.303 256 224 266.745 224 280v112c0 21.382-25.803 32.09-40.922 16.971L152 376l-99.314 99.314c-6.248 6.248-16.379 6.248-22.627 0L4.686 449.941c-6.248-6.248-6.248-16.379 0-22.627zM443.314 84.686L344 184l32.922 31.029c15.12 15.12 4.412 40.971-16.97 40.971h-112C234.697 256 224 245.255 224 232V120c0-21.382 25.803-32.09 40.922-16.971L296 136l99.314-99.314c6.248-6.248 16.379-6.248 22.627 0l25.373 25.373c6.248 6.248 6.248 16.379 0 22.627z"/></svg>

			// fullscreen display: '<svg class="h-6 w-6" viewBox="0 0 448 512"><path fill=#fedd68 d="M0 180V56c0-13.3 10.7-24 24-24h124c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H64v84c0 6.6-5.4 12-12 12H12c-6.6 0-12-5.4-12-12zM288 44v40c0 6.6 5.4 12 12 12h84v84c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12V56c0-13.3-10.7-24-24-24H300c-6.6 0-12 5.4-12 12zm148 276h-40c-6.6 0-12 5.4-12 12v84h-84c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h124c13.3 0 24-10.7 24-24V332c0-6.6-5.4-12-12-12zM160 468v-40c0-6.6-5.4-12-12-12H64v-84c0-6.6-5.4-12-12-12H12c-6.6 0-12 5.4-12 12v124c0 13.3 10.7 24 24 24h124c6.6 0 12-5.4 12-12z"/></svg>',

			//	'<svg class="h-6 w-6" viewBox="0 0 448 512"><path fill=#fedd68 d="M160 400C160 408.8 152.8 416 144 416C135.2 416 128 408.8 128 400V192C128 183.2 135.2 176 144 176C152.8 176 160 183.2 160 192V400zM240 400C240 408.8 232.8 416 224 416C215.2 416 208 408.8 208 400V192C208 183.2 215.2 176 224 176C232.8 176 240 183.2 240 192V400zM320 400C320 408.8 312.8 416 304 416C295.2 416 288 408.8 288 400V192C288 183.2 295.2 176 304 176C312.8 176 320 183.2 320 192V400zM317.5 24.94L354.2 80H424C437.3 80 448 90.75 448 104C448 117.3 437.3 128 424 128H416V432C416 476.2 380.2 512 336 512H112C67.82 512 32 476.2 32 432V128H24C10.75 128 0 117.3 0 104C0 90.75 10.75 80 24 80H93.82L130.5 24.94C140.9 9.357 158.4 0 177.1 0H270.9C289.6 0 307.1 9.358 317.5 24.94H317.5zM151.5 80H296.5L277.5 51.56C276 49.34 273.5 48 270.9 48H177.1C174.5 48 171.1 49.34 170.5 51.56L151.5 80zM80 432C80 449.7 94.33 464 112 464H336C353.7 464 368 449.7 368 432V128H80V432z"/></svg>',

			display:
				'<svg  class="h-6 w-6" viewBox="0 0 512 512"><path fill="currentColor" d="M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256S114.6 512 256 512s256-114.6 256-256zM116.7 244.7l112-112c4.6-4.6 11.5-5.9 17.4-3.5s9.9 8.3 9.9 14.8l0 64 96 0c17.7 0 32 14.3 32 32l0 32c0 17.7-14.3 32-32 32l-96 0 0 64c0 6.5-3.9 12.3-9.9 14.8s-12.9 1.1-17.4-3.5l-112-112c-6.2-6.2-6.2-16.4 0-22.6z"/></svg>',

			f: () => {
				searchTerm = '';
			}
		}
	];
	const leftKeys = [
		{
			// back word
			display:
				'<svg class="h-6 w-6" viewBox="0 0 512 512"><path fill="currentColor" d="M11.5 280.6l192 160c20.6 17.2 52.5 2.8 52.5-24.6V96c0-27.4-31.9-41.8-52.5-24.6l-192 160c-15.3 12.8-15.3 36.4 0 49.2zm256 0l192 160c20.6 17.2 52.5 2.8 52.5-24.6V96c0-27.4-31.9-41.8-52.5-24.6l-192 160c-15.3 12.8-15.3 36.4 0 49.2z"/></svg>',
			f: () => {
				searchTerm = searchTerm.trim();
				let idx = searchTerm.lastIndexOf(' ');
				searchTerm = idx == -1 ? '' : searchTerm.slice(0, idx + 1);
			}
		},
		{
			// back one space
			display:
				'<svg class="h-6 w-6" viewBox="0 0 640 512"><path fill="currentColor" d="M576 64H205.26A63.97 63.97 0 0 0 160 82.75L9.37 233.37c-12.5 12.5-12.5 32.76 0 45.25L160 429.25c12 12 28.28 18.75 45.25 18.75H576c35.35 0 64-28.65 64-64V128c0-35.35-28.65-64-64-64zm-84.69 254.06c6.25 6.25 6.25 16.38 0 22.63l-22.62 22.62c-6.25 6.25-16.38 6.25-22.63 0L384 301.25l-62.06 62.06c-6.25 6.25-16.38 6.25-22.63 0l-22.62-22.62c-6.25-6.25-6.25-16.38 0-22.63L338.75 256l-62.06-62.06c-6.25-6.25-6.25-16.38 0-22.63l22.62-22.62c6.25-6.25 16.38-6.25 22.63 0L384 210.75l62.06-62.06c6.25-6.25 16.38-6.25 22.63 0l22.62 22.62c6.25 6.25 6.25 16.38 0 22.63L429.25 256l62.06 62.06z"/></svg>',
			f: () => {
				searchTerm = searchTerm.slice(0, -1);
			}
		},
		{
			// append a space
			display:
				'<svg class="h-6 w-6"  viewBox="0 0 448 512"><path fill="currentColor" d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/></svg>',
			f: () => {
				searchTerm = searchTerm + ' ';
			}
		}
	];

	function dwell(txt, append, tmr) {
		if(!isPaused){
			clearTimeout(dwellTimer);
			dwellTimer = setTimeout(() => {
				if (append) searchTerm = searchTerm.concat(txt);
				else {
					searchTerm = txt;
					handleSpeakButton(txt);
					//speakNow(txt);
				}
			}, tmr);
		}
	}

	function dwellF(f, tmr) {
		if(!isPaused){
			clearTimeout(dwellTimer);
			dwellTimer = setTimeout(f, tmr);
		}
	}
	function onlyUnique(value, index, self) {
		return self.indexOf(value) === index;
	}

	async function getContextCompletions(term) {
		try {
			//validateToken('string');
			let url = 'https://api.typewise.ai/latest/completion/sentence_complete';
    		//const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // CORS proxy URL
			const response = await fetch(url, {
				mode: "cors",
				cache: "no-cache",
				headers: {
					"Content-Type": "application/json"
				},
				redirect: "follow",
				method: "POST",
				body: JSON.stringify({
					token: "string",
					languages: ["en"],
					text: term,
					correctTypoInPartialWord: false,
					maxNumberOfPredictions: 20
				}),
			});

			if (response.ok) {
				console.log('response:', response)
				let comps = await response.json();
				comps = comps.predictions.map((p) => p.text);
				comps = comps.sort().filter(onlyUnique);
				console.log(comps);
				return comps; // Resolve with the result
			} else {
				const message = `Error: ${response.status}`;
				throw new Error(message); // Reject with an error
			}
		} catch (error) {
			console.error("Error fetching completions:", error);
			throw error; // Re-throw the error to be handled by the caller
		}
	}

	async function getCompletions(term) {
		try {
			//validateToken('string');
			let url = 'https://api.typewise.ai/latest/completion/complete';
    		//const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // CORS proxy URL
			const response = await fetch(url, {
				mode: "cors",
				cache: "no-cache",
				headers: {
					"Content-Type": "application/json",
				},
				redirect: "follow",
				method: "POST",
				body: JSON.stringify({
					token: "string",
					languages: ["en"],
					text: term,
					correctTypoInPartialWord: false,
					maxNumberOfPredictions: 20,
				}),
			});

			if (response.ok) {
				console.log('here5');
				let comps = await response.json();
				comps = comps.predictions.map((p) => p.text);
				comps = comps.sort().filter(onlyUnique);
				return comps; // Resolve with the result
			} else {
				const message = `Error: ${response.status}`;
				throw new Error(message); // Reject with an error
			}
		} catch (error) {
			console.error("Error fetching completions:", error);
			throw error; // Re-throw the error to be handled by the caller
		}
	}
	$: {
		// look in personal library
		searchKey = searchTerm.toLowerCase();
		// find and sort the phrases in the personal library starting with the search term
		startsWith = $phrases
			.filter((phrase) => phrase.toLowerCase().startsWith(searchKey))
			.filter(onlyUnique).filter((phrase) => phrase); //makes sure only unique phrases and the phrase is not empty
		if (currCategory) {
			startsWith =startsWith.filter((phrase) => $categoryWritable.get(currCategory).has(phrase));
		}
		if (currTag) {
			startsWith =startsWith.filter((phrase) => $tagWritable.get(currTag).has(phrase));
		}

		categoryArr = new Array(...$categoryWritable.keys());
		tagArr = new Array(...$tagWritable.keys());


		// create a new array containing the remaining part of each phrase after removal of the search term
		keylength = searchKey.length;
		completions = startsWith.map((phrase) => phrase.slice(keylength));

		searchKey = searchKey.trim();
		contains =
			searchKey.length < 3 // don't bother With Meaningless Matches
				? ''
				: $phrases
						.filter((phrase) => phrase.toLowerCase().includes(searchKey, searchTerm.length))
						.sort()
						.filter(onlyUnique);

		if (startsWith.length == 1 && startsWith[0].length == searchTerm.length) startsWith = [];

		nextWord = completions.map((phrase) => phrase.split(' ').slice(0, 1).join(' '));
		// Determine the frequency of each Starter
		nextWord = nextWord.sort().reduce(function (acc, key) {
			return acc[key] ? ++acc[key] : (acc[key] = 1), acc;
		}, {});
		// Sort the starters
		starters = Object.entries(nextWord).sort((a, b) => b[1] - a[1]);
		if (replaceVersion) {
			console.log('here');
			fetchAndAddCompletions(searchKey);
		} else {
			console.log('here2');
			addCompletionsRemoval(searchKey);
		}
	}

	async function addCompletionsRemoval(searchTerm) {
		console.log('start2', starters);
		if (starters.length < 2) {
			const termArr = searchTerm.split(' ');
			const lastWord = termArr[termArr.length - 1];
			const allowedLength = 25;
            let nc = await getCompletions(searchTerm); 
			console.log('nc', nc);
			const ncLength = Math.max(allowedLength, nc.length);
			let ncObjects = [];
			//console.log(nc);
			for (let i = 0; i < ncLength; i++) {
				if (nc[i]) {
					nc[i] = removeDoubleHyphens(nc[i]);
				}
				if (lastWord && nc[i] ) {
					console.log('nc', nc[i]);
					ncObjects.push(removeLastWord(nc[i], lastWord));
				} else {
					//console.log(lastWord, nc[i]);
				}
			}
			console.log('objects', ncObjects);
            starters = ncObjects.concat(starters); 
            console.log('start', starters);
		}
	}

	async function fetchAndAddCompletions(searchTerm) {
        if (starters.length < 2) {
			const termArr = searchTerm.split(' ');
			const lastWord = termArr[termArr.length - 1];
            let nc = await getCompletions(searchTerm); 
			for (let i = 0; i < nc.length; i++) {
				nc[i] = replaceHyphens(nc[i]);
			}
			console.log('first', nc.length)
			nc = nc.filter(item => item !== lastWord);
			console.log('second', nc.length)
			let ncObjects = nc.map((completion) =>  {
				return [completion, 0]
			});
			ncObjects
            starters = ncObjects.concat(starters); 
        }
    }

	function replaceHyphens(text) {
		text = text.replace(/--/g, " ");
		return text.replace(/-/g, " ");
	}

	function removeDoubleHyphens(text) {
		return text.replace(/--/g, '-');
	}

	function removeLastWord(text, lastWord) {
		if (lastWord.length <= text.length && text.substring(0, lastWord.length) == lastWord) {
			return [text.slice(lastWord.length), "continue"];
		} else {
			return [text, "replace"];
		}
	}
	fetchCards();
</script>

<svelte:head>
	<title>Peri</title>
</svelte:head>
<div class="click-container"
	on:click={(event) => {
		handleClick(event);
	}}>
	<div class="bg-tertiary flex flex-col overflow-hidden">
		{#if settingsShown}
			<div class="modal-overlay" on:click|stopPropagation>
				<div class="settings-popup">
					<div class="settings-top">
						<div class="top-line">
							<p class="settings-title">Settings</p>
							<button class="close-settings" 
								on:click={closeSettings}
								on:mouseleave|preventDefault={() => { clearTimeout(dwellTimer); }}
								on:mouseenter|preventDefault={() => dwellF(closeSettings, dwellInterval)}
							>X</button>
						</div>
					</div>
					<div class="settings-bottom">
						<button
							id="defaultButton"
							class="w-40 border border-black rounded-md bg-blue-500 hover:text-primary hover:bg-secondary"
							on:mouseleave|preventDefault={() => {
								clearTimeout(dwellTimer);
							}}
							on:mouseenter|preventDefault={() => dwellF(handleSetDefaults, dwellInterval)}
							on:click={() => {
								clearTimeout(dwellTimer);
								handleSetDefaults();
							}}
						>Reset Defaults</button>
						<button
							id="switchTypeButton"
							class="w-40 border border-black rounded-md bg-blue-500 hover:text-primary hover:bg-secondary"
							on:mouseleave|preventDefault={() => {
								clearTimeout(dwellTimer);
							}}
							on:mouseenter|preventDefault={() => dwellF(switchPeriType, dwellInterval)}
							on:click={() => {
								clearTimeout(dwellTimer);
								switchPeriType();
							}}
						>{ #if buttonVersion }Switch to Simplified Version{:else}Switch to Button Version{/if}</button>
						<button
							id="switchPredictionButton"
							class="w-40 border border-black rounded-md bg-blue-500 hover:text-primary hover:bg-secondary"
							on:mouseleave|preventDefault={() => {
								clearTimeout(dwellTimer);
							}}
							on:mouseenter|preventDefault={() => dwellF(switchPredictionVersion, dwellInterval)}
							on:click={() => {
								clearTimeout(dwellTimer);
								switchPredictionVersion();
							}}
						>{#if replaceVersion}Switch To Continuation{:else}Switch To Replace{/if}</button>
						<button
							id="switchVoiceButton"
							class="w-40 border border-black rounded-md bg-blue-500 hover:text-primary hover:bg-secondary"
							on:mouseleave|preventDefault={() => {
								clearTimeout(dwellTimer);
							}}
							on:mouseenter|preventDefault={() => dwellF(switchVoice, dwellInterval)}
							on:click={() => {
								clearTimeout(dwellTimer);
								switchVoice();
							}}
						>{#if femaleVoice }Switch Voice to Aaron{:else}Switch Voice to Samantha{/if}</button>
						<!--<button
							id="uploadNgramsButton"
							class="w-40 border border-black rounded-md bg-blue-500 hover:text-primary hover:bg-secondary"
							on:mouseleave|preventDefault={() => {
								clearTimeout(dwellTimer);
							}}
							on:mouseenter|preventDefault={() => dwellF(uploadNgrams, dwellInterval)}
							on:click={() => {
								clearTimeout(dwellTimer);
								uploadNgrams();
							}}
						>Upload Ngrams</button>-->
					</div>
				</div>
			</div>
		{/if}
		<div class="w-full flex flex-row">
			<ul class="w-full pt-4 pb-2 flex flex-row justify-evenly">
				<li>
					<div id="pause-div" 
					class:bg-white={isPaused}
					style="border-radius: 7px;"
					on:click={() => {
							clearTimeout(dwellTimer);
							togglePause();
						}}>
						<Pause Pause={{ class: 'h-6 w-6 hover:text-primary' }} />
					</div>
				</li>
				<li>
					<Speak
						Speak={{ text: searchTerm, timeout: dwellInterval, class: 'h-6 w-6 hover:text-primary' }}
					/>
				</li>
				<li><Record Record={{ class: 'h-6 w-6 hover:text-primary' }} /></li>
				<li><Text Text={{ class: 'h-6 w-6 hover:text-primary' }} /></li>
				<li>
					<button
						class="w-[3rem] pl-3 text-secondary hover:text-primary"
						on:click={() => {
							clearTimeout(dwellTimer);
							savePhrases();
						}}>Save</button
					>
				</li>
				<li>
					<button class="" on:click={() => fs.f()}> {@html fs.display}</button>
				</li>
				<li>
					<div id="settings-div"
					style="border-radius: 7px;"
					on:click={() => {
							clearTimeout(dwellTimer);
							openSettings();
						}}>
						<Settings Settings={{ class: 'h-6 w-6 hover:text-primary' }} />
					</div>
				</li>
			</ul>
		</div>
		<div class="flex flex-row">
			<div class="flex flex-row justify-center ">
				{#each reset as key}
					<button
						class="w-[3rem] pl-3 text-secondary hover:text-primary"
						on:mouseleave|preventDefault={() => {
							clearTimeout(dwellTimer);
						}}
						on:mouseenter|preventDefault={() => dwellF(key.f, dwellInterval)}
						on:click={() => {
							clearTimeout(dwellTimer);
							key.f();
						}}>{@html key.display}</button
					>
				{/each}
			</div>
			<div class="grow pr-12 flex flex-col">
				<div class="flex space-x-2">
					<div class="p-2 w-full rounded-md text-3xl outline-none border-none bg-primary text-primary">
						{#if buttonVersion}
							<label for="txt"></label>
							<input
								type="search"
								id="txt"
								name="txt"
								class="p-2   text-3xl outline-none border-none bg-primary text-primary"
								placeholder="Type a phrase"
								bind:value={searchTerm}
								size={searchTerm.length}
								on:keydown={handleKeydown}
								on:contextmenu|preventDefault={handleClick}
								style="width: 100%;"
							/>
						{:else}
							<label for="txt"></label>
							<input
								type="search"
								id="txt"
								name="txt"
								class="p-2   text-3xl outline-none border-none bg-primary text-primary"
								style="min-width:312px"
								placeholder="Type a phrase"
								bind:value={searchTerm}
								size={searchTerm.length}
								on:keydown={handleKeydown}
								on:contextmenu|preventDefault={handleClick}
							/>
							<button
								id="speakButton"
								class="w-40 border border-black rounded-md bg-blue-500 hover:text-primary hover:bg-secondary"
								on:mouseleave|preventDefault={() => {
									clearTimeout(dwellTimer);
								}}
								on:mouseenter|preventDefault={() => dwellF(handleSpeakButton, dwellInterval)}
								on:click={() => {
									clearTimeout(dwellTimer);
									handleSpeakButton();
									//handleAddPhrase();
								}}
							>Speak</button>
							<button
								id="saveButton"
								class="w-40 border border-black rounded-md hover:text-primary hover:bg-secondary"
								on:mouseleave|preventDefault={() => {
									clearTimeout(dwellTimer);
								}}
								on:mouseenter|preventDefault={() => dwellF(handleAddPhrase, dwellInterval)}
								on:click={() => {
									clearTimeout(dwellTimer);
									handleAddPhrase();
								}}
							>Save</button>
						{/if}
						<select class='dropdown' id='tagSelect' on:change={handleTagChange}>
							<option class='defaultOption'>{defaultTag}</option>
							{#if tagArr}
								{#each tagArr as tag}
									<option value={tag}>{tag}</option>
								{/each}
							{/if}
						</select>
						<select class='dropdown' id='categorySelect' on:mouseenter='{handleHoverSelect}' on:mouseleave={handleHoverLeave} on:change={handleCategoryChange} style="overflow-visible h-auto">
							<option class='defaultOption'>{defaultCategory}</option>
							<option class='customOption'>Custom Phrase</option>
							{#if categoryArr}
								{#each categoryArr as category}
									<option value={category}>{category}</option>
								{/each}
							{/if}
						</select>

						<!--<div class="dropdown" class:open={isDropdownOpen} style="display:inline-block; background-color:white; width:299px">
							<div class="dropdown-trigger" 
							on:click={toggleDropdown}
							on:mouseleave|preventDefault={() => {
								clearTimeout(dwellTimer);
							}}
							on:mouseenter|preventDefault={() => dwellF(toggleDropdown, dwellInterval)}>
								{selectedValue || "Select an option"}
							</div>

							{#if isDropdownOpen}
								<ul class="dropdown-options" style="position: absolute; background-color:white; overflow:scroll; height:500px;">
								{#if selectedValue != 'All Categories'}
									<li on:click={() => { selectedValue = 'All Categories'; isDropdownOpen = false; handleCategoryOption(selectedValue); }}
									on:mouseleave|preventDefault={() => {
										clearTimeout(dwellTimer);
									}}
									on:mouseenter|preventDefault={() => dwellF(() => { selectedValue = 'All Categories'; isDropdownOpen = false; handleCategoryOption(selectedValue); }, dwellInterval)}>All Categories</li>
								{/if}
								{#each categoryArr as option}
									{#if option != selectedValue}
										<li on:click={() => { selectedValue = option; handleCategoryOption(selectedValue); isDropdownOpen = false;}}
										on:mouseleave|preventDefault={() => {
											clearTimeout(dwellTimer);
										}}
										on:mouseenter|preventDefault={() => dwellF(() => { selectedValue = option; handleCategoryOption(selectedValue); isDropdownOpen = false;}, dwellInterval)}>{option}</li>
									{/if}
								{/each}
								</ul>
								<p>does this show up?<p>
								<div class="dropdown-scroller" 
								on:click={toggleDropdown}
								on:mouseleave|preventDefault={() => {
									clearTimeout(dwellTimer);
								}}
								on:mouseenter|preventDefault={() => dwellF(toggleDropdown, dwellInterval)}>
									hello will this work
								</div>
							{/if}
						</div>-->
						{#if undoShown}
							<button
							id="undoButton"
							class="w-40 border border-black rounded-md hover:text-primary hover:bg-secondary"
							on:mouseleave|preventDefault={() => {
								clearTimeout(dwellTimer);
							}}
							on:mouseenter|preventDefault={() => dwellF(handleUndo, dwellInterval)}
							on:click={() => {
								clearTimeout(dwellTimer);
								handleUndo();
							}}>Undo</button>
						{/if}
					</div>
					{#if buttonVersion}
						<button
							id="addPhraseButton"
							class="w-40 border border-black rounded-md bg-green-500 hover:text-primary hover:bg-secondary"
							on:mouseleave|preventDefault={() => {
								clearTimeout(dwellTimer);
							}}
							on:mouseenter|preventDefault={() => dwellF(handleAddPhrase, dwellInterval)}
							on:click={() => {
								clearTimeout(dwellTimer);
								handleAddPhrase()
							}}
						>Add Phrase</button>
						<button
							id="deletePhraseButton"
							class="w-40 border border-black rounded-md bg-red-500 hover:text-primary hover:bg-secondary"
							on:mouseleave|preventDefault={() => {
								clearTimeout(dwellTimer);
							}}
							on:mouseenter|preventDefault={() => dwellF(handleDeletePhrase, dwellInterval)}
							on:click={() => {
								clearTimeout(dwellTimer);
								handleDeletePhrase();
							}}
						>Delete Phrase</button>
						<button
							id="editPhraseButton"
							class="w-40 border border-black rounded-md bg-yellow-500 hover:text-primary hover:bg-secondary"
							on:mouseleave|preventDefault={() => {
								clearTimeout(dwellTimer);
							}}
							on:mouseenter|preventDefault={() => dwellF(handleDeletePhrase, dwellInterval)}
							on:click={() => {
								clearTimeout(dwellTimer);
								handleEditPhrase();
							}}
						>Edit Phrase</button>
						<!--<button
							id="defaultsButton"
							class="w-40 border border-black rounded-md bg-yellow-500 hover:text-primary hover:bg-secondary"
							on:mouseleave|preventDefault={() => {
								clearTimeout(dwellTimer);
							}}
							on:mouseenter|preventDefault={() => dwellF(handleSetDefaults, dwellInterval)}
							on:click={() => {
								clearTimeout(dwellTimer);
								handleSetDefaults();
							}}
						>Reset Defaults</button>-->
					{/if}

				<!--<button
					class="text-2xl w-[3rem] rounded-full font-bold text-secondary hover:text-primary hover:bg-secondary"
					on:mouseleave|preventDefault={() => {
						clearTimeout(dwellTimer);
					}}
					on:mouseenter|preventDefault={() => dwell(key, true, dwellInterval)}
					on:click={() => {
						clearTimeout(dwellTimer);
						searchTerm = searchTerm.concat(key);
					}}>{@html key}</button
				>-->

				</div>
			</div>
		</div>
		<div class="p-2 flex flex-row justify-evenly text-primary" style="width: 90%">
			{#each leftKeys as key}
				<button
					class="text-2xl w-[3rem] text-secondary hover:text-primary"
					on:mouseleave|preventDefault={() => {
						clearTimeout(dwellTimer);
					}}
					on:mouseenter|preventDefault={() => dwellF(key.f, dwellInterval)}
					on:click={() => {
						clearTimeout(dwellTimer);
						key.f();
					}}>{@html key.display}</button
				>
			{/each}
			{#each kbd as key}
				<button
					class="text-2xl w-[3rem] rounded-full font-bold text-secondary hover:text-primary hover:bg-secondary"
					on:mouseleave|preventDefault={() => {
						clearTimeout(dwellTimer);
					}}
					on:mouseenter|preventDefault={() => dwell(key, true, dwellInterval)}
					on:click={() => {
						clearTimeout(dwellTimer);
						searchTerm = searchTerm.concat(key);
					}}>{@html key}</button
				>
			{/each}
		</div>

		<div class="max-h-24 flex flex-row flex-wrap overflow-hidden">
			{#each starters as prediction}
				{ #if prediction[1] === "replace" || replaceVersion }
					<button
						class="pl-4 pr-4 pt-2 pb-2 min-w-[4rem] rounded-full text-2xl text-tertiary hover:text-primary hover:bg-secondary"
						style="color:{versionColor}"
						on:mouseleave|preventDefault={() => {
							clearTimeout(dwellTimer);
						}}
						on:mouseenter|preventDefault={() => dwell(prediction[0] + ' ', true, dwellInterval)}
						on:click={() => {
							handleSelectReplacement(prediction);
						}}>{prediction[0]}</button
					>
				{:else}
					<button
						class="pl-4 pr-4 pt-2 pb-2 min-w-[4rem] rounded-full text-2xl text-tertiary hover:text-primary hover:bg-secondary"
						on:mouseleave|preventDefault={() => {
							clearTimeout(dwellTimer);
						}}
						on:mouseenter|preventDefault={() => dwell(prediction[0] + ' ', true, dwellInterval)}
						on:click={() => {
							handleSelectContinuation(prediction);
						}}>{prediction[0]}</button
					>
				{/if}
			{/each}
		</div>
	</div>
	<div class="flex max-h-[70vh] w-full flex-col bg-secondary justify-center">
		<div class="w-full p-8 flex flex-row flex-wrap gap-2 overflow-y-auto">
			{#each startsWith as phrase}
				<p
					class="p-4 text-2xl rounded-lg text-tertiary hover:bg-tertiary hover:text-primary hover:text-4xl w-80 sm:w-[90%] md:w-60 "
					on:mouseleave|preventDefault={() => {
						clearTimeout(dwellTimer);
					}}
					on:mouseenter|preventDefault={() => dwell(phrase, false, dwellInterval)}
					on:click={() => {
						clearTimeout(dwellTimer);
						searchTerm = phrase;
						handleSpeakButton(phrase);
						//speakNow(phrase);
					}}
				>
					{phrase}
				</p>
			{/each}
			{#each contains as phrase}
				<p
					class="p-4 italic text-2xl rounded-lg text-tertiary hover:bg-tertiary hover:text-primary hover:text-4xl w-80 sm:w-[90%] md:w-60"
					on:mouseleave|preventDefault={() => {
						clearTimeout(dwellTimer);
					}}
					on:mouseenter|preventDefault={() => dwell(phrase, false, dwellInterval)}
					on:click={() => {
						clearTimeout(dwellTimer);
						searchTerm = phrase;
						handleSpeakButton(phrase);
						//speakNow(phrase);
					}}
				>
					{phrase}
				</p>
			{/each}
		</div>
	</div>

	<footer
		class="h-[8%] w-full min-h-12 bg-primary fixed left-0 bottom-0 p-4 flex flex-row justify-evenly items-center"
	>
		{#each ['Ice Breakers', 'Ask Help', 'Social Requests', 'Custom Phrase', 'All Phrases'] as lbl}
			<button
				type="button"
				class="p-2 font-bold text-md rounded-md shadow-md hover:bg-tertiary hover:shadow-lg transition duration-150 ease-in-out"
				value={lbl}
				on:click={handleCategoryChange}
				on:mouseleave|preventDefault={() => { clearTimeout(dwellTimer); }}
				on:mouseenter|preventDefault={() => dwellF(handleCategoryChange, dwellInterval)}
				>{lbl}</button
			>
		{/each}
	</footer>
</div>

<style>
	:root {
		--rounded: 15px;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black overlay */
		z-index:   
	10; /* Ensure it's on top of other content */
		display: flex;
		justify-content: center;
		align-items: center;
	}

  .settings-popup {
    background-color: white;
    padding: 0;
	width: 30%;
	height: 30%;
	min-width: 300px;
	min-height: 300px;
	z-index: 11; /* Higher than the overlay */
	background-color: white;
	border-radius: var(--rounded);
  }

  .settings-top {
		background-color: grey;
		width: 100%;
		height: 15%;
		margin: 0;
		border-radius: var(--rounded) var(--rounded) 0px 0px;
	}

	.top-line {
		position: relative;
		height: 20px;
		top: 20%;
  }

  .settings-title {
		font-size: 20px;
		position: absolute; 
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%); /* Center both horizontally and vertically */
  }

	.close-settings {
		/* Align the button to the right */
		position: absolute;
		top: 50%;
		right: 5px; /* Adjust spacing as needed */
		transform: translateY(-50%); /* Center vertically */
	}

	.settings-bottom {
		padding: 20px;
		background-color:white;
		width:100%;
		height:85%;
		border-radius: 0px 0px var(--rounded) var(--rounded);
		display: flex;
		justify-content: space-between;
		flex-direction: column;
	}

	.settings-bottom>* {
		margin: auto;
	}

	.dropdown {
		background-color: #00274C;
		color: #FFCB05;
	}

	#saveButton {
		background-color: #006400;
	}

	#saveButton, #speakButton {
		color: #FFCB05;
	}
</style>
