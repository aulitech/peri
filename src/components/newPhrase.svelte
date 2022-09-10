<script>
	import { speakTimer, speak } from './speak';
	export let Newphrase;
</script>

<div class="p-2 flex flex-col">
	<ul class="w-80 p-2 text-md font-normal text-primary">
		<li class="flex flex-row flex-wrap align-center">
			<div
				on:mouseenter={() =>
					speak(
						// @ts-ignore
						document.getElementById('txt').value,
						1000
					)}
				on:mouseleave={() => clearTimeout(speakTimer)}
				class="w-[10%] border-none bg-tertiary"
			/>
			<div class="w-4/5 bg-tertiary">
				<label for="txt" />
				<!-- svelte-ignore a11y-autofocus -->
				<textArea
					id="txt"
					name="txt"
					class="w-full text-xl  border-none bg-tertiary"
					autofocus
					placeholder="Type a phrase"
					on:mouseleave={() => (Newphrase = document.getElementById('txt').value)}
				/>
			</div>
		</li>
	</ul>
</div>
