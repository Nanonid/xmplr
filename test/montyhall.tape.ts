import { xList, xIndex, xNormRand, xInterval } from "../lib"
import * as test from "tape"

/**
 * A simplistic usage of lists to simulate the [Monty Hall Problem]{@link https://en.wikipedia.org/wiki/Monty_Hall_problem}
 * 
 * 1) Behind 3 doors, place 1 car and 2 goats
 * 2) Player chooses a door (in this game we "don't look" at our choice until the end)
 * 3) Game show host shows a goat behind one of the remaining doors.
 * 4) You can Stay on your first choice, or Switch to the other door.
 * 
 * Switching improves your odds from 1/3 to 2/3!
 * 
 * Run this test and see for yourself.
 */
test("Monty Hall Problem", (t) => {

    // demonstrate the three possible car locations
    // as individual games
    let doors = [
        new xList(["car", "goat1", "goat2"]),
        new xList(["goat1", "car", "goat2"]),
        new xList(["goat1", "goat2", "car"])]

    let games = [
        new xIndex(doors[0]),
        new xIndex(doors[1]),
        new xIndex(doors[2])]

    let doorChoice = new xInterval(0, 3)

    let chooseGame = () => Math.trunc(doorChoice.next())

    let chooseGoatDoor = (game: xIndex, choice: string) => {
        let goatChoice = game.next()
        while (goatChoice == choice || goatChoice == "car") {
            goatChoice = game.next()
        }
        return goatChoice
    }

    // remove chosen doors from all the doors
    // since there is only 3 in this game, only 1 other door
    let chooseRemainingDoor = (game: xIndex, choices: string[]) => {
        let remaining = game.list.states.filter((door) =>
            choices.indexOf(door) < 0
        )
        return remaining[0]
    }

    let wins = [0, 0]
    let rounds = 200000
    let gameChosen = [0, 0, 0]

    for (let i = 0; i < rounds; i++) {
        // choose one of the 3 possible car placements
        let carPlacement = chooseGame()
        let game = games[carPlacement]
        gameChosen[carPlacement] += 1

        // player chooses a random door
        // maybe a car!
        let firstChoice = game.next()

        // game show hosts chooses a door that is a goat and not
        // our current choice
        let goatDoor = chooseGoatDoor(game, firstChoice)

        // choose the other door, which is all the doors with the first two 
        // filtered out, one of which is now *known* to be a goat!
        let changedChoice = chooseRemainingDoor(game, [goatDoor, firstChoice])

        // original choice wins!
        if (firstChoice == "car") {
            wins[0] = wins[0] + 1
        }
        // changing choice wins!
        if (changedChoice == "car") {
            wins[1] = wins[1] + 1
        }
    }
    // single decimal percentage
    wins = wins.map(w => Math.trunc(1000 * (w / rounds)) / 10)
    gameChosen = gameChosen.map(v => v / rounds)
    console.log("Game chosen stats:", gameChosen)
    let err = Math.abs(gameChosen.reduce((error, value) => error + (value - 1 / 3), 0))
    t.assert(err < 0.1, `Game Chosen bias ${err} should be small (<0.1)`)
    console.log(`After ${rounds} trials, Winning staying ${wins[0]}%  Winning switching ${wins[1]}%`)

    t.assert(wins[0] < wins[1], "Monty Hall Problem solved, for 3 doors. Switch doors!")
    t.end()
})