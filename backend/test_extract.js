async function testExtract() {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    console.log("pdfjsLib loaded:", Object.keys(pdfjsLib));
}
testExtract().catch(console.error);
