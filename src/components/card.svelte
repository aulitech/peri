<script>
	import Speak from './speak.svelte';
	export let FBCard;
</script>

<a
	class="w-80 group text-secondary rounded-md shadow-sm hover:text-2xl hover:border-white hover:border-8 flex flex-row hover:shadow-md justify-between"
	href={`/cards/${FBCard.id}`}
>
	<Speak Speak={FBCard.name} />
	<li class="w-full p-2 truncate group-hover:overflow-auto group-hover:whitespace-normal ">
		{FBCard.name}
	</li>
</a>
