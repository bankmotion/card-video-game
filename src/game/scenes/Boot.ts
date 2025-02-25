import { DeckValue, SuitValue } from "@/constants/Deck";
import { ImgAssetsKey, SceneKey } from "@/constants/Scene";
import { Scene } from "phaser";

export class Boot extends Scene {
    constructor() {
        super(SceneKey.Boot);
    }

    preload() {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        // this.load.image(ImgAssetsKey.MainMenuBG, "assets/bg.png");
        // this.load.image(ImgAssetsKey.GameBoardBG, "assets/imgs/Table.jpg");
        // this.load.image(ImgAssetsKey.BackCard, "assets/imgs/Back.png");
        // this.load.image(ImgAssetsKey.ConfirmButton, "assets/imgs/confirm.png");
        // this.load.image(ImgAssetsKey.Winner, "assets/imgs/winner.png");
        // this.load.image(ImgAssetsKey.Shuffle, "assets/imgs/shuffle.png");

        // for (const suitValue of Object.values(SuitValue)) {
        //     if (typeof suitValue === "string") continue;
        //     for (const deckValue of Object.values(DeckValue)) {
        //         if (
        //             typeof deckValue === "string" ||
        //             (suitValue === SuitValue.Joker &&
        //                 deckValue !== DeckValue.Joker) ||
        //             (suitValue !== SuitValue.Joker &&
        //                 deckValue === DeckValue.Joker)
        //         )
        //             continue;
        //         this.load.image(
        //             `${ImgAssetsKey.CardSprite}-${suitValue}-${deckValue}`,
        //             `assets/imgs/cards/${suitValue}-${deckValue}.png`
        //         );
        //     }
        // }
    }

    create() {
        this.scene.start(SceneKey.Preloader);
    }
}
