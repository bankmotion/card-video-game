import { DeckType } from "@/types/Deck";
import { CardManager } from "./CardManager";
import { GameSetting } from "@/config/config";

export class GameLogic {
    cardManager: CardManager;
    players: { hand: DeckType[] }[] = [];
    currentPlayerIndex: number = 0;

    constructor(cardManager: CardManager) {
        this.cardManager = cardManager;
    }

    initializePlayers() {
        for (let i = 0; i < 4; i++) {
            this.players.push({ hand: this.drawStartingHand() });
        }
    }

    drawStartingHand(): DeckType[] {
        return Array.from(
            { length: GameSetting.InitialHoldCount },
            () => this.cardManager.drawCard()!
        );
    }

    nextTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4;
        console.log(`Player ${this.currentPlayerIndex}'s turn`);
    }

    update() {}
}
