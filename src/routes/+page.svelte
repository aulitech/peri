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

<header class="w-full h-12 bg-primary text-primary font-bold text-2xl text-center">Flipbook</header>

<div class="flex flex-row bg-secondary flex-wrap justify-center h-85vh ">
	<div class="flex flex-row  flex-wrap cursor-cell justify-start p-4 gap-4">
		{#each Object.entries(filteredTabs).sort() as [tab, cardList]}
			<details class="bg-secondary p-2 rounded-md open:snap-start flex flex-col open:bg-tertiary">
				<summary class="w-80 p-2 font-bold text-2xl text-left text-tertiary open:text-primary"
					>{tab}</summary
				>

				<ul class="text-base font-normal flex flex-row flex-wrap justify-left gap-x-8 gap-y-2">
					{#each cardList.sort() as card}
						<li><FBCard FBCard={card} /></li>
					{/each}
				</ul>
			</details>
		{/each}

		<Newphrase Newphrase={''} />
	</div>
</div>

<footer class="w-full h-16 bg-primary fixed left-0 bottom-0 text-primary text-2xl ">
	<div class="w-full p-4 flex justify-evenly items-center">
		<button
			type="button"
			class="p-2 font-bold text-md uppercase rounded-full shadow-md hover:bg-tertiary hover:shadow-lg transition duration-150 ease-in-out"
			>Bathroom</button
		>
		<button
			type="button"
			class="p-2 font-bold text-md uppercase rounded-full shadow-md hover:bg-tertiary hover:shadow-lg transition duration-150 ease-in-out"
			>Food</button
		>
		<button
			type="button"
			class="p-2 font-bold text-md uppercase rounded-full shadow-md hover:bg-tertiary hover:shadow-lg transition duration-150 ease-in-out"
			>Pain</button
		>
		<button
			type="button"
			class="p-2 font-bold text-md uppercase rounded-full shadow-md hover:bg-tertiary hover:shadow-lg transition duration-150 ease-in-out"
			>Help</button
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
