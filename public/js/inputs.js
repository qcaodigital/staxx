const game = new GameData({ 
    numStartActiveBlocks: 4,
    startingActiveBlock: 0, 
    speed: window.innerWidth > window.innerHeight ? 55 : 70
});

game.onload();

$('.restart').click(function(e){
    if(Object.keys(game.state.modals).some(key => game.state.modals[key] === true)) return;
    game.start();
    e.stopPropagation();
    this.blur();
})

$('.bgm').click(function(e){
    if(Object.keys(game.state.modals).some(key => game.state.modals[key] === true)) return;
    e.stopPropagation();
    game.configs.sound.muted ? game.playSounds() : game.muteSounds();
    $(this).toggleClass('muted')
    this.blur();
})

function dropBlocksHandler(e){
    if(e.target.parentElement.localName === "button" || e.target.tagName === "BUTTON") return;
    if(Object.keys(game.state.modals).some(key => game.state.modals[key] === true)) return;
    if(!game.state.keydown && game.currentGameData.inProgress && !game.state.spamPrevent && (!game.currentGameData.gameWon && !game.currentGameData.gameOver)){
        if(e.which === 32 || e.type === 'mousedown' || e.type === 'touchstart'){
            game.dropBlocks();
            game.state.keydown = true;
            game.state.spamPrevent = true;
        } 
    }
};

function spamPreventRelease(){
    game.state.keydown = false;
    setTimeout(() => {
        game.state.spamPrevent = false;
    }, game.state.spamPreventDuration);
}

$(window).keydown(e => dropBlocksHandler(e))
$(window).keyup(() => spamPreventRelease());
$(window).mousedown(e => dropBlocksHandler(e))
$(window).mouseup(() => spamPreventRelease());
window.addEventListener('touchstart', e => dropBlocksHandler(e))
window.addEventListener('touchend', () => spamPreventRelease());

//MODALS//
//CLOSE MODAL FUNCTION FOR GENERIC MODALS (WELCOME, WIN, LOSE, TIMEOUT, HIGHSCORE)
function closeModal(e){
    if(game.state.modals.modalOpen && ([13,27].includes(e.which) || e.type === 'click')){
        e.stopPropagation();
        menuSound.play();
        game.state.modals.modalOpen = false;  
        $('#generic.modal').addClass('hide');
        $('main > .content').removeClass('blur')

        //if the current modal is not the highscores page, it is either the welcome or win/end game modal, so restart game on button click
        !$('#generic.modal').is('.highscores') ? game.start() : $('#generic.modal').removeClass('highscores');
        $('.ui button').removeClass('active');

        //input on modal will have "display: none" if a name has been entered into localStorage
        if($('#generic.modal .name-form').css('display') !== 'none'){ 
            localStorage.setItem('username', $('#generic.modal .name-form').val())
        }

        this.blur();
    }
}

$('#generic.modal .close').click(closeModal);
$(window).keyup(closeModal)

$('.highscores').click(function(e){
    if(Object.keys(game.state.modals).some(key => game.state.modals[key] === true)) return;
    menuSound.play();
    e.stopPropagation();
    $(this).addClass('active')
    
    const highscores = game.persists.highscores;
    game.generateModal({
        heading: 'Your Highscores',
        line1: highscores && highscores[0] ? `1). ${highscores[0]} seconds` : '1). --------- ',
        line2: highscores && highscores[1] ? `2). ${highscores[1]} seconds` : '2). --------- ',
        line3: highscores && highscores[2] ? `3). ${highscores[2]} seconds` : '3). --------- ',
        className: 'highscores',
        closeText: 'Exit'
    })
    this.blur();  
})
//------------------//

//LEADER BOARD MODAL//
function closeLeaderboardModal(e){
    if(game.state.modals.leaderboardModalOpen && ([13,27].includes(e.which) || e.type === 'click')){
        game.state.modals.leaderboardModalOpen = !game.state.modals.leaderboardModalOpen;
        menuSound.play();
        $('.leaderboard').removeClass('active');
        $('#leaderboard').addClass('hide');
        $('main > .content').removeClass('blur');
        this.blur();
    }
}

$('.leaderboard').click(async function(e){
    if(Object.keys(game.state.modals).some(key => game.state.modals[key] === true)) return;
    game.state.modals.leaderboardModalOpen = !game.state.modals.leaderboardModalOpen;
    menuSound.play();
    e.stopPropagation();
    $(this).addClass('active')

    try {
        const results = await axios.get('https://staxxz.herokuapp.com/scores');
        const sorted = results.data.sort((a, b) => a.time - b.time);

        $('#leaderboard .name-list li').toArray().forEach((li, idx) => $(li).html(sorted[idx] ? sorted[idx].name : '---------'))
        $('#leaderboard .time-list li').toArray().forEach((li, idx) => $(li).html(sorted[idx]  ? `${sorted[idx].time}<span>s</span>` : '---'))
    } catch(err){
        console.log(err);
    }
    $('#leaderboard').removeClass('hide');
    $('main > .content').addClass('blur');
    this.blur();  
})

$('#leaderboard button').click(closeLeaderboardModal)
$(window).keyup(closeLeaderboardModal)
//------------------//

$('.assists').click(function(e){ //Listener for assists icon
    if(Object.keys(game.state.modals).some(key => game.state.modals[key] === true)) return;
    e.stopPropagation();
    if(!game.state.modals.welcomeModalOpen){
        menuSound.play();
        $('#assists').toggleClass('hide');
        $(this).toggleClass('active');
        game.state.modals.assistsModalOpen = !game.state.modals.assistModalOpen;
         $('main > .content').addClass('blur');
        this.blur();
    }
})

//ASSISTS MODAL//
function closeAssistModal(e){
    e.stopPropagation();
    if(game.state.modals.assistsModalOpen && ([13,27].includes(e.which) || e.type === 'click')){
        menuSound.play();
        $('#assists').addClass('hide');
        $('.assists').removeClass('active');
        game.state.modals.assistsModalOpen = false;
        $('main > .content').removeClass('blur')
        this.blur();
    }
}
$('#assists button').click(closeAssistModal)
$(window).keyup(closeAssistModal)

$('.cheat_list__item div').click(function(e){ //Toggle assists
    cancelSound.play();
    e.stopPropagation();
    $('.cheat_list__item').has(`div[data-assist=${e.target.dataset.assist}]`).toggleClass('active')

    game.configs.assists[e.target.dataset.assist] = !game.configs.assists[e.target.dataset.assist];
})
//------------------//
//------//