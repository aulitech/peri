export async function fetchAndAddCompletions(searchTerm) {
    if (starters.length < 2) {
        const termArr = searchTerm.split(' ');
        console.log('arr', termArr);
        const lastWord = termArr[termArr.length - 1];
        //const beginTerm = termArr.slice(0, -1);
        console.log('begin', lastWord);
        let nc = await getCompletions(searchTerm); 
        for (let i = 0; i < nc.length/*Math.min(nc.length, 25)*/; i++) {
            replaceHyphens(nc[i]);
        }
        let ncObjects = nc.map((completion) =>  {
            return [completion, 0]
        });
        starters = ncObjects.concat(starters); 
        console.log('start', starters);
    }
}