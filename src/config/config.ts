export const GameSetting = {
    InitialHoldCount: 14,
    PlayerCount: 4,
};

export const UISetting = {
    // BoardWidth: window.innerWidth,
    BoardWidth: 1920,
    BoardHeight: 1080,
    // BoardHeight: window.innerHeight,
    CardWidth: 90,
    // CardWidth: window.innerWidth / 30,
    CardHeight: 135,
    // CardHeight: window.innerWidth / 20,
};

export const SubUISetting = {
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
};
