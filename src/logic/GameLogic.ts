import { DeckType } from "@/types/Deck";
import { CardManager } from "./CardManager";
import { GameSetting } from "@/config/config";
import { GameStatus } from "@/constants/GameStatus";

export class GameLogic {
    cardManager: CardManager;
    currentPlayerIndex: number = 0;
    currentGameStatus: GameStatus = GameStatus.Waiting;

    constructor(cardManager: CardManager) {
        this.cardManager = cardManager;
    }

    updateGameStatus(gameStatus: GameStatus) {
        this.currentGameStatus = gameStatus;

        if (gameStatus === GameStatus.Discard) {
            this.cardManager.updateCardDraggable();
            this.cardManager.confirmButton.setVisible(false);
        } else if (gameStatus === GameStatus.CheckingWin) {
            this.cardManager.updateCardDraggable();

            const checkWinner = this.cardManager.checkSetOrSequence();
            this.updateGameStatus(GameStatus.Draw);
        }

        if (
            gameStatus === GameStatus.Draw ||
            gameStatus === GameStatus.Discard
        ) {
            this.cardManager.shuffleCard.setVisible(true);
        } else {
            this.cardManager.shuffleCard.setVisible(false);
        }
    }

    initializePlayers() {
        for (let i = 0; i < 4; i++) {
            // this.players.push({ hand: this.drawStartingHand() });
        }
    }

    drawStartingHand() {
        // return Array.from(
        //     { length: GameSetting.InitialHoldCount },
        //     () => this.cardManager.drawCard()!
        // );
    }

    nextTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4;
        console.log(`Player ${this.currentPlayerIndex}'s turn`);
    }

    update() {}
}
