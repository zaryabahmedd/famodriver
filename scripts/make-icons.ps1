Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile("C:\Users\nadee\Downloads\famodriver\public\image.png")
function Make-Icon($size, $logoScale, $bg, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.Clear($bg)
    $maxDim = $size * $logoScale
    $ratio = [Math]::Min($maxDim / $src.Width, $maxDim / $src.Height)
    $w = $src.Width * $ratio
    $h = $src.Height * $ratio
    $x = ($size - $w) / 2
    $y = ($size - $h) / 2
    $g.DrawImage($src, $x, $y, $w, $h)
    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Saved $outPath"
}
$white = [System.Drawing.Color]::White
Make-Icon 1024 0.72 $white "C:\Users\nadee\Downloads\famodriver\assets\images\icon.png"
Make-Icon 1024 0.55 $white "C:\Users\nadee\Downloads\famodriver\assets\images\android-icon-foreground.png"
Make-Icon 1024 0.72 $white "C:\Users\nadee\Downloads\famodriver\assets\images\favicon.png"
$src.Dispose()
Get-ChildItem "C:\Users\nadee\Downloads\famodriver\assets\images\icon.png" | Select-Object Name, Length, LastWriteTime
