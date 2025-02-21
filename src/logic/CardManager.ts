import { GameSetting, SubUISetting, UISetting } from "@/config/config";
import { DeckValue, SuitValue } from "@/constants/Deck";
import { ImgAssetsKey } from "@/constants/Scene";
import { DeckType } from "@/types/Deck";
import { AnimationManager } from "./AnimationManger";
import { GameLogic } from "./GameLogic";
import { GameStatus } from "@/constants/GameStatus";
import { getRandNumber } from "@/utils/utils";

export class CardManager {
    scene: Phaser.Scene;
    animationManger: AnimationManager;
    gameLogic: GameLogic;

    decks: DeckType[] = [];
    deckSprites: Phaser.GameObjects.Image[];
    playerHands: number[][] = [[], [], [], []];
    discardPile: Phaser.GameObjects.Image;
    setCards: number[][] = [];

    constructor(scene: Phaser.Scene, gameLogic: GameLogic) {
        this.scene = scene;
        this.gameLogic = gameLogic;
        this.animationManger = new AnimationManager(scene);

        // define the position where sets/sequences are placed
        this.discardPile = this.scene.add
            .image(
                SubUISetting.DiscardPilePos.X,
                SubUISetting.DiscardPilePos.Y,
                ImgAssetsKey.BackCard
            )
            .setDisplaySize(UISetting.CardWidth, UISetting.CardHeight)
            .setOrigin(0.5);

        this.initializeDeck();

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

        // generate deck
        for (const suit of Object.values(SuitValue)) {
            if (suit === SuitValue.Joker) continue;

            for (const deckValue of Object.values(DeckValue)) {
                if (
                    deckValue === DeckValue.Joker ||
                    typeof deckValue === "string"
                )
                    continue;
                this.decks.push({
                    suit,
                    value: deckValue as DeckValue,
                    playerIndex: -1,
                });
            }
        }

        this.decks = [...this.decks, ...this.decks];

        for (let i = 0; i < 4; i++) {
            this.decks.push({
                suit: SuitValue.Joker,
                value: DeckValue.Joker,
                playerIndex: -1,
            });
        }

        for (let i = this.decks.length - 1; i > 0; i--) {
            const j = getRandNumber(0, i);
            this.decks[i] = {
                ...this.decks[i],
                suit: this.decks[j].suit,
                value: this.decks[j].value,
            };
            this.decks[j] = {
                ...this.decks[j],
                suit: this.decks[i].suit,
                value: this.decks[i].value,
            };
        }

        // assign card sprites
        this.decks.forEach((_, i) => {
            const sprite = this.scene.add
                .image(
                    SubUISetting.CardsGroupPos.StartX,
                    SubUISetting.CardsGroupPos.StartY,
                    ImgAssetsKey.BackCard
                )
                .setDisplaySize(UISetting.CardWidth, UISetting.CardHeight)
                .setOrigin(0.5)
                .setDepth(200 - i)
                .setInteractive();

            sprite.setData("deckId", i);

            // add event to all sprites
            sprite.on("pointerdown", () => {
                this.handleClickCard(i);
            });

            sprite.on(
                "dragstart",
                (
                    pointer: Phaser.GameObjects.Image,
                    dragX: number,
                    dragY: number
                ) => {
                    this.handleDragStart(sprite);
                }
            );
            sprite.on(
                "drag",
                (
                    pointer: Phaser.GameObjects.Image,
                    dragX: number,
                    dragY: number
                ) => {
                    this.handleDrag(sprite, dragX, dragY);
                }
            );
            sprite.on("dragend", () => {
                this.handleDragEnd(sprite, i);
            });

            this.deckSprites.push(sprite);
        });
    }

    private handleClickCard(cardIndex: number) {
        const { currentGameStatus } = this.gameLogic;
        switch (currentGameStatus) {
            case GameStatus.Draw:
                const isValidClicking = this.isValidClickOnDrawPile(cardIndex);
                if (isValidClicking) {
                    this.drawCard(this.decks[cardIndex].playerIndex, cardIndex);
                }
                break;
        }
    }

    private handleDragStart(sprite: Phaser.GameObjects.Image) {
        sprite.setDepth(100);
    }

