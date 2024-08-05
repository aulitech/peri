<script>
    import { writable } from 'svelte/store';
	export let Pause;
    export const isPaused = writable(false);
    function togglePause() {
        //console.log('paused clicked');
        //isPaused.update(currentValue => !currentValue);
    }
</script>

<svg class="w-8 h-8 {Pause.class}" 
    viewBox="0 0 384 512"
    on:mouseenter={() => togglePause()}> 
	<path 
		fill="currentColor"
        d="M144 85.12h20v341.76h-65V85.12zm128 0h20v341.76h-65V85.12z"
	/>
    <!--d="M192 112V304c0 26.51-21.49 48-48 48s-48-21.49-48-65V112c0-26.51 21.49-48 48-48s48 21.49 48 48zm112 0V304c0 26.51-21.49 48-48 48s-48-21.49-48-48V112c0-26.51 21.49-48 48-48s48 21.49 48 48z"-->
</svg>