Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$iconDir = Join-Path $root "assets\icons"
New-Item -ItemType Directory -Force -Path $iconDir | Out-Null

function New-IconBitmap {
  param([int]$Size)

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $scale = $Size / 1024.0
  function S([float]$Value) { return [float]($Value * $scale) }

  $bgRect = New-Object System.Drawing.RectangleF (S 92), (S 92), (S 840), (S 840)
  $bgPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $radius = S 214
  $bgPath.AddArc($bgRect.X, $bgRect.Y, $radius, $radius, 180, 90)
  $bgPath.AddArc($bgRect.Right - $radius, $bgRect.Y, $radius, $radius, 270, 90)
  $bgPath.AddArc($bgRect.Right - $radius, $bgRect.Bottom - $radius, $radius, $radius, 0, 90)
  $bgPath.AddArc($bgRect.X, $bgRect.Bottom - $radius, $radius, $radius, 90, 90)
  $bgPath.CloseFigure()

  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $bgRect, ([System.Drawing.Color]::FromArgb(255, 255, 250, 242)), ([System.Drawing.Color]::FromArgb(255, 223, 234, 221)), 45
  $graphics.FillPath($bgBrush, $bgPath)

  $borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 49, 92, 73)), (S 24)
  $graphics.DrawPath($borderPen, $bgPath)

  $faceBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 231, 173, 72))
  $earBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 217, 108, 80))
  $inkBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 45, 42, 38))
  $greenBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 49, 92, 73))
  $creamBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 253, 248))

  $leftEar = @(
    (New-Object System.Drawing.PointF (S 312), (S 334)),
    (New-Object System.Drawing.PointF (S 390), (S 188)),
    (New-Object System.Drawing.PointF (S 470), (S 348))
  )
  $rightEar = @(
    (New-Object System.Drawing.PointF (S 554), (S 348)),
    (New-Object System.Drawing.PointF (S 634), (S 188)),
    (New-Object System.Drawing.PointF (S 712), (S 334))
  )
  $graphics.FillPolygon($earBrush, $leftEar)
  $graphics.FillPolygon($earBrush, $rightEar)

  $faceRect = New-Object System.Drawing.RectangleF (S 270), (S 276), (S 484), (S 408)
  $graphics.FillEllipse($faceBrush, $faceRect)

  $graphics.FillEllipse($inkBrush, (S 408), (S 448), (S 34), (S 44))
  $graphics.FillEllipse($inkBrush, (S 582), (S 448), (S 34), (S 44))
  $graphics.FillEllipse($inkBrush, (S 495), (S 515), (S 34), (S 24))

  $smilePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 45, 42, 38)), (S 16)
  $graphics.DrawArc($smilePen, (S 466), (S 516), (S 60), (S 54), 15, 70)
  $graphics.DrawArc($smilePen, (S 514), (S 516), (S 60), (S 54), 95, 70)

  $screenRect = New-Object System.Drawing.RectangleF (S 284), (S 646), (S 456), (S 162)
  $screenPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $screenRadius = S 42
  $screenPath.AddArc($screenRect.X, $screenRect.Y, $screenRadius, $screenRadius, 180, 90)
  $screenPath.AddArc($screenRect.Right - $screenRadius, $screenRect.Y, $screenRadius, $screenRadius, 270, 90)
  $screenPath.AddArc($screenRect.Right - $screenRadius, $screenRect.Bottom - $screenRadius, $screenRadius, $screenRadius, 0, 90)
  $screenPath.AddArc($screenRect.X, $screenRect.Bottom - $screenRadius, $screenRadius, $screenRadius, 90, 90)
  $screenPath.CloseFigure()
  $graphics.FillPath($greenBrush, $screenPath)

  $barBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 223, 234, 221))
  $graphics.FillRectangle($barBrush, (S 352), (S 700), (S 180), (S 18))
  $graphics.FillRectangle($barBrush, (S 352), (S 740), (S 320), (S 18))
  $graphics.FillEllipse($creamBrush, (S 618), (S 678), (S 62), (S 62))

  $graphics.Dispose()
  return $bitmap
}

