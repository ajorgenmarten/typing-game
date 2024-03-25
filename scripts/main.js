import { Game } from "./game.js";
import { words } from "./variables.js";

let game = new Game([...words])
game.start()

const onlose = () => {
    game = new Game([...words])
    game.on('lose', onlose, 3000)
    game.start()
}

game.on('lose', onlose, 3000)