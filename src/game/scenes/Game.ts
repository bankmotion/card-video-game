import { ImgAssetsKey, SceneKey } from "@/constants/Scene";
import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { CardManager } from "@/logic/CardManager";
import { GameLogic } from "@/logic/GameLogic";
import { UISetting } from "@/config/config";

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;

    cardManager: CardManager;
    gameLogic: GameLogic;

    constructor() {
        super(SceneKey.Game);
    }

    preload() {}

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

        this.cardManager = new CardManager(this);
        this.gameLogic = new GameLogic(this.cardManager);

        EventBus.emit("current-scene-ready", this);
    }

    changeScene() {
        this.scene.start(SceneKey.GameOver);
    }
}
