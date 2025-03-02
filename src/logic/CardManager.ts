import { GameSetting, SubUISetting, UISetting } from "@/config/config";
import { DeckSort, DeckValue, SuitValue } from "@/constants/Deck";
import { ImgAssetsKey } from "@/constants/Scene";
import { DeckType } from "@/types/Deck";
import { AnimationManager } from "./AnimationManger";
import { GameLogic } from "./GameLogic";
import { GameStatus } from "@/constants/GameStatus";
import { getRandNumber, moveElementInArray } from "@/utils/utils";
import gsap from "gsap";
import { CardStatus } from "@/constants/CardStatus";

export class CardManager {
    scene: Phaser.Scene;
    animationManger: AnimationManager;
    gameLogic: GameLogic;

    decks: DeckType[] = [];
    playerHands: number[][] = [[], [], [], []];
    discards: number[] = [];
    sortStatus: DeckSort = DeckSort.None;

    deckSprites: Phaser.GameObjects.Image[];
    discardPile: Phaser.GameObjects.Image;
    confirmButton: Phaser.GameObjects.Image;
    winnerModal: Phaser.GameObjects.Image;
    shuffleCard: Phaser.GameObjects.Image;

    draggingCard: {
        startX: number;
        startY: number;
        startDepth: number;
        index: number;
    };

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

        this.confirmButton = this.scene.add
            .image(
                SubUISetting.ConfirmButton.x,
                SubUISetting.ConfirmButton.y,
                ImgAssetsKey.ConfirmButton
            )
            .setDisplaySize(
                SubUISetting.ConfirmButton.width,
                SubUISetting.ConfirmButton.height
            )
            .setOrigin(0.5)
            .setInteractive();
        this.confirmButton.on("pointerdown", () => {
            this.handleClickConfirmButton();
        });
        this.confirmButton.setVisible(false);

        this.shuffleCard = this.scene.add
            .image(
                SubUISetting.ShuffleCard.x,
                SubUISetting.ShuffleCard.y,
                ImgAssetsKey.Shuffle
            )
            .setDisplaySize(
                SubUISetting.ShuffleCard.width,
                SubUISetting.ShuffleCard.height
            )
            .setOrigin(0.5)
            .setVisible(false)
            .setInteractive();
        this.shuffleCard.on("pointerdown", () => {
            this.handleClickShuffleCard();
        });

        this.winnerModal = this.scene.add
            .image(
                SubUISetting.WinnerModal.x,
                SubUISetting.WinnerModal.y,
                ImgAssetsKey.Winner
            )
            .setDisplaySize(
                SubUISetting.WinnerModal.width,
                SubUISetting.WinnerModal.height
            )
            .setOrigin(0.5);
        this.winnerModal.setVisible(false);

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
            if (typeof suit === "string" || suit === SuitValue.Joker) continue;

