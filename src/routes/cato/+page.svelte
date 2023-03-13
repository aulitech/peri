<script>
	function reqDev() {
		navigator.bluetooth
			.requestDevice({
				filters: [
					{
						services: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']
					}
				]
			})
			.then((device) => {
				// Human-readable name of the device.
				console.log(device.name + ' connecting');

				// Attempts to connect to remote GATT Server.
				return device.gatt.connect();
			})
			.catch((error) => {
				console.error(error);
			});
	}

	import { browser } from '$app/environment';

	if (browser) {
		window.navigator.bluetooth.getAvailability().then((isBluetoothAvailable) => {
			console.log(`> Bluetooth is ${isBluetoothAvailable ? 'available' : 'unavailable'}`);
		});

		if ('onavailabilitychanged' in navigator.bluetooth) {
			window.navigator.bluetooth.addEventListener('availabilitychanged', function (event) {
				console.log(`> Bluetooth is ${event.value ? 'available' : 'unavailable'}`);
			});
		}
	}
</script>

<svelte:head>
	<title>Cato</title>
</svelte:head>

<button on:click={reqDev}>CLICK ME</button>

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
