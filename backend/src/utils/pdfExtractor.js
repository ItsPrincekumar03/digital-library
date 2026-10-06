const fs = require('fs');
const path = require('path');
const { createCanvas, ImageData } = require('canvas');

async function extractPdf(pdfPath, outputDir, filePrefix) {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const doc = await pdfjsLib.getDocument({ url: pdfPath, verbosity: 0 }).promise;
    
    let contentBlocks = [];
    let imageCounter = 1;
    let totalTextLength = 0;

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
        let page;
        try {
            page = await doc.getPage(pageNum);
        } catch (e) {
            continue;
        }
        
        // 1. EXTRACT TEXT
        const textContent = await page.getTextContent();
        
        const items = textContent.items.sort((a, b) => {
            if (Math.abs(b.transform[5] - a.transform[5]) > 2) {
                return b.transform[5] - a.transform[5];
            }
            return a.transform[4] - b.transform[4];
        });
        
        let currentParagraph = "";
        let lastY = null;
        let lastFontSize = null;
        
        for (const item of items) {
            const y = item.transform[5];
            const fontSize = Math.sqrt(item.transform[0]*item.transform[0] + item.transform[1]*item.transform[1]);
            const text = item.str.trim();
            
            if (!text) continue;
            totalTextLength += text.length;

            const isHeading = fontSize > 16; 
            
            if (lastY !== null) {
                const dy = Math.abs(lastY - y);
                if (dy > fontSize * 1.5 || (lastFontSize && Math.abs(fontSize - lastFontSize) > 2)) {
                    if (currentParagraph) {
                        currentParagraph = currentParagraph.replace(/- /g, "");
                        contentBlocks.push({ 
                            type: lastFontSize > 16 ? 'heading' : 'paragraph', 
                            text: currentParagraph 
                        });
                        currentParagraph = "";
                    }
                }
            }
            
            currentParagraph += (currentParagraph ? " " : "") + text.replace(/\s+/g, " ");
            lastY = y;
            lastFontSize = fontSize;
        }
        
        if (currentParagraph) {
            currentParagraph = currentParagraph.replace(/- /g, "");
            contentBlocks.push({ 
                type: lastFontSize > 16 ? 'heading' : 'paragraph', 
                text: currentParagraph 
            });
        }
        
        // 2. EXTRACT IMAGES
        try {
            const ops = await page.getOperatorList();
            for (let i = 0; i < ops.fnArray.length; i++) {
                if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
                    const imgName = ops.argsArray[i][0];
                    const imgObj = await new Promise(resolve => page.objs.get(imgName, resolve));
                    
                    if (imgObj && imgObj.data && imgObj.width && imgObj.height) {
                        try {
                            let imgData;
                            // Check if data is already RGBA
                            if (imgObj.data.length === imgObj.width * imgObj.height * 4) {
                                const arr = new Uint8ClampedArray(imgObj.data.length);
                                for(let j=0; j<imgObj.data.length; j++) arr[j] = imgObj.data[j];
                                imgData = new ImageData(arr, imgObj.width, imgObj.height);
                            } else if (imgObj.data.length === imgObj.width * imgObj.height * 3) {
                                // Convert RGB to RGBA
                                const arr = new Uint8ClampedArray(imgObj.width * imgObj.height * 4);
                                for (let p = 0; p < imgObj.width * imgObj.height; p++) {
                                    arr[p*4] = imgObj.data[p*3];
                                    arr[p*4+1] = imgObj.data[p*3+1];
                                    arr[p*4+2] = imgObj.data[p*3+2];
                                    arr[p*4+3] = 255;
                                }
                                imgData = new ImageData(arr, imgObj.width, imgObj.height);
                            }
                            
                            if (imgData) {
                                const canvas = createCanvas(imgObj.width, imgObj.height);
                                canvas.getContext('2d').putImageData(imgData, 0, 0);
                                
                                const fileName = `${filePrefix}_img_${imageCounter++}.png`;
                                const outPath = path.join(outputDir, fileName);
                                fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
                                
                                contentBlocks.push({ type: 'image', src: fileName });
                            }
                        } catch(e) {
                            console.error("Failed to parse image data on page", pageNum);
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Image extraction error on page", pageNum);
        }
    }
    
    if (totalTextLength < 50 && imageCounter > 1) {
        contentBlocks.unshift({
            type: 'system',
            text: 'This PDF appears to contain scanned pages. Text extraction may require OCR.'
        });
    }

    return contentBlocks;
}

module.exports = { extractPdf };
