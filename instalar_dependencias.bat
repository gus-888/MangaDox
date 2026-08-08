@echo off
title Instalador MangaDox API
echo ==========================================
echo Instalando dependencias do MangaDox API...
echo ==========================================
call npm install

echo.
echo ==========================================
echo Instalando Puppeteer Chrome...
echo ==========================================
call npx puppeteer browsers install chrome

echo.
echo ==========================================
echo Verificando e corrigindo extracao do Chrome...
echo (Isso resolve o bug de arquivos ausentes no Windows)
echo ==========================================
powershell -Command "$chromePath = \"$env:USERPROFILE\.cache\puppeteer\chrome\win64-148.0.7778.97\chrome-win64\chrome.exe\"; $zipPath = \"$env:USERPROFILE\.cache\puppeteer\chrome\win64-148.0.7778.97\148.0.7778.97-chrome-win64.zip\"; $destPath = \"$env:USERPROFILE\.cache\puppeteer\chrome\win64-148.0.7778.97_temp\"; $finalPath = \"$env:USERPROFILE\.cache\puppeteer\chrome\win64-148.0.7778.97\"; if (-Not (Test-Path $chromePath)) { Write-Host 'O Chrome nao foi extraido corretamente pelo npm. Tentando extrair manualmente...'; $zipSearch = Get-ChildItem -Path \"$env:USERPROFILE\.cache\puppeteer\chrome\" -Filter \"*.zip\" -Recurse | Select-Object -First 1; if ($zipSearch) { Write-Host \"Arquivo zip encontrado: $($zipSearch.FullName)\"; Expand-Archive -Path $zipSearch.FullName -DestinationPath $destPath -Force; Remove-Item -Recurse -Force $finalPath; Rename-Item -Path $destPath -NewName \"win64-148.0.7778.97\"; Write-Host 'Correcao aplicada com sucesso!' } else { Write-Host 'Zip do Chrome nao encontrado. Tente rodar o script novamente.' } } else { Write-Host 'Chrome já esta instalado e extraido corretamente.' }"

echo.
echo ==========================================
echo Instalacao concluida com sucesso!
echo Voce ja pode rodar a API usando: npm start
echo ==========================================
pause
