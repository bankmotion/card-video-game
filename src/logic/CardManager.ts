import { DeckValue, SuitValue } from "@/constants/Deck";
import { DeckType } from "@/types/Deck";
import { AnimationManager } from "./AnimationManger";
import { UISetting } from "@/config/config";
import { ImgAssetsKey } from "@/constants/Scene";

export class CardManager {
    decks: DeckType[] = [];
    deckSprites: Phaser.GameObjects.Image[];
    scene: Phaser.Scene;
    animationManger: AnimationManager;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.animationManger = new AnimationManager(scene);
        this.initializeDeck();
        this.shuffleDeck();

        // Move cards to initial position
        this.animationManger.animateCardsGroup(this.deckSprites);

        // Delay and then deal cards to players
        setTimeout(() => {
            this.dealCardsToPlayers();
        }, 2000);
    }

    initializeDeck() {
        this.decks = [];
        this.deckSprites = [];

        for (const suitValue of Object.values(SuitValue)) {
            if (suitValue === SuitValue.Joker) continue;

            for (const deckValue of Object.values(DeckValue)) {
                if (
                    deckValue === DeckValue.Joker ||
                    typeof deckValue === "string"
                )
                    continue;
                this.decks.push({
                    suit: suitValue,
                    value: deckValue as DeckValue,
                });
            }
        }

        this.decks = [...this.decks, ...this.decks];

        for (let i = 0; i < 4; i++) {
            this.decks.push({
                suit: SuitValue.Joker,
                value: DeckValue.Joker,
            });
        }

        for (let i = 0; i < this.decks.length; i++) {
            const sprite = this.scene.add
                .image(-100, UISetting.BoardHeight / 2, ImgAssetsKey.BackCard)
                .setDisplaySize(UISetting.CardWidth, UISetting.CardHeight)
                .setOrigin(0.5)
                .setDepth(i);
            this.deckSprites.push(sprite);
        }
    }

    shuffleDeck() {
        this.decks.sort(() => Math.random() - 0.5);
    }

    drawCard() {
        return this.decks.length > 0 ? this.decks.pop() : null;
    }

    dealCardsToPlayers() {
        const playerPostions = [
            {
                x: UISetting.BoardWidth / 2,
                y: UISetting.BoardHeight * 0.7,
            },
            {
                x: UISetting.BoardWidth * 0.1,
                y: UISetting.BoardHeight / 2,
            },
            {
                x: UISetting.BoardWidth / 2,
                y: UISetting.BoardHeight * 0.3,
            },
            {
                x: UISetting.BoardWidth * 0.7,
                y: UISetting.BoardHeight / 2,
            },
        ];

        this.animationManger.dealCards(
            this.deckSprites,
            this.decks,
            playerPostions
        );
    }
}
