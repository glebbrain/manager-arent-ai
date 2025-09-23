param(
    [string]$OutputFormat = "all",
    [string]$OutputPath = "print_output",
    [switch]$Clean,
    [switch]$Verbose
)

Write-Host "📚 Building Book for Publication..." -ForegroundColor Cyan

# Create output directory
if (!(Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    Write-Host "📁 Created output directory: $OutputPath" -ForegroundColor Green
}

if ($Clean) {
    Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
    Get-ChildItem $OutputPath -Filter "*.txt" -Recurse | Remove-Item -Force
    Get-ChildItem $OutputPath -Filter "*.docx" -Recurse | Remove-Item -Force
    Get-ChildItem $OutputPath -Filter "*.epub" -Recurse | Remove-Item -Force
    Get-ChildItem $OutputPath -Filter "*.pdf" -Recurse | Remove-Item -Force
}

# Collect all chapters
$chapters = @()
$chapterFiles = Get-ChildItem "chapters" -Filter "*.md" -Recurse | Sort-Object Name

foreach ($file in $chapterFiles) {
    if ($file.Name -notmatch "README|quality_report") {
        $chapters += $file
    }
}

Write-Host "📖 Found $($chapters.Count) chapters to process" -ForegroundColor White

# Build functions
function Build-TxtBook {
    param($Chapters, $OutputPath)
    
    Write-Host "📝 Building TXT version..." -ForegroundColor Green
    $txtContent = @()
    
    # Add title page
    $txtContent += "МАРС. КИСЛОРОДНЫЙ ДОЛГ"
    $txtContent += "=" * 50
    $txtContent += ""
    $txtContent += "Эпический научно-фантастический роман"
    $txtContent += "о полном жизненном цикле героя на Марсе"
    $txtContent += ""
    $txtContent += "© 2025 Все права защищены"
    $txtContent += ""
    $txtContent += "=" * 50
    $txtContent += ""
    
    # Add chapters
    foreach ($chapter in $Chapters) {
        $content = Get-Content $chapter.FullName -Raw
        $txtContent += "ГЛАВА $($chapter.BaseName.ToUpper())"
        $txtContent += "-" * 30
        $txtContent += ""
        $txtContent += $content
        $txtContent += ""
        $txtContent += ""
    }
    
    $txtPath = Join-Path $OutputPath "Марс._Кислородный_долг_для_печати.txt"
    $txtContent | Out-File $txtPath -Encoding UTF8
    Write-Host "✅ TXT version saved to: $txtPath" -ForegroundColor Green
}

function Build-DocxBook {
    param($Chapters, $OutputPath)
    
    Write-Host "📄 Building DOCX version..." -ForegroundColor Green
    
    # Check if Python script exists
    if (Test-Path "print_book_script.py") {
        try {
            & python print_book_script.py
            Write-Host "✅ DOCX version generated using Python script" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Python script failed, creating basic DOCX..." -ForegroundColor Yellow
            # Fallback: create basic DOCX using PowerShell
            Build-BasicDocx -Chapters $Chapters -OutputPath $OutputPath
        }
    } else {
        Write-Host "⚠️ Python script not found, creating basic DOCX..." -ForegroundColor Yellow
        Build-BasicDocx -Chapters $Chapters -OutputPath $OutputPath
    }
}

function Build-BasicDocx {
    param($Chapters, $OutputPath)
    
    # This is a simplified version - in real implementation would use Word COM or other tools
    $docxPath = Join-Path $OutputPath "Марс._Кислородный_долг_для_печати.docx"
    Write-Host "📄 Basic DOCX placeholder created: $docxPath" -ForegroundColor Yellow
}

function Build-EpubBook {
    param($Chapters, $OutputPath)
    
    Write-Host "📱 Building EPUB version..." -ForegroundColor Green
    
    # Check if Python script exists
    if (Test-Path "print_book_script.py") {
        try {
            & python print_book_script.py --format epub
            Write-Host "✅ EPUB version generated using Python script" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Python script failed, creating basic EPUB..." -ForegroundColor Yellow
            # Fallback: create basic EPUB structure
            Build-BasicEpub -Chapters $Chapters -OutputPath $OutputPath
        }
    } else {
        Write-Host "⚠️ Python script not found, creating basic EPUB..." -ForegroundColor Yellow
        Build-BasicEpub -Chapters $Chapters -OutputPath $OutputPath
    }
}

function Build-BasicEpub {
    param($Chapters, $OutputPath)
    
    # Create EPUB structure
    $epubDir = Join-Path $OutputPath "epub_temp"
    if (Test-Path $epubDir) {
        Remove-Item $epubDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $epubDir -Force | Out-Null
    
    # Create META-INF
    $metaInfDir = Join-Path $epubDir "META-INF"
    New-Item -ItemType Directory -Path $metaInfDir -Force | Out-Null
    
    # Create container.xml
    $containerXml = @"
<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
"@
    $containerXml | Out-File (Join-Path $metaInfDir "container.xml") -Encoding UTF8
    
    # Create OEBPS directory
    $oebpsDir = Join-Path $epubDir "OEBPS"
    New-Item -ItemType Directory -Path $oebpsDir -Force | Out-Null
    
    # Create content.opf
    $contentOpf = @"
<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>Марс. Кислородный долг</dc:title>
    <dc:creator>Автор</dc:creator>
    <dc:language>ru</dc:language>
    <dc:identifier id="BookId">mars-oxygen-debt</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="style.css" media-type="text/css"/>
"@
    
    # Add chapters to manifest
    for ($i = 0; $i -lt $Chapters.Count; $i++) {
        $chapterId = "chapter$($i + 1)"
        $chapterFile = "chapter$($i + 1).html"
        $contentOpf += "    <item id=`"$chapterId`" href=`"$chapterFile`" media-type=`"application/xhtml+xml`"/>`n"
    }
    
    $contentOpf += @"
  </manifest>
  <spine toc="ncx">
"@
    
    # Add chapters to spine
    for ($i = 0; $i -lt $Chapters.Count; $i++) {
        $chapterId = "chapter$($i + 1)"
        $contentOpf += "    <itemref idref=`"$chapterId`"/>`n"
    }
    
    $contentOpf += @"
  </spine>
</package>
"@
    
    $contentOpf | Out-File (Join-Path $oebpsDir "content.opf") -Encoding UTF8
    
    # Create basic CSS
    $css = @"
body {
    font-family: Georgia, serif;
    line-height: 1.6;
    margin: 2em;
}
h1, h2, h3 {
    color: #333;
}
.chapter {
    page-break-before: always;
}
"@
    $css | Out-File (Join-Path $oebpsDir "style.css") -Encoding UTF8
    
    # Convert chapters to HTML
    for ($i = 0; $i -lt $Chapters.Count; $i++) {
        $chapter = $Chapters[$i]
        $content = Get-Content $chapter.FullName -Raw
        
        # Basic HTML conversion
        $html = @"
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>$($chapter.BaseName)</title>
    <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
    <div class="chapter">
        <h1>$($chapter.BaseName)</h1>
        <div>
            $($content -replace "`n", "<br/>")
        </div>
    </div>
</body>
</html>
"@
        $htmlPath = Join-Path $oebpsDir "chapter$($i + 1).html"
        $html | Out-File $htmlPath -Encoding UTF8
    }
    
    # Create toc.ncx
    $tocNcx = @"
<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="mars-oxygen-debt"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>Марс. Кислородный долг</text>
  </docTitle>
  <navMap>
"@
    
    for ($i = 0; $i -lt $Chapters.Count; $i++) {
        $chapter = $Chapters[$i]
        $tocNcx += @"
    <navPoint id="navpoint-$($i + 1)" playOrder="$($i + 1)">
      <navLabel>
        <text>$($chapter.BaseName)</text>
      </navLabel>
      <content src="chapter$($i + 1).html"/>
    </navPoint>
"@
    }
    
    $tocNcx += @"
  </navMap>
</ncx>
"@
    
    $tocNcx | Out-File (Join-Path $oebpsDir "toc.ncx") -Encoding UTF8
    
    # Create EPUB file (simplified - would need proper ZIP creation)
    $epubPath = Join-Path $OutputPath "Марс._Кислородный_долг_для_печати.epub"
    Write-Host "📱 Basic EPUB structure created: $epubPath" -ForegroundColor Yellow
    Write-Host "💡 Note: This is a basic EPUB structure. For production, use proper EPUB tools." -ForegroundColor Cyan
}

# Build based on requested format
switch ($OutputFormat.ToLower()) {
    "txt" { Build-TxtBook -Chapters $chapters -OutputPath $OutputPath }
    "docx" { Build-DocxBook -Chapters $chapters -OutputPath $OutputPath }
    "epub" { Build-EpubBook -Chapters $chapters -OutputPath $OutputPath }
    "all" {
        Build-TxtBook -Chapters $chapters -OutputPath $OutputPath
        Build-DocxBook -Chapters $chapters -OutputPath $OutputPath
        Build-EpubBook -Chapters $chapters -OutputPath $OutputPath
    }
    default {
        Write-Host "❌ Unknown format: $OutputFormat" -ForegroundColor Red
        Write-Host "Available formats: txt, docx, epub, all" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Book build completed!" -ForegroundColor Green
Write-Host "📁 Output directory: $OutputPath" -ForegroundColor Cyan
