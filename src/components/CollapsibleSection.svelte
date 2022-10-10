<script>
    // based on suggestions from:
    // Inclusive Components by Heydon Pickering https://inclusive-components.design/collapsible-sections/
    export let headerText;
    export let headerClass;

    let dwellTimer;
	let expanded = false;
	function dwell(tmr) {
		clearTimeout(dwellTimer);
		dwellTimer = setTimeout( () => expanded = true,	tmr	);
	}
</script>

<section class={headerClass}
    on:mouseleave|preventDefault={() => {clearTimeout(dwellTimer); expanded = false} }
    on:mouseenter|preventDefault={() => dwell(1000) }>
    <h3 class="font-bold text-xl text-left text-tertiary" aria-expanded={expanded}>{headerText}
    </h3>
    <div class='text-secondary' hidden={!expanded}>
        <slot></slot>
    </div>
</section>