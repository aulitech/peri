<script>
	import FBCard from '../components/card.svelte';
	import Newphrase from '../components/newPhrase.svelte';
	import { speakTimer, speak } from '../components/speak';
	import { tabs, fetchCards } from '../cardstore';

	let searchTerm = '';
	let filteredCards = [];
	let filteredTabs = {};

	$: {
		// We would need to implement filtering here.
		filteredTabs = { ...$tabs };
	}

	fetchCards();
</script>

<svelte:head>
	<title>Flipbook</title>
</svelte:head>

<header class="w-full h-12 bg-primary font-bold text-2xl text-center text-primary">
	AuLi.Tech Flipbook
</header>

<div
	class="flex flex-row flex-wrap cursor-cell justify-start p-4 gap-4 border-gray-200 snap-y snap-mandatory h-85vh "
>
	{#each Object.entries(filteredTabs).sort() as [tab, cardList]}
		<details class="bg-secondary p-2 rounded-md open:snap-start flex flex-col open:bg-tertiary">
			<summary class="w-80 p-2 border-gray-300 font-bold text-2xl text-center">{tab}</summary>

			<ul class="text-base font-normal flex flex-row flex-wrap justify-left gap-x-8 gap-y-2">
				{#each cardList.sort() as card}
					<li><FBCard FBCard={card} /></li>
				{/each}
			</ul>
		</details>
	{/each}

	<Newphrase Newphrase={''} />
</div>

<footer
	class="w-full h-16 bg-secondary border-t-2 border-white fixed left-0 bottom-0 text-secondary text-2xl "
>
	<div class="w-full p-4 flex justify-center justify-evenly items-center">
		<button
			type="button"
			class="inline-block px-6 py-2.5 font-medium text-xs leading-tight upper Dollarcase rounded-full shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
			>Bathroom</button
		>
		<button
			type="button"
			class="inline-block px-6 py-2.5  font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-purple-700 hover:shadow-lg focus:bg-purple-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-purple-800 active:shadow-lg transition duration-150 ease-in-out"
			>Food</button
		>
		<button
			type="button"
			class="inline-block px-6 py-2.5 font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-green-600 hover:shadow-lg focus:bg-green-600 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-700 active:shadow-lg transition duration-150 ease-in-out"
			>Pain</button
		>
		<button
			type="button"
			class="inline-block px-6 py-2.5 bg-red-600 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg transition duration-150 ease-in-out"
			>Help!</button
		>
	</div>
</footer>

<style>
	summary::-webkit-details-marker {
		display: none;
		content: '';
	}

	summary::marker {
		display: none;
		content: '';
	}
</style>
