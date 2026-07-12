function _decode(str) {
  const rev = str.split('').reverse().join('');
  return Buffer.from(rev, 'base64').toString('ascii');
}
const e1 = 'wQDxYTLx0Wah1GbiJXe0h2YoNWau5GbyhGcul2cjNXY0BXdyVmYtM2ZulmZlRXasxWdud2bw12Ylx2YkNWZwlHdzdWa3BC=';
const e2 = 'wQDRVzUu0Wdwh2cjVWeud2YwQXYyN2YoBHe09GdzJHdjV3YlxGdulmbhh2Yu5GbyNXY012dud2bw12Ylx2YkNWZwlHdzdWa3BC=';

console.log("e1:", _decode(e1));
console.log("e2:", _decode(e2));
