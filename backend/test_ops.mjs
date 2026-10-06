import fs from 'fs';
import { createCanvas, ImageData } from 'canvas';
import { fileURLToPath } from 'url';
import path from 'path';

async function run() {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    console.log(Object.keys(pdfjsLib.OPS));
}
run().catch(console.error);
