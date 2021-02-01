function logObj(obj){
    console.log(JSON.parse(JSON.stringify(obj)));
}

const menuSound = new Howl({
    src: ['/sounds/notification.wav'],
    volume: .25
})

const loseSound = new Howl({
    src: ['../sounds/lose.wav'],
    volume: .75
})

const winSound = new Howl({
    src: ['../sounds/win.wav'],
    volume: .5 
})

const dropSound = new Howl({
    src: ['../sounds/drop.wav'],
    volume: .5
})

const cancelSound = new Howl({
    src: ['../sounds/cancel.wav'],
    volume: .3
})

const winbgm = new Howl({
    src: ['../sounds/winbgm.mp3'],
    volume: 0,
    loop: true
})

const bgmVol = .4;
// const bgmVol = 0;
const bgm = new Howl({
    src: ['../sounds/bgm.mp3'],
    loop: true,
    volume: 0,
    autoplay: true,
    onload: () => {
        bgm.fade(.25, bgmVol, 3000)
    }
})

class GameData {
    constructor({ numStartActiveBlocks, startingActiveBlock, speed, assists }){
        this.dom = {
            allBlocks: [...$('.block')],
            allRows: [...$('.row')],
            playRow: [...$('.row:first-of-type > .block')],
            allCols: [...Array([...$('.row:first-of-type > .block')].length)].map((col, j) => [...$('.block')].filter((block, k) => block.dataset.col == j))
        };
        this.defaults = {
            currentSpeed: speed,
            highlightedBlocks: [],
            lastActiveBlocks: [],
            numStartActiveBlocks: numStartActiveBlocks,
            startingActiveBlock: startingActiveBlock,
            lastActiveBlock: startingActiveBlock + numStartActiveBlocks,
            currentRow: 1,
            sideOverflow: 1,
            inProgress: false,
            missedblocks: 0,
            gameWon: false,
            gameOver: false,
            cheatUsed: false,
            timeStart: Date.now()
        }
        this.configs = {
            speedReductionRate: .8,
            activeBlockReductionRate: .35,
            // activeBlockReductionRate: 0,
            timeoutAt: 60,
            sound: {
                volume: null,
                muted: false,
                currentSong: 'default',
                defaultVolumes: {
                    menuSound: .25,
                    loseSound: .75,
                    winSound: .5,
                    dropSound: .5,
                    cancelSound: .3,
                    bgm: .4
                }
            },
            assists: {
                highlightTargetPlayRow: assists ? assists.highlightTargetPlayRow : false,
                highlightColumns: assists ? assists.highlightColumns : false,
            }
        }
        this.currentGameData = {
            highlightedBlocks: [],
            numStartActiveBlocks: numStartActiveBlocks,
            startingActiveBlock: 0,
            lastActiveBlock: startingActiveBlock + numStartActiveBlocks,
            currentSpeed: speed,
            currentRow: 1,
            inProgress: false,
            travelReverse: false,
            isAnimating: false,
            gameOver: false,
            gameWon: false,
            missedBlocks: 0,
            sideOverflow: 1,
            lastActiveBlocks: [],
            cheatUsed: false
        }
        this.state = {
            keydown: false,
            spamPrevent: false,
            spamPreventDuration: 50,
            modals: {
                welcomeModalOpen: false,
                assistsModalOpen: false,
                modalOpen: false,
                leaderboardModalOpen: false,
            }
        }
        this.time = {
            gameStart: null,
            gameEnd: null,
            timeElapsed: 0,
            interval: null
        }
        this.persists = {
            highscores: JSON.parse(localStorage.getItem('high_scores'))
        }
    }