    private handleDrag(
        sprite: Phaser.GameObjects.Image,
        dragX: number,
        dragY: number
    ) {
        sprite.x = dragX;
        sprite.y = dragY;
    }

    private handleDragEnd(sprite: Phaser.GameObjects.Image, cardIndex: number) {
        // const card = this.decks[cardIndex];
        // // check if dropped near the fixed position
        // if (
        //     Phaser.Math.Distance.Between(
        //         sprite.x,
        //         sprite.y,
        //         this.fixedPosition.x,
        //         this.fixedPosition.y
        //     ) < 50
        // ) {
        //     sprite.setPosition(this.fixedPosition.x, this.fixedPosition.y);
        //     // validate the combination
        //     const isValid = this.validateSetOrSequence();
        //     if (!isValid) {
        //         this.resetHandPosition();
        //     }
        // } else {
        //     this.resetHandPosition();
        // }
    }

    isValidClickOnDrawPile(cardIndex: number) {
        const { totHandCards, totSetCards } = this.getCardCount();
        const count = totHandCards + totSetCards;
        console.log({ count, cardIndex });
        return count === cardIndex;
    }

    validateSetOrSequence() {
        const cards = this.setCards[0];

        // first card is always valid
        if (cards.length === 0) return true;
    }

    getCardCount() {
        console.log(this.playerHands, this.setCards);
        const totHandCards = this.playerHands.reduce(
            (sum, player) => player.length + sum,
            0
        );
        const totSetCards = this.setCards.reduce(
            (sum, sets) => sets.length + sum,
            0
        );

        return { totHandCards, totSetCards };
    }

    drawCard(playerIndex: number, cardIndex: number) {
        console.log("Drawing card", playerIndex, cardIndex);
        const { currentPlayerIndex } = this.gameLogic;
        this.playerHands[currentPlayerIndex].push(cardIndex);
        this.decks[cardIndex].playerIndex = currentPlayerIndex;

        this.animationManger.drawCard(
            this.deckSprites,
            this.decks[cardIndex],
            this.playerHands[currentPlayerIndex],
            currentPlayerIndex,
            cardIndex,
            this.calculateNewCardPos
        );

        this.gameLogic.updateGameStatus(GameStatus.SelectCard);
    }

    dealCardsToPlayers() {
        const { PlayerCount, InitialHoldCount } = GameSetting;

        // dealing animation
        this.animationManger.dealCards(
            this.deckSprites,
            this.decks,
            this.calculateNewCardPos
        );

        setTimeout(() => {
            this.gameLogic.updateGameStatus(GameStatus.Draw);

            for (let i = 0; i < InitialHoldCount * PlayerCount; i++) {
                const playerIndex = i % PlayerCount;
                this.decks[i].playerIndex = playerIndex;
                console.log(playerIndex, { ...this.decks[i] });
                this.playerHands[playerIndex].push(i);
            }
        }, 3000);
    }

    private calculateNewCardPos(
        playerIndex: number,
        totalCount: number,
        cardIndex: number
    ) {
        const { BoardWidth, BoardHeight } = UISetting;

        const { HorizontalCardSpacing, VerticalCardSpacing } = SubUISetting;

        const cardSpacing =
            playerIndex === 0 || playerIndex === 2
                ? HorizontalCardSpacing
                : VerticalCardSpacing;
        const totalSize = cardSpacing * (totalCount - 1);
        const cardOffset = cardIndex * cardSpacing;

        const positions = [
            {
                x: (BoardWidth - totalSize) * 0.5 + cardOffset,
                y: BoardHeight * (1 - SubUISetting.HandPlayPos.Y),
            },
            {
                x: BoardWidth * SubUISetting.HandPlayPos.X,
                y: (BoardHeight - totalSize) * 0.5 + cardOffset,
            },
            {
                x: (BoardWidth + totalSize) * 0.5 - cardOffset,
                y: BoardHeight * SubUISetting.HandPlayPos.Y,
            },
            {
                x: BoardWidth * (1 - SubUISetting.HandPlayPos.X),
                y: (BoardHeight + totalSize) * 0.5 - cardOffset,
            },
        ];

        return positions[playerIndex] || { x: 0, y: 0 };
    }
}
