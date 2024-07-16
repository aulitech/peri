<script>
	import { fetchCards, phrases, savePhrases } from '../cardstore';
	import Record from '../components/record.svelte';
	import Text from '../components/text.svelte';
	import Speak from '../components/speak.svelte';

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

	function speakNow(txt) {
		var msg = new SpeechSynthesisUtterance();
		msg.text = txt;
		window.speechSynthesis.speak(msg);
		searchTerm = '';
	}

	function toggleFullScreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		} else if (document.exitFullscreen) {
			document.exitFullscreen();
		}
	}

	function handleKeydown(e){
		if(e.key == 'Enter'){
			event.preventDefault();
			//console.log($phrases);
			let textareaContent = event.target.value;
			//console.log(textareaContent);
			$phrases.push(textareaContent);
			console.log($phrases);
		}
	}

	// not easy to localize
	const kbd = [...Array(26)].map((_, i) => String.fromCharCode('a'.charCodeAt(0) + i));

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
		clearTimeout(dwellTimer);
		dwellTimer = setTimeout(() => {
			if (append) searchTerm = searchTerm.concat(txt);
			else {
				searchTerm = txt;
				speakNow(txt);
			}
		}, tmr);
	}

	function dwellF(f, tmr) {
		clearTimeout(dwellTimer);
		dwellTimer = setTimeout(f, tmr);
	}
	function onlyUnique(value, index, self) {
		return self.indexOf(value) === index;
	}

	async function fetchCompletions(term) {
		let url = 'https://api.typewise.ai/latest/completion/complete';
		const response = await fetch(url, {
			mode: 'cors', // no-cors, *cors, same-origin
			cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
			//credentials: 'same-origin', // include, *same-origin, omit
			headers: {
				'Content-Type': 'application/json'
				// 'Content-Type': 'application/x-www-form-urlencoded',
			},
			redirect: 'follow', // manual, *follow, error
			//referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
			method: 'POST',
			body: JSON.stringify({
				token: 'string',
				languages: ['en'],
				text: term,
				correctTypoInPartialWord: false,
				maxNumberOfPredictions: 20
			})
		});

		if (response.ok) {
			let comps = await response.json();
			comps = comps.prediction.map((p) => p.text);
			comps = comps.sort().filter(onlyUnique);
			return comps;
		} else {
			const message = `Error: ${response.status}`;
			throw new Error(message);
		}
	}

	function getCompletions(term) {
		return [] //fetchCompletions(term);
	}

	$: {
		// look in personal library
		searchKey = searchTerm.toLowerCase();
		// find and sort the phrases in the personal library starting with the search term
		//console.log('here');
		//console.log($phrases);
		startsWith = $phrases
			.filter((phrase) => phrase.toLowerCase().startsWith(searchKey))
			.sort()
			.filter(onlyUnique);

		// create a new array containing the remaining part of each phrase after removal of the search term
		keylength = searchKey.length;
		completions = startsWith.map((phrase) => phrase.slice(keylength));

		//
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

		if (starters.length < 2) {
			// add from  General word database
			let nc = getCompletions(searchTerm);
			starters = starters.concat(nc);
			//console.log(starters.length);
		}
	}

	fetchCards();
</script>

<svelte:head>
	<title>Peri</title>
</svelte:head>

<div class="bg-tertiary flex flex-col overflow-hidden">
	<div class="w-full flex flex-row">
		<ul class="w-full pt-4 pb-2 flex flex-row justify-evenly">
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
			<label for="txt" />
			<input
				type="search"
				id="txt"
				name="txt"
				class="p-2 w-full rounded-md text-3xl outline-none border-none bg-primary text-primary"
				placeholder="Type a phrase"
				bind:value={searchTerm}
				size={searchTerm.length}
				on:keydown={handleKeydown}
			/>
		</div>
	</div>
	<div class="p-2 flex flex-row justify-evenly text-primary">
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
			<button
				class="pl-4 pr-4 pt-2 pb-2 min-w-[4rem] rounded-full text-2xl text-tertiary hover:text-primary hover:bg-secondary"
				on:mouseleave|preventDefault={() => {
					clearTimeout(dwellTimer);
				}}
				on:mouseenter|preventDefault={() => dwell(prediction[0] + ' ', true, dwellInterval)}
				on:click={() => {
					clearTimeout(dwellTimer);
					searchTerm = searchTerm + prediction[0] + ' ';
				}}>{prediction[0]}</button
			>
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
	{#each ['Bathroom', 'Food', 'Pain', 'Help'] as lbl}
		<button
			type="button"
			class="p-2 font-bold text-md rounded-md shadow-md hover:bg-tertiary hover:shadow-lg transition duration-150 ease-in-out"
			>{lbl}</button
		>
	{/each}
</footer>

<style>
</style>