function Save-Png {
  param([int]$Size, [string]$Path)
  $bitmap = New-IconBitmap -Size $Size
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

function Write-UInt16LE {
  param([System.IO.BinaryWriter]$Writer, [int]$Value)
  $Writer.Write([uint16]$Value)
}

function Write-UInt32LE {
  param([System.IO.BinaryWriter]$Writer, [long]$Value)
  $Writer.Write([uint32]$Value)
}

Save-Png -Size 512 -Path (Join-Path $iconDir "icon.png")

$icoSizes = @(16, 24, 32, 48, 64, 128, 256)
$icoImages = @()
foreach ($size in $icoSizes) {
  $pngPath = Join-Path $iconDir "icon-$size.png"
  Save-Png -Size $size -Path $pngPath
  $icoImages += [pscustomobject]@{
    Size = $size
    Bytes = [System.IO.File]::ReadAllBytes($pngPath)
  }
}

$icoPath = Join-Path $iconDir "icon.ico"
$icoStream = New-Object System.IO.FileStream $icoPath, ([System.IO.FileMode]::Create), ([System.IO.FileAccess]::Write)
$icoWriter = New-Object System.IO.BinaryWriter $icoStream
Write-UInt16LE $icoWriter 0
Write-UInt16LE $icoWriter 1
Write-UInt16LE $icoWriter $icoImages.Count
$offset = 6 + (16 * $icoImages.Count)
foreach ($image in $icoImages) {
  $dimension = if ($image.Size -eq 256) { 0 } else { $image.Size }
  $icoWriter.Write([byte]$dimension)
  $icoWriter.Write([byte]$dimension)
  $icoWriter.Write([byte]0)
  $icoWriter.Write([byte]0)
  Write-UInt16LE $icoWriter 1
  Write-UInt16LE $icoWriter 32
  Write-UInt32LE $icoWriter $image.Bytes.Length
  Write-UInt32LE $icoWriter $offset
  $offset += $image.Bytes.Length
}
foreach ($image in $icoImages) {
  $icoWriter.Write($image.Bytes)
}
$icoWriter.Dispose()
$icoStream.Dispose()

$icnsTypes = @{
  128 = "ic07"
  256 = "ic08"
  512 = "ic09"
}
$icnsImages = @()
foreach ($size in @(128, 256, 512)) {
  $pngPath = Join-Path $iconDir "icon-$size.png"
  Save-Png -Size $size -Path $pngPath
  $icnsImages += [pscustomobject]@{
    Type = $icnsTypes[$size]
    Bytes = [System.IO.File]::ReadAllBytes($pngPath)
  }
}

$icnsPath = Join-Path $iconDir "icon.icns"
$icnsStream = New-Object System.IO.FileStream $icnsPath, ([System.IO.FileMode]::Create), ([System.IO.FileAccess]::Write)
$icnsWriter = New-Object System.IO.BinaryWriter $icnsStream
$totalLength = 8
foreach ($image in $icnsImages) {
  $totalLength += 8 + $image.Bytes.Length
}
$icnsWriter.Write([System.Text.Encoding]::ASCII.GetBytes("icns"))
$icnsWriter.Write([System.BitConverter]::GetBytes([System.Net.IPAddress]::HostToNetworkOrder([int]$totalLength)))
foreach ($image in $icnsImages) {
  $icnsWriter.Write([System.Text.Encoding]::ASCII.GetBytes($image.Type))
  $entryLength = 8 + $image.Bytes.Length
  $icnsWriter.Write([System.BitConverter]::GetBytes([System.Net.IPAddress]::HostToNetworkOrder([int]$entryLength)))
  $icnsWriter.Write($image.Bytes)
}
$icnsWriter.Dispose()
$icnsStream.Dispose()

Get-ChildItem $iconDir -Filter "icon-*.png" | Remove-Item

Write-Host "Generated icons in $iconDir"
