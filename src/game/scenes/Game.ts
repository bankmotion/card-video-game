import { ImgAssetsKey, SceneKey } from "@/constants/Scene";
import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { CardManager } from "@/logic/CardManager";
import { GameLogic } from "@/logic/GameLogic";
import { UISetting } from "@/config/config";
import { DeckValue, SuitValue } from "@/constants/Deck";

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;

    cardManager: CardManager;
    gameLogic: GameLogic;

    constructor() {
        super(SceneKey.Game);
    }

    preload() {
        this.load.image(ImgAssetsKey.MainMenuBG, "assets/bg.png");
        this.load.image(ImgAssetsKey.GameBoardBG, "assets/imgs/Table.jpg");
        this.load.image(ImgAssetsKey.BackCard, "assets/imgs/Back.png");
        this.load.image(ImgAssetsKey.ConfirmButton, "assets/imgs/confirm.png");
        this.load.image(ImgAssetsKey.Winner, "assets/imgs/winner.png");
        this.load.image(ImgAssetsKey.Shuffle, "assets/imgs/shuffle.png");

        for (const suitValue of Object.values(SuitValue)) {
            if (typeof suitValue === "string") continue;
            for (const deckValue of Object.values(DeckValue)) {
                if (
                    typeof deckValue === "string" ||
                    (suitValue === SuitValue.Joker &&
                        deckValue !== DeckValue.Joker) ||
                    (suitValue !== SuitValue.Joker &&
                        deckValue === DeckValue.Joker)
                )
                    continue;
                this.load.image(
                    `${ImgAssetsKey.CardSprite}-${suitValue}-${deckValue}`,
                    `assets/imgs/cards/${suitValue}-${deckValue}.png`
                );
            }
        }
    }

    create() {
        this.camera = this.cameras.main;

        this.background = this.add
            .image(
                UISetting.BoardWidth / 2,
                UISetting.BoardHeight / 2,
                ImgAssetsKey.GameBoardBG
            )
            .setDisplaySize(UISetting.BoardWidth, UISetting.BoardHeight)
            .setOrigin(0.5);

        this.gameLogic = new GameLogic(null as any);
        this.cardManager = new CardManager(this, this.gameLogic);

        this.gameLogic.cardManager = this.cardManager;

        EventBus.emit("current-scene-ready", this);
    }

    changeScene() {
        this.scene.start(SceneKey.GameOver);
    }
}