            for (const deckValue of Object.values(DeckValue)) {
                if (
                    deckValue === DeckValue.Joker ||
                    typeof deckValue === "string"
                )
                    continue;
                this.decks.push({
                    suit: suit as SuitValue,
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
            const tempSuit = this.decks[i].suit;
            const tempValue = this.decks[i].value;

            this.decks[i] = {
                ...this.decks[i],
                suit: this.decks[j].suit,
                value: this.decks[j].value,
            };
            this.decks[j] = {
                ...this.decks[j],
                suit: tempSuit,
                value: tempValue,
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
        const { currentGameStatus, currentPlayerIndex } = this.gameLogic;
        const index = Number(sprite.getData("deckId"));

        switch (currentGameStatus) {
            case GameStatus.Discard:
                this.draggingCard = {
                    startX: sprite.x,
                    startY: sprite.y,
                    startDepth: sprite.depth,
                    index: this.playerHands[currentPlayerIndex].findIndex(
                        (card) => card === index
                    ),
                };
                sprite
                    .setDepth(300)
                    .setDisplaySize(
                        UISetting.CardWidth * 1.1,
                        UISetting.CardHeight * 1.1
                    );
                break;
        }
    }

    private handleDrag(
        sprite: Phaser.GameObjects.Image,
        dragX: number,
        dragY: number
    ) {
        sprite.x = dragX;
        sprite.y = dragY;
        const { currentPlayerIndex } = this.gameLogic;
        // sprite.setDepth(300);
        const deckId = Number(sprite.getData("deckId"));
        const ingoreIndex = this.playerHands[currentPlayerIndex].findIndex(
            (cardId) => cardId === deckId
        );

        if (
            Math.abs(
                dragY - UISetting.BoardHeight * (1 - SubUISetting.HandPlayPos.Y)
            ) <= UISetting.CardHeight
        ) {
            const newIndex = this.getIndexOnHandCards(dragX, sprite);
            if (this.draggingCard.index !== newIndex) {
                const handCards = this.playerHands[currentPlayerIndex];
                let updatedHandCards = [...handCards];
                const firstIndex = updatedHandCards.findIndex(
                    (card) => card === Number(sprite.getData("deckId"))
                );

                if (newIndex !== -1) {
                    updatedHandCards = moveElementInArray(
                        updatedHandCards,
                        firstIndex,
                        newIndex
                    );
                }

                this.animationManger.repositionPlayerHand(
                    currentPlayerIndex,
                    updatedHandCards,
                    this.deckSprites,
                    newIndex,
                    this.calculateNewCardPos
                );
            }
            this.draggingCard.index = newIndex;
        } else {
            if (this.draggingCard.index !== -1) {
                this.draggingCard.index = -1;
                this.animationManger.repositionPlayerHand(
                    currentPlayerIndex,
                    this.playerHands[currentPlayerIndex],
                    this.deckSprites,
                    ingoreIndex,
                    this.calculateNewCardPos
                );
            }
        }
    }

    private handleDragEnd(sprite: Phaser.GameObjects.Image, cardIndex: number) {
        const { currentGameStatus, currentPlayerIndex } = this.gameLogic;

        switch (currentGameStatus) {
            case GameStatus.Discard:
                const isInAreaDicardPile = this.isInAreaDiscardPile(sprite);
                if (isInAreaDicardPile) {
                    this.handleCardToDiscardPile(cardIndex);
                    this.gameLogic.updateGameStatus(GameStatus.CheckingWin);

                    this.animationManger.shortCardMoveAnimation(
                        sprite,
                        this.discardPile.x,
                        this.discardPile.y
                    );

                    this.animationManger.repositionPlayerHand(
                        currentPlayerIndex,
                        this.playerHands[currentPlayerIndex],
                        this.deckSprites,
                        -1,
                        this.calculateNewCardPos
                    );
                    sprite
                        .setDepth(this.discards.length)
                        .setDisplaySize(
                            UISetting.CardWidth,
                            UISetting.CardHeight
                        );
                } else if (this.draggingCard.index !== -1) {
                    const currentCardId = Number(sprite.getData("deckId"));
                    const currentHands = this.playerHands[currentPlayerIndex];
                    const currentIndex = currentHands.findIndex(
                        (card) => card === currentCardId
                    );
                    if (currentIndex !== -1 && this.draggingCard.index !== -1) {
                        const [moveEle] = currentHands.splice(currentIndex, 1);
                        currentHands.splice(
                            this.draggingCard.index,
                            0,
                            moveEle
                        );

                        sprite
                            .setDepth(this.draggingCard.startDepth)
                            .setDisplaySize(
                                UISetting.CardWidth,
                                UISetting.CardHeight
                            );
                        this.animationManger.repositionPlayerHand(
                            currentPlayerIndex,
                            currentHands,
                            this.deckSprites,
                            -1,
                            this.calculateNewCardPos
                        );
                    }
                } else {
                    sprite
                        .setDepth(this.draggingCard.startDepth)
                        .setDisplaySize(
                            UISetting.CardWidth,
                            UISetting.CardHeight
                        );
                    this.animationManger.shortCardMoveAnimation(
                        sprite,
                        this.draggingCard.startX,
                        this.draggingCard.startY
                    );

                    this.animationManger.repositionPlayerHand(
                        currentPlayerIndex,
                        this.playerHands[currentPlayerIndex],
                        this.deckSprites,
                        -1,
                        this.calculateNewCardPos
                    );
                }

                break;
        }
    }

    handleClickConfirmButton() {
        this.winnerModal.setVisible(true);
        this.animationManger.animateWinnerModal(this.winnerModal);
    }

    isInAreaDiscardPile(sprite: Phaser.GameObjects.Image) {
        return (
            Math.abs(this.discardPile.x - sprite.x) < UISetting.CardWidth &&
            Math.abs(this.discardPile.y - sprite.y) < UISetting.CardHeight
        );
    }

    isValidClickOnDrawPile(cardIndex: number) {
        const { totHandCards, totDiscardCards } = this.getCardCount();
        const count = totHandCards + totDiscardCards;
        return (
            count === cardIndex ||
            (this.discards.length &&
                this.discards[this.discards.length - 1] === cardIndex)
        );
    }

    handleCardToDiscardPile(cardIndex: number) {
        const { currentPlayerIndex } = this.gameLogic;

        this.decks[cardIndex].playerIndex = CardStatus.Discard;
        this.playerHands[currentPlayerIndex] = this.playerHands[
            currentPlayerIndex
        ].filter((index) => index !== cardIndex);
        this.discards.push(cardIndex);
    }

    handleClickShuffleCard() {
        const { currentPlayerIndex } = this.gameLogic;
        const myHandCards = this.playerHands[currentPlayerIndex];

        if (
            this.sortStatus === DeckSort.None ||
            this.sortStatus === DeckSort.Suit
        ) {
            myHandCards.sort(
                (a, b) =>
                    this.decks[a].suit - this.decks[b].suit ||
                    this.decks[a].value - this.decks[b].value
            );
            this.sortStatus = DeckSort.Rank;
        } else {
            myHandCards.sort(
                (a, b) =>
                    this.decks[a].value - this.decks[b].value ||
                    this.decks[a].suit - this.decks[b].suit
            );
            this.sortStatus = DeckSort.Suit;
        }

        this.animationManger.repositionPlayerHand(
            currentPlayerIndex,
            myHandCards,
            this.deckSprites,
            -1,
            this.calculateNewCardPos
        );
    }

    getCardCount() {
        const totHandCards = this.playerHands.reduce(
            (sum, player) => player.length + sum,
            0
        );
        const totDiscardCards = this.discards.length;

        return { totHandCards, totDiscardCards };
    }

    drawCard(playerIndex: number, cardIndex: number) {
        const { currentPlayerIndex } = this.gameLogic;
        if (this.discards[this.discards.length - 1] === cardIndex) {
            this.discards.splice(this.discards.length - 1, 1);
        }
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

        this.gameLogic.updateGameStatus(GameStatus.Discard);
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
                this.playerHands[playerIndex].push(i);
            }
        }, 6000);
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

    updateCardDraggable() {
        const { currentGameStatus, currentPlayerIndex } = this.gameLogic;

        if (currentGameStatus === GameStatus.Discard) {
            this.playerHands[currentPlayerIndex].forEach((id, index) => {
                this.scene.input.setDraggable(this.deckSprites[id]);
            });
        } else {
            this.decks.forEach((_, index) => {
                const deckSprite = this.deckSprites?.[index];
                if (deckSprite && deckSprite.input) {
                    deckSprite.input.draggable = false;
                }
            });
        }
    }

    checkSetOrSequence() {
        const { currentPlayerIndex } = this.gameLogic;
        const handCards = this.playerHands[currentPlayerIndex];
        // const aaa = [
        //     {
        //         a: SuitValue.Club,
        //         b: DeckValue.Ace,
        //     },
        //     {
        //         a: SuitValue.Club,
        //         b: DeckValue.Three,
        //     },
        //     {
        //         a: SuitValue.Club,
        //         b: DeckValue.Four,
        //     },
        //     {
        //         a: SuitValue.Club,
        //         b: DeckValue.Five,
        //     },
        //     {
        //         a: SuitValue.Heart,
        //         b: DeckValue.Ace,
        //     },
        //     {
        //         a: SuitValue.Heart,
        //         b: DeckValue.Two,
        //     },
        //     {
        //         a: SuitValue.Heart,
        //         b: DeckValue.Three,
        //     },
        //     {
        //         a: SuitValue.Heart,
        //         b: DeckValue.Ten,
        //     },
        //     {
        //         a: SuitValue.Heart,
        //         b: DeckValue.Ten,
        //     },
        //     {
        //         a: SuitValue.Spade,
        //         b: DeckValue.King,
        //     },
        //     {
        //         a: SuitValue.Spade,
        //         b: DeckValue.King,
        //     },
        //     {
        //         a: SuitValue.Joker,
        //         b: DeckValue.Joker,
        //     },
        //     {
        //         a: SuitValue.Joker,
        //         b: DeckValue.Joker,
        //     },
        //     {
        //         a: SuitValue.Joker,
        //         b: DeckValue.Joker,
        //     },
        // ];
        // let handCards: number[] = [];
        // const usedIndices = new Set<number>(); // Track used indices to avoid duplicates

        // for (const a of aaa) {
        //     const index = this.decks.findIndex(
        //         (deck, indexed) =>
        //             deck.suit === a.a &&
        //             deck.value === a.b &&
        //             !usedIndices.has(indexed) // Ensure the index hasn't been used yet
        //     );
        //     if (index !== -1) {
        //         handCards.push(index);
        //         usedIndices.add(index); // Mark this index as used
        //     }
        // }
        // console.log(`Handcards: `, [...handCards]);

        let status = false;

        const countJokers = (group: number[]): number => {
            return group.filter(
                (cardId) => this.decks[cardId].suit === SuitValue.Joker
            ).length;
        };

        const isSequence = (group: number[]): boolean => {
            if (group.length < 3) return false;

            const nonJokers: number[] = group.filter(
                (cardId) => this.decks[cardId].suit !== SuitValue.Joker
            );
            const jokerCount: number = countJokers(group);

            // if all cards are jokers, they can form a seq
            if (nonJokers.length === 0) return true;

            // check if all non-joker cards have the same suit
            const suits = nonJokers.map((cardId) => this.decks[cardId].suit);
            if (new Set(suits).size !== 1) return false;

            // check if non-joker cards have unique values
            const values = nonJokers.map((cardId) => this.decks[cardId].value);
            if (new Set(values).size !== values.length) return false;

            // sort the values of non-joker cards
            const sortedValues = values.sort((a, b) => a - b);

            //  calculate the number of gaps in the sequence
            let gaps = 0;
            for (let i = 1; i < sortedValues.length; i++) {
                gaps += sortedValues[i] - sortedValues[i - 1] - 1;
            }

            return gaps <= jokerCount;
        };

        const isSet = (group: number[]): boolean => {
            if (group.length < 3) return false;

            const nonJokers = group.filter(
                (cardId) => this.decks[cardId].suit !== SuitValue.Joker
            );

            // if all cards are jokers, they can form a set
            if (nonJokers.length === 0) return true;

            // check if all non-joker cards have the same value
            const values = nonJokers.map((cardId) => this.decks[cardId].value);
            if (new Set(values).size !== 1) return false;

            return true;
        };

        const isValidGroup = (group: number[]): boolean => {
            // isSequence(group) || isSet(group)
            //     ? console.log("true")
            //     : console.log("false");
            return isSequence(group) || isSet(group);
        };

        // isValidGroup([
        //     handCards[0],
        //     handCards[1],
        //     handCards[2],
        //     handCards[3],
        //     handCards[11],
        // ]);
        // isValidGroup([handCards[4], handCards[5], handCards[6]]);
        // isValidGroup([handCards[7], handCards[8], handCards[12]]);
        // isValidGroup([handCards[9], handCards[10], handCards[13]]);

        const generateGroups = (
            cards: number[],
            groupSize: number
        ): number[][] => {
            const groups: number[][] = [];

            const backtrack = (start: number, currentGroup: number[]) => {
                if (currentGroup.length === groupSize) {
                    groups.push([...currentGroup]);
                    return;
                }
                for (let i = start; i < cards.length; i++) {
                    currentGroup.push(cards[i]);
                    backtrack(i + 1, currentGroup);
                    currentGroup.pop();
                }
            };

            backtrack(0, []);
            return groups;
        };

        const canFormGroup = (cards: number[]): boolean => {
            if (cards.length === 0) return true;

            for (let groupSize = 3; groupSize <= cards.length; groupSize++) {
                const groups = generateGroups(cards, groupSize);

                for (const group of groups) {
                    if (isValidGroup(group)) {
                        const remainingCards = cards.filter(
                            (cardId) => !group.includes(cardId)
                        );
                        if (canFormGroup(remainingCards)) {
                            return true;
                        }
                    }
                }
            }

            return false;
        };

        status = canFormGroup(handCards);

        if (status) {
            this.confirmButton.setVisible(true);
        } else {
            this.confirmButton.setVisible(false);
        }

        return status;
    }

    getIndexOnHandCards(dragX: number, sprite: Phaser.GameObjects.Image) {
        const { currentPlayerIndex } = this.gameLogic;
        const handCards = this.playerHands[currentPlayerIndex];

        const newIndex = handCards.findIndex((id, index) => {
            const min =
                index === 0 ? 0 : this.deckSprites[handCards[index - 1]].x;
            const max =
                index === handCards.length - 1
                    ? UISetting.BoardWidth
                    : this.deckSprites[handCards[index + 1]].x;

            return dragX >= min && dragX < max;
        });
        return newIndex;
    }
}