    playSounds(){
        const defaultVolumes = this.configs.sound.defaultVolumes;
        this.configs.sound.muted = false;
        
        bgm.fade(0, defaultVolumes.bgm, 1000)
        winbgm.fade(0, defaultVolumes.bgm, 1000)
        menuSound.volume(defaultVolumes.menuSound);
        loseSound.volume(defaultVolumes.loseSound);
        winSound.volume(defaultVolumes.winSound);
        dropSound.volume(defaultVolumes.dropSound);
        cancelSound.volume(defaultVolumes.cancelSound);
    }

    muteSounds(){
        this.configs.sound.muted = true;

        bgm.fade(bgmVol, 0, 1000)
        winbgm.fade(bgmVol, 0, 1000)
        menuSound.volume(0);
        loseSound.volume(0);
        winSound.volume(0);
        dropSound.volume(0);
        cancelSound.volume(0);
    }

    setTime(start){
        this.time.date = new Date();
        this.time.timeElapsed = (start - this.time.date.getTime());

        //parse times into legible seconds and milliseconds
        this.time.timeElapsedSeconds = (this.time.timeElapsed / -1000).toFixed(0).padStart(2, '0');
        this.time.timeElapsedMS = (this.time.date.getMilliseconds()/10).toFixed(0).padStart(2, '0');

        // dont allow milliseconds to display 100 due to third digit
        this.time.timeElapsedMS = this.time.timeElapsedMS === '100' ? '99' : this.time.timeElapsedMS;
        this.changeDisplayTime(this.time.timeElapsedSeconds, this.time.timeElapsedMS);

        // game timeout @
        if(this.time.timeElapsedSeconds == this.configs.timeoutAt){
            this.gameOverAni({ source: 'timeout' });
            this.changeDisplayTime(60, 0)
        }
    }

    changeDisplayTime(s, ms){
        $('#seconds').text(s);
        $('#milliseconds').text(ms);
    }

    //reset all data in currentGameData to defaults
    init(){
        //reset all blocks to normal state
        this.dom.allBlocks.forEach(block => $(block).removeClass().addClass('block'));

        if(this.configs.sound.currentSong === 'win'){
            winbgm.stop();  
            bgm.play();
            bgm.volume(0 )
            if(!this.configs.sound.muted){
                bgm.fade(0, bgmVol, 1000);
            }  
            this.configs.sound.currentSong  = 'default';
        }

        if(loseSound.playing()){
            loseSound.stop();
        }

        //reset game data on reset
        clearInterval(this.currentGameData.interval);
        this.currentGameData = {
            ...this.defaults,
            lastActiveBlock: this.defaults.numStartActiveBlocks + this.defaults.startingActiveBlock,
        }

        //reset timer
        clearInterval(this.time.interval)
        Object.keys(this.time).forEach(key => this.time[key] = '00');
        this.changeDisplayTime(this.time.timeElapsedSeconds, this.time.timeElapsedMS);
        $('#time').addClass('hide'); 

    }

    onload(){
        this.currentGameData.inProgress = true; 
        this.currentGameData.interval = setInterval(this.playNextFrame .bind(this), this.currentGameData.currentSpeed);

        //Only open welcome modal if a username has not been previously entered / localStorage has been cleared
        if(!localStorage.getItem('username')){
            this.generateModal({
                className: 'welcome',
                welcome: true,
                heading: '<u style="font-family: \'Abril Fatface\'">Welcome to Staxx</u>', 
                line1: 'The objective of <strong>STAXX</strong> is to stack the blocks to the top of the grid. That\'s all! You only have one shot per row though so if you miss the top block, you\'ll have to start over. Not to mention the game will get harder as you progress.',
                line2: 'Just press click/tap anywhere or press space bar to drop the blocks and get to the top!', 
                closeText: 'Play Staxx!' 
            })
            $('#generic.modal').removeClass('hide');
        } 
    }

    start(){
        this.init();

        if(!this.currentGameData.inProgress){
            this.currentGameData.inProgress = true;
            this.currentGameData.interval = setInterval(this.playNextFrame.bind(this), this.currentGameData.currentSpeed);
        }
    }

