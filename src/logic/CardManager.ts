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

        let status = false;
        let remainingCards = [...handCards]
            .filter((cardId) => this.decks[cardId].suit !== SuitValue.Joker)
            .sort(
                (a, b) =>
                    this.decks[a].suit - this.decks[b].suit ||
                    this.decks[a].value - this.decks[b].value
            );
        let jokers = [...handCards].filter(
            (cardId) => this.decks[cardId].suit === SuitValue.Joker
        );
        let seqs: number[][] = [];
        let sets: number[][] = [];

        // group cards by rank for sets
        let rankGroup: { [key: number]: number[] } = {};
        for (const cardId of remainingCards) {
            const cardInfo = this.decks[cardId];
            if (!rankGroup[cardInfo.value]) {
                rankGroup[cardInfo.value] = [];
            }
            rankGroup[cardInfo.value].push(cardId);
        }

        // extract sets
        for (const rank in rankGroup) {
            let group = rankGroup[Number(rank)];
            if (group.length >= 3) {
                sets.push(group.splice(0, group.length));
            }
        }

        remainingCards = Object.values(rankGroup).flat();
        remainingCards.sort(
            (a, b) =>
                this.decks[a].suit - this.decks[b].suit ||
                this.decks[a].value - this.decks[b].value
        );

        let tempSeq: number[] = [];
        for (let i = 0; i < remainingCards.length; i++) {
            const cardId = remainingCards[i];
            const cardInfo = this.decks[cardId];

            if (
                tempSeq.length === 0 ||
                (this.decks[tempSeq[tempSeq.length - 1]].suit ===
                    cardInfo.suit &&
                    this.decks[tempSeq[tempSeq.length - 1]].value + 1 ===
                        cardInfo.value)
            ) {
                tempSeq.push(cardId);
            } else {
                if (tempSeq.length >= 3) {
                    seqs.push([...tempSeq]);
                }
                tempSeq = [cardId];
            }
        }
        if (tempSeq.length >= 3) seqs.push([...tempSeq]);

        // check remain cards
        let allValidCards = [...sets, ...seqs].flat();
        let unusedCards = remainingCards.filter(
            (cardId) => !allValidCards.includes(cardId)
        );

        // use joker to complete set(2 length set)
        rankGroup = {};
        for (const cardId of unusedCards) {
            const cardInfo = this.decks[cardId];
            if (!rankGroup[cardInfo.value]) {
                rankGroup[cardInfo.value] = [];
            }
            rankGroup[cardInfo.value].push(cardId);
        }
        for (const rank in rankGroup) {
            let group = rankGroup[Number(rank)];
            if (group.length === 2 && jokers.length > 0) {
                group.push(jokers.pop()!);
                sets.push(group.slice(0, 3));
            }
        }

        allValidCards = [...sets, ...seqs].flat();
        unusedCards = remainingCards.filter(
            (cardId) => !allValidCards.includes(cardId)
        );

        // use joker to complete seq
        for (const seq of seqs) {
            const firstCard = this.decks[seq[0]];
            const lastCard = this.decks[seq[seq.length - 1]];

            if (jokers.length > 0) {
                if (firstCard.value > DeckValue.Two) {
                    const targetValue = firstCard.value - 2;
                    const targetCardIndex = unusedCards.findIndex(
                        (cardId) =>
                            this.decks[cardId].suit === firstCard.suit &&
                            this.decks[cardId].value === targetValue
                    );
                    if (targetCardIndex !== -1 && jokers.length > 0) {
                        seq.unshift(jokers.pop()!);
                        seq.unshift(...unusedCards.splice(targetCardIndex, 1));
                    }
                }

                if (lastCard.value < DeckValue.Queen) {
                    const targetValue = firstCard.value + 2;
                    const targetCardIndex = unusedCards.findIndex(
                        (cardId) =>
                            this.decks[cardId].suit === lastCard.suit &&
                            this.decks[cardId].value === targetValue
                    );
                    if (targetCardIndex !== -1 && jokers.length > 0) {
                        seq.push(jokers.pop()!);
                        seq.push(...unusedCards.splice(targetCardIndex, 1));
                    }
                }
            }
        }

        if (unusedCards.length * 2 === jokers.length) {
            for (const cardId of unusedCards) {
                sets.push([cardId, jokers.pop()!, jokers.pop()!]);
            }
        }

        const totalValidCards = [...sets, ...seqs, ...jokers].flat().length;
        status = totalValidCards === GameSetting.InitialHoldCount;
        console.log({ status });

        console.log("set");
        sets.forEach((set) =>
            set.forEach((cardId) =>
                console.log(this.decks[cardId].suit, this.decks[cardId].value)
            )
        );
        console.log("seq");
        seqs.forEach((seq) =>
            seq.forEach((cardId) =>
                console.log(this.decks[cardId].suit, this.decks[cardId].value)
            )
        );

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
