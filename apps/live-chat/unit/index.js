export const uniqueId = (length = 10) => {
  let id = '';
  while (id.length < length) {
    let ch = Math.random()
      .toString(36)
      .substr(2, 1);
      ch = ch.toUpperCase();
    // if (Math.random() < 0.5) {
    // }
    id = `${id}${ch}`;
  }
  return id;
}