    pause(){
        clearInterval(this.currentGameData.interval)
        clearInterval(this.time.interval)
        this.currentGameData.inProgress = false;
    }

    playNextFrame(){
        this.currentGameData.highlightedBlocks = [];
        //Top play row animation
        this.dom.playRow.forEach((block, idx) => {
            //if iterated blocks dataset.col is between startringActive and lastActive then paint active color
            if(this.currentGameData.startingActiveBlock <= block.dataset.col && block.dataset.col < this.currentGameData.lastActiveBlock){
                $(block).addClass('active')
                this.currentGameData.highlightedBlocks.push(+block.dataset.col)
            } else {
                $(block).removeClass('active')
            }
        })

        //Check for when the active play row hits either end of the board and then change direction when that happens
        if(this.currentGameData.lastActiveBlock >= this.dom.playRow.length + this.currentGameData.sideOverflow){
            this.currentGameData.travelReverse = true;
        } else if(this.currentGameData.startingActiveBlock <= 0 - this.currentGameData.sideOverflow){
            this.currentGameData.travelReverse = false;
        }

        //Based on the direction set, increment active play row in that direction
        if(!this.currentGameData.travelReverse){
            this.currentGameData.startingActiveBlock++;
            this.currentGameData.lastActiveBlock++;            
        } else {
            this.currentGameData.startingActiveBlock--;
            this.currentGameData.lastActiveBlock--;            
        }

        this.toggleAssists();
    }

    toggleAssists(){
        //Highlight assist for full target column
        if(this.configs.assists.highlightColumns){
            this.dom.allCols.forEach((col, i) => {
                col.forEach((block, j) => {
                    if(this.currentGameData.highlightedBlocks.includes(i) && !$(block).hasClass('active')){
                        $(block).addClass('assistHighlight')
                    } else {
                        $(block).removeClass('assistHighlight')
                    }
                })
            })
        } else {
            this.dom.allBlocks.forEach(block => $(block).removeClass('assistHighlight'))
        }

        //Highlight assist for current row + target block(s) - this block will run regardless of assist setting
        this.dom.allRows.forEach((row, j) => {
            let targetRow = +row.dataset.row;
            if(targetRow === this.currentGameData.currentRow){
                [...row.children].forEach((block, i) => {
                    if(targetRow === 1 || $(this.dom.allRows[j + 1].children[i]).hasClass('active')){
                        //Even if target assist is off, apply style for other uses but make transparent
                        $(block).removeClass('target'); //reset
                        $(block).addClass('target');
                    }
                })
            } else {
                [...row.children].forEach(block => $(block).removeClass('target transparent'))
            }
        })

        //Highlight assist for playrow
        if(this.configs.assists.highlightTargetPlayRow){
            this.dom.playRow.forEach((block, i) => {
                if(this.dom.allCols[i].some(colBlocks => $(colBlocks).hasClass('target'))){
                    $(block).addClass('target');
                }
            })
        }
    }

    dropBlocks(){
        dropSound.play(); 
        //prevent block drop if any modals are open
        if(Object.keys(this.state.modals).some(key => this.state.modals[key] === true)) return;

        //initiate timer on first drop
        if(this.currentGameData.currentRow === 1){ 
            this.time.gameStart = Date.now()
            this.time.interval = setInterval(this.setTime.bind(this, this.time.gameStart), 10);
            $('#time').removeClass('hide');    
        }

        this.currentGameData.missedBlocks = 0;
        this.dom.allCols.filter((c, idx) => this.currentGameData.highlightedBlocks.includes(idx)).forEach((col, i) => { //Iterate through each block in columns that match the current active columns
            col.map((block, j) => {
                //Animate and add active block color if is first move
                if(this.currentGameData.currentRow === 1 && block.dataset.row == 1){
                    $(block).addClass('active');
                //If block under current row has an active block or is in the first row
                } else if($(col[j+1]).hasClass('active') || block.dataset.row == 1){
                    //check if player is on last play row so that active class is not applied async
                    if(!$(block).hasClass('active')){
                        this.currentGameData.lastActiveBlocks.push(block);
                        setTimeout(() => {
                            $(block).addClass('active');
                        }, 15);
                    }
                //Block is in current row
                } else {
                    if(block.dataset.row == this.currentGameData.currentRow){
                        this.currentGameData.missedBlocks++
                    }
                    $(block).addClass('flash')
                    setTimeout(() => {
                        $(block).removeClass('flash');
                    }, 15*j);
                }
            })
        })

        //check if cheat was used during block drop and then validate the game
        this.currentGameData.cheatUsed = Object.keys(this.configs.assists).some(key => this.configs.assists[key] === true) ? true : this.currentGameData.cheatUsed
        this.validateGame();
        // logObj(this.currentGameData.cheatUsed)
    }

