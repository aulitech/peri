<script>
	import { speakTimer, speak } from './speak';
	export let Newphrase;
</script>

<div class="bg-gray-100 p-2 border border-gray-300 flex flex-col align-middle">
	<div class="w-80 p-2 border-gray-300 font-bold text-xl align-middle justify-center text-left">
		New Phrase
	</div>

	<ul class="bg-white border border-gray-300 text-base font-normal ">
		<li class="flex flex-row flex-wrap align-center">
			<div
				on:mouseenter={() =>
					speak(
						// @ts-ignore
						document.getElementById('txt').value,
						1000
					)}
				on:mouseleave={() => clearTimeout(speakTimer)}
				class="w-[10%]"
			/>
			<div class="w-4/5">
				<label for="txt" />
				<!-- svelte-ignore a11y-autofocus -->
				<textArea
					id="txt"
					name="txt"
					class="w-full border-none"
					autofocus
					placeholder="Type a new phrase"
					on:mouseleave={() => (Newphrase = document.getElementById('txt').value)}
				/>
			</div>
		</li>
	</ul>
</div>
