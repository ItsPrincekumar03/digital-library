 = Get-Content -Path frontend/js/router.js -Raw
 =  -replace '"private-library\.html"', '"private-library.html",
            "reader.html"'
 =  -replace 'book: "\./pages/book\.js"', 'book: "./pages/book.js",
        reader: "./pages/reader.js"'
Set-Content -Path frontend/js/router.js -Value 
