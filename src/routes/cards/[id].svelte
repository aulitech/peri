<script context="module">
    import { getCardsById } from "../../cardstore";
    export async function load(ctx) {
        let id = ctx.page.params.id;
        const card = await getCardsById(id);
        return { props: { card }}
    }
</script>
<script>
    export let card;
    const type = card.types[0].type.name;
</script>
<svelte:head>
	<title>Flipbook - {card.name}</title>
</svelte:head>

<div class="flex flex-col items-center">

    <h1 class="text-4xl text-center my-8 uppercase">{card.name}</h1>
    <p>Type: <strong>{type}</strong> | Height: <strong>{card.height}</strong>
        | Weight: <strong>{card.weight}</strong>
    </p>
    <img class="card-image" src={card.sprites['front_default']} 
    alt={card.name}
    />
</div>
