import { useEffect, useRef, useState } from "react";
import { IRefPhaserGame, PhaserGame } from "./game/PhaserGame";
import { MainMenu } from "./game/scenes/MainMenu";
import { SceneKey } from "./constants/Scene";
import RoomList from "./pages/RoomList";

function App() {
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [activeScene, setActiveScene] = useState(SceneKey.MainMenu);

    const joinRoomAndStartGame = (roomId: string) => {
        setActiveScene(SceneKey.Game);
        // console.log(phaserRef.current)
        // if (phaserRef.current && phaserRef.current.game) {
        //     phaserRef.current.game.scene.start(SceneKey.Game);
        // }
    };
    console.log(activeScene);

    useEffect(() => {
        if (
            activeScene === SceneKey.Game &&
            phaserRef.current &&
            phaserRef.current.game
        ) {
            phaserRef.current.game.scene.start(SceneKey.Game);
        }
    }, [activeScene]);

    return (
        <div id="app">
            {activeScene === SceneKey.MainMenu ? (
                <RoomList onJoinRoom={joinRoomAndStartGame} />
            ) : activeScene === SceneKey.Game ? (
                <PhaserGame ref={phaserRef} />
            ) : null}
        </div>
    );
}

export default App;
