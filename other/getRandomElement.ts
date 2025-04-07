export default function getRandomElement<T>(array: ArrayLike<T>): { element: T; idx: number } {
  if (!array.length) {
    throw new Error("Array is empty");
  }

  const randomIndex = Math.floor(Math.random() * array.length);

  // it's safe to cast to T because we know that the index is within the bounds of the array
  // since we checked that the array is not empty and we are using the length of the array
  // to generate the random index
  const randomElement = array[randomIndex] as T;

  return { element: randomElement, idx: randomIndex };
}
