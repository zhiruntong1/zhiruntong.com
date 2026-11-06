# ==========================================================================
# HK ZANVIX — image optimiser
# Downscales the generated artwork to web-appropriate dimensions and
# re-encodes it as JPEG, so the delivered site does not ship 18 MB of images.
# Usage:  powershell -NoProfile -ExecutionPolicy Bypass -File docs\optimize-images.ps1
# ==========================================================================
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$imgDir = Join-Path $PSScriptRoot '..\images'
$imgDir = (Resolve-Path $imgDir).Path

# file, max width, jpeg quality
$plan = @(
  @{ f = 'hero.jpg';      w = 1600; q = 82 }
  @{ f = 'app-phone.jpg'; w =  760; q = 84 }
  @{ f = 'app-1.jpg';     w =  760; q = 84 }
  @{ f = 'app-2.jpg';     w =  760; q = 84 }
  @{ f = 'news-1.jpg';    w = 1000; q = 80 }
  @{ f = 'news-2.jpg';    w = 1000; q = 80 }
  @{ f = 'news-3.jpg';    w = 1000; q = 80 }
  @{ f = 'news-4.jpg';    w = 1000; q = 80 }
  @{ f = 'news-5.jpg';    w = 1000; q = 80 }
  @{ f = 'news-6.jpg';    w = 1000; q = 80 }
  @{ f = 'news-7.jpg';    w = 1000; q = 80 }
)

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' }

function Save-Jpeg($bitmap, $path, $quality) {
  $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
  $bitmap.Save($path, $jpegCodec, $ep)
}

$before = 0; $after = 0

foreach ($item in $plan) {
  $path = Join-Path $imgDir $item.f
  if (-not (Test-Path $path)) { Write-Output "skip $($item.f) (missing)"; continue }
  $before += (Get-Item $path).Length

  $src = [System.Drawing.Image]::FromFile($path)
  try {
    $scale = $item.w / $src.Width
    $w = [int]$item.w
    $h = [int][math]::Round($src.Height * $scale)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $bmp.SetResolution(96, 96)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($src, 0, 0, $w, $h)
    $g.Dispose()
    $tmp = "$path.tmp"
    Save-Jpeg $bmp $tmp $item.q
    $bmp.Dispose()
  } finally {
    $src.Dispose()
  }
  Move-Item -Path $tmp -Destination $path -Force
  $after += (Get-Item $path).Length
  Write-Output ("{0,-16} -> {1}px wide, {2} KB" -f $item.f, $w, [math]::Round((Get-Item $path).Length / 1KB, 1))
}

# map.png -> map.jpg (illustration, small enough to re-encode as JPEG)
$mapPng = Join-Path $imgDir 'map.png'
if (Test-Path $mapPng) {
  $before += (Get-Item $mapPng).Length
  $src = [System.Drawing.Image]::FromFile($mapPng)
  try {
    $w = 1400
    $scale = $w / $src.Width
    $h = [int][math]::Round($src.Height * $scale)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, $w, $h)
    $g.Dispose()
    $tmp = (Join-Path $imgDir 'map.jpg.tmp')
    Save-Jpeg $bmp $tmp 86
    $bmp.Dispose()
  } finally {
    $src.Dispose()
  }
  Move-Item -Path $tmp -Destination (Join-Path $imgDir 'map.jpg') -Force
  Remove-Item $mapPng -Force
  $after += (Get-Item (Join-Path $imgDir 'map.jpg')).Length
  Write-Output ("{0,-16} -> {1}px wide, {2} KB (png -> jpg)" -f 'map.png', $w, [math]::Round((Get-Item (Join-Path $imgDir 'map.jpg')).Length / 1KB, 1))
}

# news-8.png is a genuine PNG -> downscale in place, keep PNG
$n8 = Join-Path $imgDir 'news-8.png'
if (Test-Path $n8) {
  $before += (Get-Item $n8).Length
  $src = [System.Drawing.Image]::FromFile($n8)
  try {
    $w = 1000
    $scale = $w / $src.Width
    $h = [int][math]::Round($src.Height * $scale)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, $w, $h)
    $g.Dispose()
    $tmp = "$n8.tmp"
    $bmp.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
  } finally {
    $src.Dispose()
  }
  Move-Item -Path $tmp -Destination $n8 -Force
  $after += (Get-Item $n8).Length
  Write-Output ("{0,-16} -> {1}px wide, {2} KB (png kept)" -f 'news-8.png', $w, [math]::Round((Get-Item $n8).Length / 1KB, 1))
}

Write-Output ''
Write-Output ("images total: {0} MB -> {1} MB" -f [math]::Round($before / 1MB, 2), [math]::Round($after / 1MB, 2))
