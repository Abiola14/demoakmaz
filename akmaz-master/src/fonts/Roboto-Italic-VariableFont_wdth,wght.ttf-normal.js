import { jsPDF } from "jspdf"
var font = 'undefined';
var callAddFont = function () {
this.addFileToVFS('Roboto-Italic-VariableFont_wdth,wght.ttf-normal.ttf', font);
this.addFont('Roboto-Italic-VariableFont_wdth,wght.ttf-normal.ttf', 'Roboto-Italic-VariableFont_wdth,wght.ttf', 'normal');
};
jsPDF.API.events.push(['addFonts', callAddFont])
