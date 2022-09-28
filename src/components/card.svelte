<script>
	import Record from './record.svelte';
	import Text from './text.svelte';
	import Speak from './speak.svelte';
	export let FBCard;
</script>

<details
	class="w-80 text-secondary rounded-md shadow-sm hover:text-2xl hover:border-white hover:border-8 hover:shadow-md "
>
	<summary class="w-full p-2 truncate  group  flex flex-row justify-start">
		<Speak Speak={{ text: FBCard.name, color: '#ffffff00' }} />
		<span class="w-80 truncate group-hover:overflow-auto group-hover:whitespace-normal"
			>{FBCard.name}</span
		>
	</summary>
	<ul class="flex flex-row justify-evenly">
		<li><Record Record={{ class: 'h-6 w-6', color: '#fedd68a0' }} /></li>
		<li><Text Text={{ class: 'h-6 w-6', color: '#fedd68a0' }} /></li>
	</ul>
</details>

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
