export const getRandNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const moveElementInArray = (arr: number[], a: number, b: number) => {
    const newArr = [...arr];
    const [moveEle] = newArr.splice(a, 1);
    newArr.splice(b, 0, moveEle);

    return newArr;
};
