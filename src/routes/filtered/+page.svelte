<script>
	import CollapsibleSection from '../../components/CollapsibleSection.svelte';
	import FBCard from '../../components/card.svelte';
	import { phrases, fetchCards } from '../../cardstore';
	import Speak from '../../components/speak.svelte';

	let searchTerm = 'I';
	let startsWith = [];
	let contains = [];
	let starters = [];
	let completions = [];
	let nextWord = [];
	let counts = {};
	let dwellTimer;
	let dwellInterval = 1000;
	let expanded = false;
	let searchKey = '';

	const kbd = [...Array(26)].map((_, i) => String.fromCharCode('a'.charCodeAt(0) + i));
	const reset = [
		{
			display: '◊',
			f: () => {
				searchTerm = '';
			}
		}
	];
	const leftKeys = [
		{
			display: '«',
			f: () => {
				searchTerm = searchTerm.trim();
				let idx = searchTerm.lastIndexOf(' ');
				searchTerm = idx == -1 ? '' : searchTerm.slice(0, idx + 1);
			}
		},
		{
			display: '<',
			f: () => {
				searchTerm = searchTerm.slice(0, -1);
			}
		}
	];
	const rightKeys = [
		{
			display: '»',
			f: () => {
				searchTerm = searchTerm + ' ';
			}
		}
	];

	function dwell(txt, append, tmr) {
		clearTimeout(dwellTimer);
		dwellTimer = setTimeout(() => {
			searchTerm = append ? searchTerm.concat(txt) : txt;
		}, tmr);
	}

	function dwellF(f, tmr) {
		clearTimeout(dwellTimer);
		dwellTimer = setTimeout(f, tmr);
	}
	function onlyUnique(value, index, self) {
		return self.indexOf(value) === index;
	}

	$: {
		searchKey = searchTerm.toLowerCase();
		startsWith = $phrases
			.filter((phrase) => phrase.toLowerCase().startsWith(searchKey))
			.sort()
			.filter(onlyUnique);

		completions = startsWith.map((phrase) => phrase.slice(searchKey.length));

		searchKey = searchKey.trim();
		contains = ( searchKey.length < 3)  // don't bother With Meaningless Matches
			? ''
			: $phrases
					.filter((phrase) => phrase.toLowerCase().includes(searchKey, searchTerm.length))
					.sort()
					.filter(onlyUnique);

		if (startsWith.length == 1) startsWith = [];

		nextWord = completions.map((phrase) => phrase.split(' ').slice(0, 1).join(' '));
		// Determine the frequency of each Starter
		nextWord = nextWord.sort().reduce(function (acc, key) {
			return acc[key] ? ++acc[key] : (acc[key] = 1), acc;
		}, {});
		// Sort the starters
		starters = Object.entries(nextWord).sort((a, b) => b[1] - a[1]);
	}

	fetchCards();
</script>

<svelte:head>
	<title>Peri</title>
</svelte:head>

<div class="bg-primary flex flex-col overflow-hidden">
	<div class="flex flex-row">
		<div class="w-[3rem] flex flex-row justify-center ">
			{#each reset as key}
				<button
					class="text-primary text-4xl"
					on:mouseleave|preventDefault={() => {
						clearTimeout(dwellTimer);
					}}
					on:mouseenter|preventDefault={() => dwellF(key.f, dwellInterval)}
					on:click={() => {
						clearTimeout(dwellTimer);
						key.f();
					}}>{key.display}</button
				>
			{/each}
		</div>
		<div class="grow p-4 flex flex-col">
			<label for="txt" />
			<input
				type="search"
				id="txt"
				name="txt"
				class="p-2 w-full text-xl outline-none border-none bg-tertiary text-primary"
				placeholder="Type a phrase"
				bind:value={searchTerm}
				size={searchTerm.length}
			/>
		</div>
	</div>
	<div class="p-2 flex flex-row justify-evenly text-primary">
		{#each leftKeys as key}
			<button
				class="text-xl"
				on:mouseleave|preventDefault={() => {
					clearTimeout(dwellTimer);
				}}
				on:mouseenter|preventDefault={() => dwellF(key.f, dwellInterval)}
				on:click={() => {
					clearTimeout(dwellTimer);
					key.f();
				}}>{key.display}</button
			>
		{/each}
		{#each kbd as key}
			<button
				class="text-xl"
				on:mouseleave|preventDefault={() => {
					clearTimeout(dwellTimer);
				}}
				on:mouseenter|preventDefault={() => dwell(key, true, dwellInterval)}
				on:click={() => {
					clearTimeout(dwellTimer);
					searchTerm = searchTerm.concat(key);
				}}>{key}</button
			>
		{/each}
		{#each rightKeys as key}
			<button
				class="text-xl"
				on:mouseleave|preventDefault={() => {
					clearTimeout(dwellTimer);
				}}
				on:mouseenter|preventDefault={() => dwellF(key.f, dwellInterval)}
				on:click={() => {
					clearTimeout(dwellTimer);
					key.f();
				}}>{key.display}</button
			>
		{/each}
	</div>

	<div class="max-h-24 flex flex-row flex-wrap p-2 text-base text-tertiary overflow-hidden">
		{#each starters as prediction}
			<button
				class="p-2 min-w 12"
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
<div class="flex max-h-[70vh] flex-col bg-secondary justify-center">
	<div class="p-8 flex flex-row flex-wrap gap-x-12 gap-y-4 overflow-y-auto">
		{#each startsWith as phrase}
			<p
				class="text-primary w-80 sm:w-[90%] md:w-60 "
				on:mouseleave|preventDefault={() => {
					clearTimeout(dwellTimer);
				}}
				on:mouseenter|preventDefault={() => dwell(phrase, false, dwellInterval)}
				on:click={() => {
					clearTimeout(dwellTimer);
					searchTerm = phrase;
				}}
			>
				{phrase}
			</p>
		{/each}
		{#each contains as phrase}
			<p
				class="text-tertiary w-80 sm:w-[90%] md:w-60"
				on:mouseleave|preventDefault={() => {
					clearTimeout(dwellTimer);
				}}
				on:mouseenter|preventDefault={() => dwell(phrase, false, dwellInterval)}
				on:click={() => {
					clearTimeout(dwellTimer);
					searchTerm = phrase;
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
