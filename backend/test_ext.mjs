import fs from 'fs';
import { createCanvas } from 'canvas';

async function test() {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    console.log("ready");
}
test().catch(console.error);
