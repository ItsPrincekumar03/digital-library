import fs from 'fs';
import { createCanvas, ImageData } from 'canvas';
import { fileURLToPath } from 'url';
import path from 'path';

async function extractPdf(pdfPath) {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // We mock DOM for pdfjs-dist in node if necessary, but legacy usually works.
    const loadingTask = pdfjsLib.getDocument({
        url: pdfPath,
        verbosity: 0
    });
    
    const doc = await loadingTask.promise;
    console.log("Pages:", doc.numPages);
    
    // Just to see what operators are available
    // Normally we'd use getOperatorList
}
