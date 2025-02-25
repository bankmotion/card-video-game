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

    private progressBar: Phaser.GameObjects.Graphics | null = null;
    private progressBox: Phaser.GameObjects.Graphics | null = null;
    private loadingText: Phaser.GameObjects.Text | null = null;

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

        this.load.on("progress", (value: number) => {
            this.updateProgressBar(value);
        });

        this.load.on("complete", () => {
        });
    }

    createProgressBar() {
        const width = 300;
        const height = 50;

        // Create a background box for the progress bar
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222222, 0.8);
        this.progressBox.fillRect(240, 270, width, height);

        // Create the progress bar (foreground)
        this.progressBar = this.add.graphics();

        // Create a loading text
        this.loadingText = this.add
            .text(320, 230, "Loading...", {
                font: "20px Arial",
                fill: "#ffffff",
            })
            .setOrigin(0.5, 0.5);
    }

    updateProgressBar(value: number) {
        if (this.progressBar) {
            this.progressBar.clear();
            this.progressBar.fillStyle(0x00ff00, 1); // Green color
            this.progressBar.fillRect(245, 275, 290 * value, 30); // Fill the progress bar based on the value
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
