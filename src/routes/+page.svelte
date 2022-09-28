<script>
	import FBCard from '../components/card.svelte';
	import Newphrase from '../components/newPhrase.svelte';
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

<div class="flex flex-row bg-secondary flex-wrap justify-center h-85vh overflow-auto">
	<div class="flex flex-row flex-wrap justify-start p-4 gap-4 snap-y">
		{#each Object.entries(filteredTabs).sort() as [tab, cardList]}
			<details class="bg-primary p-2 rounded-md open:snap-start flex flex-col open:bg-tertiary ">
				<summary class="w-80 p-2 font-bold text-xl text-left text-tertiary">{tab}</summary>

				<ul
					class="text-base font-normal max-h-[33vh] overflow-auto flex flex-row flex-wrap justify-left gap-x-8 gap-y-2"
				>
					{#each cardList.sort() as card}
						<li><FBCard FBCard={card} /></li>
					{/each}
				</ul>
			</details>
		{/each}
	</div>
</div>

<footer
	class="w-full bg-primary shadow-md border border-gray-800 fixed left-0 bottom-0 text-primary text-xl flex flex-col"
>
	<Newphrase Newphrase={''} />
	<div class="w-3/5 p-4 flex flex-row justify-evenly items-center">
		{#each ['Bathroom', 'Food', 'Pain', 'Help'] as lbl}
			<button
				type="button"
				class="p-2 font-bold text-md rounded-md shadow-md hover:bg-tertiary hover:shadow-lg transition duration-150 ease-in-out"
				>{lbl}</button
			>
		{/each}
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
