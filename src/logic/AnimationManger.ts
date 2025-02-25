import { GameSetting, SubUISetting, UISetting } from "@/config/config";
import { ImgAssetsKey } from "@/constants/Scene";
import { DeckType } from "@/types/Deck";
import gsap from "gsap";

export class AnimationManager {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    animateCardsGroup(sprites: Phaser.GameObjects.Image[]) {
        for (let i = sprites.length - 1; i >= 0; i--) {
            const sprite = sprites[i];

            gsap.to(sprite, {
                x:
                    SubUISetting.CardsGroupPos.X +
                    (sprites.length - 1 - i) * 0.2,
                y:
                    SubUISetting.CardsGroupPos.Y +
                    (sprites.length - 1 - i) * 0.2,
                delay:
                    SubUISetting.CardsGroupPos.Delay * (sprites.length - 1 - i),
                duration: SubUISetting.CardsGroupPos.Duration,
                ease: "power2.out",
            });
        }
    }

    dealCards(
        sprites: Phaser.GameObjects.Image[],
        decks: DeckType[],
        calculateNewCardPos: (
            playerIndex: number,
            totalCount: number,
            cardIndex: number
        ) => { x: number; y: number }
    ) {
        const timeline = gsap.timeline();
        const { PlayerCount, InitialHoldCount } = GameSetting;
        const handCards: number[][] = [[], [], [], []];

        //animation for each to each player
        for (let i = 0; i < InitialHoldCount * PlayerCount; i++) {
            const playerIndex = i % PlayerCount;
            const sprite = sprites[i];
            if (!sprite) break;

            const newPos = calculateNewCardPos(
                playerIndex,
                Math.floor(i / PlayerCount) + 1,
                Math.floor(i / PlayerCount)
            );

            const isVertical = playerIndex === 1 || playerIndex === 3;

            const cardTimeline = gsap.timeline();

            cardTimeline.to(sprite, {
                x: newPos.x,
                y: newPos.y,
                duration: SubUISetting.DealCards.Duration,
                rotation: Math.PI * (isVertical ? 3.5 : 4),
                ease: "power2.out",
                onComplete: () => {
                    // back my deck card
                    if (playerIndex === 0) {
                        sprite
                            .setTexture(
                                `${ImgAssetsKey.CardSprite}-${decks[i].suit}-${decks[i].value}`
                            )
                            .setDisplaySize(
                                UISetting.CardWidth,
                                UISetting.CardHeight
                            );
                    }

                    sprite.setDepth(i);
                    handCards[playerIndex].push(i);
                    this.repositionPlayerHand(
                        playerIndex,
                        [...handCards[playerIndex]],
                        sprites,
                        -1,
                        calculateNewCardPos
                    );
                },
            });

            timeline.add(cardTimeline, i * SubUISetting.DealCards.Delay);
        }
    }

    drawCard(
        sprites: Phaser.GameObjects.Image[],
        deck: DeckType,
        handCards: number[],
        playerIndex: number,
        cardIndex: number,
        calculateNewCardPos: (
            playerIndex: number,
            totalCount: number,
            cardIndex: number
        ) => { x: number; y: number }
    ) {
        const isVertical = playerIndex === 1 || playerIndex === 3;
        const sprite = sprites[cardIndex];
        const newPos = calculateNewCardPos(
            playerIndex,
            handCards.length,
            handCards.length - 1
        );

        gsap.to(sprite, {
            x: newPos.x,
            y: newPos.y,
            duration: 0.5,
            rotation: Math.PI * (isVertical ? 3.5 : 4),
            ease: "power2.out",
            onComplete: () => {
                // back my deck card
                if (playerIndex === 0) {
                    sprite
                        .setTexture(
                            `${ImgAssetsKey.CardSprite}-${deck.suit}-${deck.value}`
                        )
                        .setDisplaySize(
                            UISetting.CardWidth,
                            UISetting.CardHeight
                        );
                }

                this.repositionPlayerHand(
                    playerIndex,
                    handCards,
                    sprites,
                    -1,
                    calculateNewCardPos
                );
            },
        });
    }

    repositionPlayerHand(
        playerIndex: number,
        handCards: number[],
        deckSprites: Phaser.GameObjects.Image[],
        ignoreCardIndex: number,
        calculateNewCardPos: (
            playerIndex: number,
            totalCount: number,
            cardIndex: number
        ) => { x: number; y: number }
    ) {
        if (!handCards || handCards.length === 0) return;

        handCards.forEach((cardIndex, i) => {
            if (i === ignoreCardIndex) return;
            const newPos = calculateNewCardPos(
                playerIndex,
                handCards.length,
                i
            );

            gsap.to(deckSprites[cardIndex], {
                x: newPos.x,
                y: newPos.y,
                duration: 0.1,
                ease: "power2.out",
                onComplete: () => {
                    deckSprites[cardIndex].setDepth(i);
                },
            });
        });
    }

    shortCardMoveAnimation(
        sprite: Phaser.GameObjects.Image,
        x: number,
        y: number
    ) {
        gsap.to(sprite, {
            x,
            y,
            duration: 0.2,
            ease: "power2.out",
        });
    }

    animateWinnerModal(sprite: Phaser.GameObjects.Image) {
        gsap.timeline()
            .fromTo(
                sprite,
                {
                    scale: 0,
                },
                {
                    scale: 1.5,
                    duration: 0.5,
                    ease: "power2.out",
                }
            )
            .to(sprite, {
                scale: 1,
                duration: 0.3,
                ease: "power2.in",
            });
    }
}
