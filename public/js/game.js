class GameData {
    constructor({ numActiveBlocks, startingActiveBlock, speed }){
        this.allBlocks = [...$('.block')];
        this.allRows =  [...$('.row')];
        this.playRow = [...$('.row:first-of-type > .block')];
        this.highlightedBlocks = [];
        this.defaultNumActiveBlocks = numActiveBlocks
        this.numActiveBlocks = numActiveBlocks;
        this.startingActiveBlock = startingActiveBlock;
        this.lastActiveBlock = numActiveBlocks + startingActiveBlock;
        this.defaultSpeed = speed;
        this.currentSpeed = this.defaultSpeed;
        this.currentRow = 1;
        this.keydown = false;
        this.speedReductionRate = .93;
        this.activeBlockReductionRate = .35;
    }

    init(){
        clearInterval(this.interval);
        this.numActiveBlocks = this.defaultNumActiveBlocks;
        this.startingActiveBlock = 0;
        this.lastActiveBlock = this.numActiveBlocks + this.startingActiveBlock;
        this.currentSpeed = this.defaultSpeed;
        this.currentRow = 1;
        this.inProgress = false;
        this.allBlocks.forEach(block => $(block).removeClass('active gameover win'));
        this.actionCount = 0;
    }

    start(){
        this.keydown = false;
        if(!this.inProgress){
            this.inProgress = true;
            this.interval = setInterval(() => this.playNextFrame(), this.currentSpeed);
        }
    }

    pause(){
        clearInterval(this.interval)
        this.inProgress = false;
    }

    end(){
        this.init();
    }

    restart(){
        this.init();
        // this.keydown = false;
        if(!this.inProgress){
            this.inProgress = true;
            this.interval = setInterval(() => this.playNextFrame(), this.currentSpeed);
        }
    }

    playNextFrame(){
        this.highlightedBlocks = [];
        this.playRow.forEach((block, idx) => {
            if(block.dataset.col >= this.startingActiveBlock && block.dataset.col < this.lastActiveBlock && this.inProgress){
                $(block).addClass('active')
                this.highlightedBlocks.push(parseInt(block.dataset.col))
            } else {
                $(block).removeClass('active')
            }
        })

        //Check for when the active play row hits either end of the board and then change direction when that happens
        if(this.lastActiveBlock === this.playRow.length){
            this.travelReverse = true;
        } else if(this.startingActiveBlock === 0){
            this.travelReverse = false;
        }

        //Based on the direction set, increment active play row in that direction
        if(!this.travelReverse){
            this.startingActiveBlock++;
            this.lastActiveBlock++;            
        } else {
            this.startingActiveBlock--;
            this.lastActiveBlock--;            
        }
    }

    dropBlocks(){
        console.log(this)
        clearInterval(this.interval);
        let missedBlocks = 0;
        [...this.allRows].reverse().forEach((row, i) => {
            [...row.children].forEach((block, j) => {
                if(i+1 === this.currentRow && this.highlightedBlocks.includes(j)){
                    if(i > 0 && [...this.allRows].reverse()[i-1].children[j].classList.contains('active')){
                        $(block).addClass('active');
                    } else if(i === 0){
                        $(block).addClass('active');
                    } else {
                        missedBlocks++;
                    }
                }
            })
        })

        if(missedBlocks >= Math.ceil(this.numActiveBlocks)){
            this.pause();
            this.inProgress = !this.inProgress;
            this.playRow.forEach(block => {
                if(block.classList.contains('active')){
                    console.log(block)
                    $(block).removeClass('active')
                    $(block).addClass('gameover')
                }
            })
        } else if(this.currentRow === this.allRows.length){
            this.pause();
            this.allBlocks.forEach(block => {
                if(block.classList.contains('active')){
                    $(block).removeClass('active');
                    $(block).addClass('win')
                }
            })
            this.inProgress = !this.inProgress;
        } else {
            this.pause();
            this.currentRow++;
            this.currentSpeed = this.currentSpeed * this.speedReductionRate;
            this.numActiveBlocks = this.numActiveBlocks - this.activeBlockReductionRate;
            this.lastActiveBlock = Math.ceil(this.numActiveBlocks) + this.startingActiveBlock;
            this.start();
        }
    }
}

export default GameData;