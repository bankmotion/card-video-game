import { useState } from "react";

const RoomList = ({ onJoinRoom }: { onJoinRoom: (roomId: string) => void }) => {
    const [rooms, setRooms] = useState([
        {
            id: "room1",
            players: 3,
        },
        {
            id: "room2",
            players: 2,
        },
        {
            id: "room3",
            players: 1,
        },
    ]);

    const createRoom = () => {
        const newRoom = { id: `room${rooms.length + 1}`, players: 0 };
        setRooms([...rooms, newRoom]);
    };

    return (
        <div className="flex flex-col items-center space-y-6 p-6">
            <button
                onClick={createRoom}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blu-600"
            >
                Create Room
            </button>

            <div className="space-y-4 w-full max-w-3xl">
                {rooms.map((room) => (
                    <div
                        key={room.id}
                        className="bg-gray-800 text-white p-4 rounded-lg shadow-lg"
                    >
                        <h2 className="text-xl font-semibold">
                            Room {room.id}
                        </h2>
                        <div className="grid grid-cols-4 gap-4 mt-4">
                            {[...Array(4)].map((_, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-center w-20 h-20 rounded-lg border-2 ${
                                        index < room.players
                                            ? "bg-green-400"
                                            : "bg-gray-600"
                                    }`}
                                >
                                    {index < room.players
                                        ? `Player ${index + 1}`
                                        : "Empty"}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => onJoinRoom(room.id)}
                            className="mt-4 w-full py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
                            disabled={room.players >= 4}
                        >
                            {room.players < 4 ? "Join Room" : "Room Full"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoomList;
