Add-Type -AssemblyName System.Drawing
function RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $d = 2 * $r
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc(($x+$w-$d), $y, $d, $d, 270, 90)
  $p.AddArc(($x+$w-$d), ($y+$h-$d), $d, $d, 0, 90)
  $p.AddArc($x, ($y+$h-$d), $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}
$bitmap = [System.Drawing.Bitmap]::new(1024,1024)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.ScaleTransform(4,4)
foreach ($shape in @(@(8,8,240,240,62,'#7055D5'),@(53,66,123,147,23,'#B5A3ED'),@(77,47,126,153,23,'#FAF8FF'),@(111,35,58,29,11,'#DAD0F7'))) {
  $path = RoundedPath $shape[0] $shape[1] $shape[2] $shape[3] $shape[4]
  $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($shape[5]))
  $graphics.FillPath($brush, $path)
  $path.Dispose(); $brush.Dispose()
}
$pen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#7055D5'),12)
$pen.StartCap = $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$graphics.DrawLine($pen,110,104,170,104)
$graphics.DrawLine($pen,110,128,153,128)
$graphics.DrawLine($pen,110,152,138,152)
$points = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(185,146),[System.Drawing.PointF]::new(193,165),[System.Drawing.PointF]::new(213,173),[System.Drawing.PointF]::new(193,181),[System.Drawing.PointF]::new(185,200),[System.Drawing.PointF]::new(177,181),[System.Drawing.PointF]::new(158,173),[System.Drawing.PointF]::new(177,165))
$brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#7055D5'))
$graphics.FillPolygon($brush,$points)
$edgePen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#FAF8FF'),5)
$edgePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$graphics.DrawPolygon($edgePen,$points)
$bitmap.Save((Join-Path $PWD 'assets/icon.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$entries = @()
foreach ($size in @(16,32,48,64,128,256)) {
  $small = [System.Drawing.Bitmap]::new($size,$size)
  $sg = [System.Drawing.Graphics]::FromImage($small)
  $sg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $sg.DrawImage($bitmap,0,0,$size,$size)
  $stream = [System.IO.MemoryStream]::new()
  $small.Save($stream,[System.Drawing.Imaging.ImageFormat]::Png)
  $entries += @{ Size=$size; Bytes=$stream.ToArray() }
  $sg.Dispose(); $small.Dispose(); $stream.Dispose()
}
$ico = [System.IO.File]::Create((Join-Path $PWD 'assets/icon.ico'))
$writer = [System.IO.BinaryWriter]::new($ico)
$writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]$entries.Count)
$offset = 6 + (16 * $entries.Count)
foreach ($entry in $entries) {
  $encodedSize = if ($entry.Size -eq 256) { 0 } else { $entry.Size }
  $writer.Write([byte]$encodedSize); $writer.Write([byte]$encodedSize)
  $writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([uint16]1); $writer.Write([uint16]32)
  $writer.Write([uint32]$entry.Bytes.Length); $writer.Write([uint32]$offset)
  $offset += $entry.Bytes.Length
}
foreach ($entry in $entries) { $writer.Write([byte[]]$entry.Bytes) }
$writer.Dispose(); $ico.Dispose()
$edgePen.Dispose(); $brush.Dispose(); $pen.Dispose(); $graphics.Dispose(); $bitmap.Dispose()

