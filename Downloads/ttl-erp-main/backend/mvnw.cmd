@REM Maven Wrapper for Windows
@echo off
setlocal

set MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6\apache-maven-3.9.6
set MAVEN_BIN=%MAVEN_HOME%\bin\mvn.cmd

if not exist "%MAVEN_BIN%" (
    echo Downloading Maven 3.9.6...
    mkdir "%MAVEN_HOME%" 2>nul
    powershell -Command "Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip' -OutFile '%USERPROFILE%\.m2\wrapper\maven.zip'"
    powershell -Command "Expand-Archive -Path '%USERPROFILE%\.m2\wrapper\maven.zip' -DestinationPath '%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6' -Force"
    del "%USERPROFILE%\.m2\wrapper\maven.zip"
)

"%MAVEN_BIN%" %*