    validateGame(){
        //LOSS CONDITIONS - missedBlocks equals amount active play blocks (complete miss)
        if(this.currentGameData.missedBlocks >= Math.ceil(this.currentGameData.highlightedBlocks.length)){
           this.gameOverAni({ source: 'miss' });
        //WIN CONDITIONS - a full miss does not occur and the current row is the top row
        } else if(this.currentGameData.currentRow === this.dom.allRows.length){
           this.gameWinAni();
        //CONTINUE PLAYING
        } else {
            //at one single active block, block bounces off walls instead of overflowing outside of it
            this.currentGameData.sideOverflow = this.currentGameData.numStartActiveBlocks < 1
                ? 0
                : this.currentGameData.sideOverflow;
            this.currentGameData.currentRow++;
            this.currentGameData.currentSpeed = this.currentGameData.currentSpeed * this.configs.speedReductionRate;
            this.currentGameData.lastActiveBlock = Math.ceil(this.currentGameData.numStartActiveBlocks) + this.currentGameData.startingActiveBlock;
            this.currentGameData.numStartActiveBlocks = this.currentGameData.numStartActiveBlocks - this.configs.activeBlockReductionRate > 0
                ? this.currentGameData.numStartActiveBlocks - this.configs.activeBlockReductionRate
                : 1;
        }
    }

    async gameWinAni(){
        //Change song to win song
        if(!this.configs.sound.muted){
            winSound.play();
            bgm.fade(bgmVol, 0, 500);
            setTimeout(() => {
                bgm.stop();
            }, 500);
            winbgm.play();
            winbgm.fade(0, bgmVol, 500);
            this.configs.sound.currentSong = 'win';
        }

        //change all active blocks on the board to win color
        this.pause();
        this.currentGameData.inProgress = !this.currentGameData.inProgress;
        this.dom.allBlocks.forEach(block => {
            if($(block).hasClass('active')){
                $(block).removeClass('active flash');
                $(block).addClass('win')
            }
            this.currentGameData.gameWon = true;
        })

        //Winning time score recorded here
        const timeString = `${(this.time.timeElapsed / -1000).toFixed(0)}.${(this.time.date.getMilliseconds()/10).toFixed(0).padStart(2, '0')}`;
        let leaderboardScore = false;

        //Record times to localstorage/DB if all assists were off the entire duration of the game
        if(!this.currentGameData.cheatUsed){
            const highScores = localStorage.getItem('high_scores') !== null 
                ? [...JSON.parse(localStorage.getItem('high_scores')), timeString]
                : [timeString]
            this.persists.highscores = highScores.sort((a, b) => a - b);
            localStorage.setItem('high_scores', JSON.stringify(highScores))

            //POST win data to DB
            try {
                const postResults = await axios.post('https://staxxz.herokuapp.com/scores', {time: +timeString, name: localStorage.getItem('username')})
            } catch (err){
                console.log(err)
            }

            //GET high scores from db
            const results = await axios.get('https://staxxz.herokuapp.com/scores'); 
            const sorted = results.data.sort((a, b) => a.time - b.time);

            //Set score as a leaderboard score if there are less than 10 scores on the board or they beat the 10th fastest time.
            if(sorted[5] && timeString < sorted[5].time){
                leaderboardScore = true;
            } else if (!sorted[5]){
                leaderboardScore = true;
            }
        } 

        //Generate win modal
        this.currentGameData.timeEnd = Date.now();
        this.currentGameData.timeElapsed = this.currentGameData.timeEnd - this.currentGameData.timeStart;
        this.generateModal({
            heading: 'You won!',
            line1: `Your finishing time was <strong>${timeString}</strong> seconds ${!leaderboardScore ? 'but you didn\'t make it onto the leaderboard this time!' : '.'}`,
            line2: leaderboardScore ? 'Congrats! You made it on the leaderboard!' : '<i>Try and go for a faster time!</i>',
            line3: this.currentGameData.cheatUsed ? '<span style="font-size: .75rem">(Your score was not recorded because you had a cheat on)</span>' : null,
            closeText: 'Play Again!',
            timeout: 150
        })
    }

