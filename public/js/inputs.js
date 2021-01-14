import GameData from './Game.js';

let game = new GameData({ 
    numActiveBlocks: 6, 
    startingActiveBlock: 0,
    speed: 70
});

$('#start').click(() => {
    game.start();
})

$('#pause').click(() => {
    game.pause();
})

$('#restart').click(function(){
    game.end();
    game.start();
    this.blur();
})

$('#end').click(() => {
    game.end();
})

$('#drop').click(() => {
    game.dropBlocks();
})

$(window).keyup(() => {
    game.keydown = false;
})

$(window).keydown(e => {
    console.log(e)
    if(e.which === 32 && !game.keydown && game.inProgress){
        game.dropBlocks();
        game.keydown = true;
    }
})