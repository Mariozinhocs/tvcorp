# Script de Deploy de Produção via FTP - TvCorp
# Desenvolvido pelo squad A-Team

$ftpServer = "ftp://ftp.tvcorp.hubdigital360.com"
$username = "u576215103.tvcorp"
$password = "I`$Ta4KJn8"
$remotePath = ""

function Create-FtpDirectory {
    param ([string]$uri)
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($username, $password)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
    $request.UseBinary = $true
    $request.KeepAlive = $false
    try {
        $response = $request.GetResponse()
        $response.Close()
        Write-Host "Diretório criado: $uri" -ForegroundColor Green
    } catch {
        # Ignora se já existir
    }
}

function Upload-FtpFile {
    param ([string]$localFile, [string]$remoteUri)
    if (!(Test-Path $localFile)) { return }
    $request = [System.Net.FtpWebRequest]::Create($remoteUri)
    $request.Credentials = New-Object System.Net.NetworkCredential($username, $password)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $request.UseBinary = $true
    $request.KeepAlive = $false
    $fileBytes = [System.IO.File]::ReadAllBytes($localFile)
    $request.ContentLength = $fileBytes.Length
    try {
        $requestStream = $request.GetRequestStream()
        $requestStream.Write($fileBytes, 0, $fileBytes.Length)
        $requestStream.Close()
        $requestStream.Dispose()
        Write-Host "Upload: $localFile -> $remoteUri" -ForegroundColor Cyan
    } catch {
        Write-Host "Erro no upload: $localFile" -ForegroundColor Red
    }
}

Write-Host "Iniciando deploy do TvCorp para Produção..." -ForegroundColor Green
$baseUri = $ftpServer

# 1. Estrutura de Diretórios
Create-FtpDirectory -uri "$baseUri/css"
Create-FtpDirectory -uri "$baseUri/js"
Create-FtpDirectory -uri "$baseUri/player"
Create-FtpDirectory -uri "$baseUri/api"
Create-FtpDirectory -uri "$baseUri/api/auth"

# 2. Upload de Arquivos Raiz
Upload-FtpFile -localFile "$PSScriptRoot/index.html" -remoteUri "$baseUri/index.html"
Upload-FtpFile -localFile "$PSScriptRoot/app.html" -remoteUri "$baseUri/app.html"
Upload-FtpFile -localFile "$PSScriptRoot/login.html" -remoteUri "$baseUri/login.html"
Upload-FtpFile -localFile "$PSScriptRoot/admin.html" -remoteUri "$baseUri/admin.html"
Upload-FtpFile -localFile "$PSScriptRoot/help.html" -remoteUri "$baseUri/help.html"
Upload-FtpFile -localFile "$PSScriptRoot/db_installer.php" -remoteUri "$baseUri/db_installer.php"

# 3. Upload CSS
Get-ChildItem "$PSScriptRoot/css" -File | ForEach-Object {
    Upload-FtpFile -localFile $_.FullName -remoteUri "$baseUri/css/$($_.Name)"
}

# 4. Upload JS
Get-ChildItem "$PSScriptRoot/js" -File | ForEach-Object {
    Upload-FtpFile -localFile $_.FullName -remoteUri "$baseUri/js/$($_.Name)"
}

# 5. Upload Player
Get-ChildItem "$PSScriptRoot/player" -File | ForEach-Object {
    Upload-FtpFile -localFile $_.FullName -remoteUri "$baseUri/player/$($_.Name)"
}

# 6. Upload API
Upload-FtpFile -localFile "$PSScriptRoot/api/config.php" -remoteUri "$baseUri/api/config.php"
Upload-FtpFile -localFile "$PSScriptRoot/api/screens.php" -remoteUri "$baseUri/api/screens.php"
Upload-FtpFile -localFile "$PSScriptRoot/api/playlists.php" -remoteUri "$baseUri/api/playlists.php"
Upload-FtpFile -localFile "$PSScriptRoot/api/media.php" -remoteUri "$baseUri/api/media.php"
Upload-FtpFile -localFile "$PSScriptRoot/api/mercadopago.php" -remoteUri "$baseUri/api/mercadopago.php"
Upload-FtpFile -localFile "$PSScriptRoot/api/webhook.php" -remoteUri "$baseUri/api/webhook.php"
Upload-FtpFile -localFile "$PSScriptRoot/api/admin.php" -remoteUri "$baseUri/api/admin.php"
Upload-FtpFile -localFile "$PSScriptRoot/api/auth.php" -remoteUri "$baseUri/api/auth.php"

# Upload API Subpastas
Upload-FtpFile -localFile "$PSScriptRoot/api/auth/login.php" -remoteUri "$baseUri/api/auth/login.php"
Upload-FtpFile -localFile "$PSScriptRoot/api/auth/register.php" -remoteUri "$baseUri/api/auth/register.php"
Upload-FtpFile -localFile "$PSScriptRoot/api/auth/check_auth.php" -remoteUri "$baseUri/api/auth/check_auth.php"
Upload-FtpFile -localFile "$PSScriptRoot/api/auth/logout.php" -remoteUri "$baseUri/api/auth/logout.php"

Write-Host "`nDeploy de Produção Finalizado!" -ForegroundColor Green
