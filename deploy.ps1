# Script de Deploy Automático via FTP - TvCorp MVP
# Desenvolvido pelo squad A-Team

$ftpServer = "ftp://ftp.tvcorp.hubdigital360.com"
$username = "u576215103.tvcorp"
$password = "I`$Ta4KJn8" # Escapando o caractere $ do PowerShell
$remotePath = "" # A conta FTP já cai diretamente na pasta public_html

# Função para criar diretório remoto no FTP
function Create-FtpDirectory {
    param (
        [string]$uri
    )
    
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($username, $password)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
    $request.UseBinary = $true
    $request.KeepAlive = $false

    try {
        $response = $request.GetResponse()
        $response.Close()
        Write-Host "Diretório criado com sucesso: $uri" -ForegroundColor Green
    } catch {
        # Ignora se o diretório já existir
        $err = $_.Exception.Message
        if ($err -match "550") {
            Write-Host "Diretório já existe ou inacessível: $uri" -ForegroundColor Yellow
        } else {
            Write-Host "Erro ao criar diretório $uri : $err" -ForegroundColor Red
        }
    }
}

# Função para enviar um arquivo local para o FTP
function Upload-FtpFile {
    param (
        [string]$localFile,
        [string]$remoteUri
    )
    
    if (!(Test-Path $localFile)) {
        Write-Host "Erro: Arquivo local não encontrado - $localFile" -ForegroundColor Red
        return
    }

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
        
        Write-Host "Upload concluído: $localFile -> $remoteUri" -ForegroundColor Cyan
    } catch {
        Write-Host "Erro no upload do arquivo $localFile para $remoteUri : $_" -ForegroundColor Red
    }
}

# Execução do Deploy
Write-Host "Iniciando deploy do TvCorp para $ftpServer..." -ForegroundColor Green

# Normalizar caminhos de URI
$baseUri = $ftpServer
if ($remotePath -ne "") {
    $baseUri = "$ftpServer$remotePath"
}

# 1. Criar estrutura de pastas remota
Create-FtpDirectory -uri "$baseUri/api"
Create-FtpDirectory -uri "$baseUri/player"
Create-FtpDirectory -uri "$baseUri/assets"

# 2. Upload da API PHP (pasta /api)
Write-Host "`n=== Enviando API PHP ===" -ForegroundColor Yellow
$apiFolder = Join-Path $PSScriptRoot "api"
Upload-FtpFile -localFile (Join-Path $apiFolder "db.php") -remoteUri "$baseUri/api/db.php"
Upload-FtpFile -localFile (Join-Path $apiFolder "media.php") -remoteUri "$baseUri/api/media.php"
Upload-FtpFile -localFile (Join-Path $apiFolder "playlists.php") -remoteUri "$baseUri/api/playlists.php"
Upload-FtpFile -localFile (Join-Path $apiFolder "screens.php") -remoteUri "$baseUri/api/screens.php"
Upload-FtpFile -localFile (Join-Path $apiFolder "mercadopago.php") -remoteUri "$baseUri/api/mercadopago.php"
Upload-FtpFile -localFile (Join-Path $apiFolder "webhook.php") -remoteUri "$baseUri/api/webhook.php"
Upload-FtpFile -localFile (Join-Path $apiFolder "auth.php") -remoteUri "$baseUri/api/auth.php"

# 3. Upload do Player (pasta /player)
Write-Host "`n=== Enviando Player App ===" -ForegroundColor Yellow
$playerFolder = Join-Path $PSScriptRoot "player"
Upload-FtpFile -localFile (Join-Path $playerFolder "index.html") -remoteUri "$baseUri/player/index.html"
Upload-FtpFile -localFile (Join-Path $playerFolder "player.js") -remoteUri "$baseUri/player/player.js"

# 4. Upload do Frontend Admin Compilado (pasta frontend-admin/dist)
Write-Host "`n=== Enviando Admin Panel (Compilado) ===" -ForegroundColor Yellow
$distFolder = Join-Path $PSScriptRoot "frontend-admin/dist"

if (Test-Path $distFolder) {
    # Index principal na raiz
    Upload-FtpFile -localFile (Join-Path $distFolder "index.html") -remoteUri "$baseUri/index.html"
    
    # Upload dos assets gerados pelo Vite (js, css)
    $assetsLocal = Join-Path $distFolder "assets"
    if (Test-Path $assetsLocal) {
        $files = Get-ChildItem -Path $assetsLocal -File
        foreach ($file in $files) {
            $fileName = $file.Name
            Upload-FtpFile -localFile $file.FullName -remoteUri "$baseUri/assets/$fileName"
        }
    }
} else {
    Write-Host "Alerta: Pasta dist não encontrada. Execute 'npm run build' na pasta 'frontend-admin' antes do deploy." -ForegroundColor Red
}

Write-Host "`nDeploy finalizado!" -ForegroundColor Green
