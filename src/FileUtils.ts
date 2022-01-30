const frDispatch = [
  FileReader.prototype.readAsArrayBuffer,
  FileReader.prototype.readAsBinaryString,
  FileReader.prototype.readAsDataURL,
  FileReader.prototype.readAsText,
];
export const FR_AS_ARR_BUF = 0;
export const FR_AS_BIN_STR = 1;
export const FR_AS_DAT_URL = 2;
export const FR_AS_TXT = 3;
export function getPromiseFileReader(
  blob: Blob,
  readType: 0 | 1 | 2 | 3
): Promise<string | ArrayBuffer> {
  const reader = new FileReader();
  return new Promise(function (resolve, reject) {
    reader.addEventListener('error', function (e) {
      reject((<FileReader>e.target).error);
    });
    reader.addEventListener('load', function (e) {
      resolve((<FileReader>e.target).result);
    });
    frDispatch[readType].call(reader, blob);
  });
}
export const saveFileA = document.createElement('a');
saveFileA.style.display = 'none';
/**
 * @param {string} data
 * @param {string} name
 */
export function saveAs(data: string | ArrayBuffer, name: string): void {
  const blob = new Blob([data]);
  saveFileA.setAttribute('href', window.URL.createObjectURL(blob));
  saveFileA.setAttribute('download', name);
  saveFileA.click();
}
