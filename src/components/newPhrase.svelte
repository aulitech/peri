<script>
	import Speak from './speak.svelte';
	export let Newphrase;
</script>

<div class="group w-full p-2 flex flex-row text-base font-normal bg-tertiary">
	<Speak Speak={{ text: Newphrase, color: '#ffffff80' }} />

	<div class="w-1/2 bg-tertiary">
		<label for="txt" />
		<textArea
			id="txt"
			name="txt"
			class="w-full p-2 text-xl outline-black border-none bg-tertiary"
			autofocus
			placeholder="Type a phrase"
			on:mouseleave={() => (Newphrase = document.getElementById('txt').value)}
		/>
	</div>
</div>
