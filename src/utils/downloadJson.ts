import saveAs from 'file-saver';

export function downloadJson(json: object, filename: string) {
  const blob = new Blob([JSON.stringify(json, null, 2)], {
    type: 'application/json'
  });
  saveAs(blob, filename);
}

export function downloadTxt(text: string, filename: string) {
  const blob = new Blob([text], {
    type: 'text/plain'
  });
  saveAs(blob, filename);
}
