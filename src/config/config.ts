export const GameSetting = {
    InitialHoldCount: 14,
    PlayerCount: 4,
};

const getWidthAndHeight = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const aspectRatio = 1920 / 1080;

    let boardWidth = windowWidth;
    let boardHeight = windowHeight;

    if (windowWidth / windowHeight > aspectRatio) {
        boardWidth = windowHeight * aspectRatio;
    } else {
        boardHeight = windowWidth / aspectRatio;
    }

    return {
        BoardWidth: boardWidth,
        BoardHeight: boardHeight,
        CardWidth: boardWidth / 20,
        CardHeight: (boardWidth / 20 / 2) * 3,
    };
};

export const UISetting = getWidthAndHeight();

const updateUISetting = () => {
    return {
        HorizontalCardSpacing: UISetting.CardWidth * 0.6,
        VerticalCardSpacing: UISetting.CardWidth * 0.4,

        CardsGroupPos: {
            StartX: -100,
            StartY: UISetting.BoardHeight,
            X: UISetting.BoardWidth * 0.28,
            Y: UISetting.BoardHeight * 0.42,
            Delay: 0.01,
            Duration: 1,
        },

        DealCards: {
            Duration: 0.5,
            Delay: 0.1,
        },

        DiscardPilePos: {
            X: UISetting.BoardWidth * 0.35,
            Y: UISetting.BoardHeight * 0.42,
        },

        HandPlayPos: {
            X: 0.1,
            Y: 0.1,
        },

        ConfirmButton: {
            x: UISetting.BoardWidth * 0.95,
            y: UISetting.BoardHeight * 0.9,
            width: 100,
            height: 111,
        },

        WinnerModal: {
            x: UISetting.BoardWidth * 0.5,
            y: UISetting.BoardHeight * 0.5,
            width: 300,
            height: 300,
        },

        ShuffleCard: {
            x: UISetting.BoardWidth * 0.85,
            y: UISetting.BoardHeight * 0.9,
            width: UISetting.BoardWidth * 0.2,
            height: UISetting.BoardWidth * 0.2 * 0.8,
        },
    };
};

export const SubUISetting = updateUISetting();
