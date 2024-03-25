export class Game {
    /**
     * @type {HTMLCanvasElement}
     */
    canvas;
    /**
     * @type {CanvasRenderingContext2D}
     */
    context;
    /**
     * @type {HTMLDivElement}
     */
    webIndicator;
    /**
     * @type {Number}
     */
    interval;
    /**
     * @type {Number}
     */
    timetoadd = 3000;
    audio;
    audioBufferCache = {};
    /**
     * @type {AudioBufferSourceNode}
     */
    playSource;
    /**
     * @type {Number}
     */
    lives;
    /**
     * @type {String[]}
     */
    words;
    /**
     * @type {Number}
     */
    wordslength
    /**
     * @type {Array<[String,Number,Number,Boolean?]>}
     */
    showedsWords = []
    movmentY = .5
    winAction
    winDelay
    loseAction
    loseDelay

    hasBeenStarted = false
    started = false

    indicator = 0

    constructor(words) {
        this.words = words
        this.wordslength = words.length
        this.webIndicator = document.querySelector('#indicator')
        console.log(this.webIndicator);
        this.canvas = document.querySelector('canvas#game')
        this.context = this.canvas.getContext('2d')
        this.audio = new (window.AudioContext || window.webkitAudioContext)()

        this.canvas.width = 400
        this.canvas.height = window.innerHeight < 640 ? window.innerHeight : 640
        this.webIndicator.style.height = `${this.canvas.height}px` 
    }

    evtHandler = (evt) => {
        if ( !this.started ) return
        
        const word = this.showedsWords[0][0]

        if (evt.key != word[0]) {
            this.sound('foldedAreas')
            return
        }

        this.sound('warning')

        if (word.length == 1) {
            this.showedsWords.shift()
            this.updateIndicatorPercent()
            return
        }

        this.showedsWords[0][0] = this.showedsWords[0][0].substring(1)
    }
    
    start() {
        if (this.started) return

        this.started = true
        
        if ( this.hasBeenStarted ) return

        this.hasBeenStarted = true

        this.interval = setInterval(() => {

            const word = this.generateWords()

            if ( word.done ) {
                clearInterval(this.interval)
                return
            }
            
            const x = Math.random() * this.canvas.width
            const y = 0
            this.showedsWords.push([word.value.toLowerCase(), x, y])

        }, this.timetoadd)
        
        document.addEventListener('keypress', this.evtHandler)

        this.draw()
    }

    updateIndicatorPercent() {
        const percent = this.getPercent()
        const percentUnit = this.canvas.height / 100
        const subindicator = this.webIndicator.querySelector('div')
        subindicator.style.height = `${percent * percentUnit}px`
    }

    async loadaudio(name) {
        if (this.audioBufferCache[name]) return
        const res = await fetch('./assets/'+name+'.mp3')
        const buffer = await res.arrayBuffer()
        const decodeBuffer = await this.audio.decodeAudioData(buffer)
        this.audioBufferCache[name] = decodeBuffer
    }

    playSound(name) {
        this.playSource = this.audio.createBufferSource()
        this.playSource.buffer = this.audioBufferCache[name]
        this.playSource.connect(this.audio.destination)
        this.playSource.start(this.audio.currentTime)
    }

    async sound(name) {
        await this.loadaudio(name)
        this.playSound(name)
    }

    generateWords() {
        if (this.indicator == this.wordslength) return { value: undefined, done: true }
        this.indicator++
        return { value: this.words.shift(), done: false }
    } 

    getPercent() {
        const part = this.wordslength - (this.showedsWords.length + this.words.length)
        return part / this.wordslength * 100
    }

    drawWord(word, x, y, active) {
        this.context.beginPath()
        this.context.font = '34px monospace'

        if (active) this.context.fillStyle = '#4acc8f'
        else this.context.fillStyle = '#fff'

        const wordWidth = this.context.measureText(word).width

        if ( x + wordWidth >= this.canvas.width )
            x = this.canvas.width - wordWidth - 10

        const strokewidth = wordWidth + 10
        const strokeHeight = 40
        const strokeX = x - 5
        const strokeY = y - 28
        this.context.strokeStyle = '#fff'
        this.context.strokeRect(strokeX,strokeY,strokewidth,strokeHeight)

        this.context.fillText(word, x, y)
        this.context.closePath()
    }

    drawWords() {
        for(const word of this.showedsWords)
            this.drawWord(...word)
    }

    moveWords() {
        this.showedsWords = this.showedsWords.map(word => {
            word[2] = word[2] + this.movmentY
            return word
        })
    }

    cls() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    checkLose() {
        for(const word of this.showedsWords) {
            if ( word[2] >= this.canvas.height - 10 )
                return true
        }
        return false 
    }

    checkWin() {
        return ( !this.words.length &&  !this.showedsWords.length ) ? true : false
    }

    print(word) {
        this.cls()
        this.context.beginPath()
        this.context.font = '38px serif'

        const wordWidth = this.context.measureText(word).width
        const x = (this.canvas.width - wordWidth) / 2

        this.context.fillText(word, x, 100)
        this.context.closePath()
    }

    draw() {
        if ( this.started ) {
            this.cls()
            this.drawWords()
            this.moveWords()
            if ( this.checkLose() ) {
                this.print("GAME OVER")
                this.runAction('lose')
                clearInterval(this.interval)
                return
            }
            if ( this.checkWin() ) {
                this.sound('taskCompleted')
                this.print("YOU WIN")
                this.runAction('win')
                clearInterval(this.interval)
                return
            }
        }
        window.requestAnimationFrame(() => {
            this.draw()
        })
    }

    /**
     * @param {'win'|'lose'} typeAction 
     */
    runAction(typeAction) {
        
        if ( typeAction == 'win' ) {
            if ( this.winDelay ) {
                setTimeout(this.winAction, this.winDelay)
            }
            else this.winAction && this.winAction()
        }
        if ( typeAction == 'lose' ) {
            if ( this.loseDelay ) {
                setTimeout(this.loseAction, this.loseDelay)
            }
            else this.loseAction && this.loseAction()
        }
    }

    /**
     * @param {'win'|'lose'} action 
     * @param {Function} callback 
     * @param {Number} delay
     */
    on(action, callback, delay = 0) {
        switch(action) {
            case "win":
                this.winDelay = delay
                this.winAction = callback
            case "lose":
                this.loseDelay = delay
                this.loseAction = callback
        }
    }
    
}