    gameOverAni({ source }){
        this.pause();
        this.currentGameData.inProgress = !this.currentGameData.inProgress;
        const roundedTime = Math.round.call(this, +this.time.timeElapsedSeconds);

        if(source === 'miss'){
            // change last played blocks to gameover color
            this.currentGameData.lastActiveBlocks.forEach((block, i) => {
                if(i >= this.currentGameData.lastActiveBlocks.length - Math.ceil(this.currentGameData.highlightedBlocks.length)){
                    $(block).addClass('gameover')
                }
            })
            // change active play blocks to normal color
            this.dom.playRow.forEach(block => {
                if($(block).hasClass('active')){
                    $(block).removeClass('active flash')
                }
            })
            loseSound.play()
            this.generateModal({
                heading: 'Yikes.',
                line1: `You lost in <strong>${(this.time.timeElapsed / -1000).toFixed(0)}.${(this.time.date.getMilliseconds()/10).toFixed(0).padStart(2, '0')}</strong> seconds.`,
                line2: `${roundedTime >= 3 ? '<i>Better luck next time!</i>' : '<i>Are you even trying?</i>'}`,
                timeout: 150
            });
        } else if(source === 'timeout'){
            this.dom.playRow.forEach(block => {
                if($(block).hasClass('active')){
                    $(block).removeClass('active flash');
                    $(block).addClass('gameover');
                }
            })
            //Only open the timeout modal if game times out and no modal is currenty open - otherwise just timeout without notification
            if(Object.keys(this.state.modals).every(key => !this.state.modals[key])){
                loseSound.play();
                this.generateModal({
                    heading: 'Where\'d you go?',
                    line1: `Your game timed out (maximum game time is 60 seconds).`,
                    line2: `<i>Stay awake this time!</i>`, 
                    timeout: 150
                });
            }
        }

        this.dom.allBlocks.forEach(block => $(block).removeClass('assistHighlight'))
        this.currentGameData.timeEnd = Date.now();
        this.currentGameData.timeElapsed = this.currentGameData.timeEnd - this.currentGameData.timeStart;
        this.currentGameData.gameOver = true;
    }

    generateModal({ welcome, heading, line1, line2, line3, closeText='Try again?', timeout=0, className }){
        $('#generic').addClass(className);
        setTimeout(() => {
            $('main > .content').addClass('blur');
            this.state.modals.modalOpen = true;
            $('#generic .heading').html(heading);
            $('#generic .line1').html(line1 || null);
            $('#generic .line2').html(line2 || null);
            $('#generic .line3').html(line3 || null);
            !welcome ? $('#generic .name-form').hide() : null //dont display input if current modal is not the welcome modal
            $('#generic .close span').html(closeText);
            $('#generic').removeClass('hide');
        }, timeout);  
    }
}
