<script>
	import { speakTimer, speak } from './speak';
	export let FBCard;
</script>

<a
	class="w-80 bg-secondary text-secondary rounded-md shadow-md hover:text-2xl hover:border-white hover:border-8 flex flex-row hover:shadow-md justify-between"
	href={`/cards/${FBCard.id}`}
>
	<li
		on:mouseenter={() => speak(FBCard.name, 1000)}
		on:mouseleave={() => clearTimeout(speakTimer)}
		class="w-6"
	/>
	<li class="w-full p-2">{FBCard.name}</li>
</a>
