import saveAs from "file-saver";

export function downloadJson(json: object, filename: string) {
    const blob = new Blob([JSON.stringify(json)], {
        type: 'application/json'
    });
    saveAs(blob, filename);
}