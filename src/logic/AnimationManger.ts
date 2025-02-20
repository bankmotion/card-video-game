import { UISetting } from "@/config/config";
import { ImgAssetsKey } from "@/constants/Scene";
import { DeckType } from "@/types/Deck";
import gsap from "gsap";

export class AnimationManager {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    animateCardsGroup(
        sprites: Phaser.GameObjects.Image[],
        duration: number = 1
    ) {
        sprites.forEach((sprite, index) => {
            gsap.to(sprite, {
                x: UISetting.BoardWidth * 0.3 + index * 0.2,
                y: UISetting.BoardHeight * 0.35 + index * 0.2,
                delay: 0.005 * index,
                duration,
                ease: "power2.out",
            });
        });
    }

    dealCards(
        sprites: Phaser.GameObjects.Image[],
        decks: DeckType[],
        playerPostions: { x: number; y: number }[],
        duration: number = 0.1
    ) {
        const timeline = gsap.timeline();

        //animation for each to each player
        for (let i = 0; i < 14 * 4; i++) {
            const playerIndex = i % 4;
            const sprite = sprites[i];
            if (!sprite) break;

            const cardTimeline = gsap.timeline();

            cardTimeline.to(sprite, {
                x:
                    playerPostions[playerIndex].x +
                    ((i / 4) * UISetting.CardWidth) / 2,
                y: playerPostions[playerIndex].y,
                duration,
                ease: "power2.out",
                delay: 0.01,
                onComplete: () => {
                    // rotate 90 degrees
                    gsap.to(sprite, {
                        rotation: Math.PI,
                        duration: 0.2,
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

                            // rotate all cards
                            gsap.to(sprite, {
                                rotate: Math.PI,
                                duration: 0.2,
                                ease: "power2.out",
                                onComplete: () => {},
                            });
                        },
                    });
                },
            });

            timeline.add(cardTimeline, i * 0.05);

            // timeline.to(card.sprite, {
            //     x:
            //         playerPostions[playerIndex].x +
            //         ((i / 4) * UISetting.CardWidth) / 2,
            //     y: playerPostions[playerIndex].y,
            //     duration,
            //     ease: "power2.out",
            //     delay: 0.01,
            // });
        }
    }
}
