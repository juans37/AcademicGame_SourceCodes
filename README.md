# Descripción del Proyecto
Este repositorio contiene el código fuente del gestor de PlayFab y dos scripts adicionales para gestionar la integración con Google Sheets. A continuación se explican los archivos incluidos y cómo utilizarlos.

## Archivos
1. **PlayfabManager.cs**
   - Este archivo contiene el código fuente del gestor de PlayFab utilizado en el juego.
   - Se encarga de la gestión de inicios de sesión, almacenamiento y recuperación de datos del jugador, así como otras operaciones relacionadas con PlayFab.

2. **RegisterPlayers.gs**
   - Script en Google Apps Script para registrar jugadores en Google Sheets.
   - Este script debe copiarse y pegarse en el servicio de Apps Script de tu cuenta de Google.

3. **ShowPlayfabPlayers.gs**
   - Script en Google Apps Script para mostrar la información de los jugadores de PlayFab en una hoja de cálculo de Google Sheets.
   - Al igual que el anterior, este script también debe copiarse y pegarse en el servicio de Apps Script.

## Instrucciones de Configuración
1. **Configuración de Google Apps Script**
   - Abre Google Sheets y accede a `Extensiones > Apps Script`.
   - Crea dos nuevos archivos de script dentro del editor.
   - Copia el código de los archivos `RegisterPlayers.gs` y `ShowPlayfabPlayers.gs` respectivamente.
   - Guarda los scripts y publica el proyecto como una aplicación web si es necesario.

## Uso
- **RegisterPlayers.gs:** Ejecuta este script para registrar nuevos jugadores en Google Sheets.
- **ShowPlayfabPlayers.gs:** Ejecuta este script para visualizar los datos de jugadores almacenados en PlayFab en una hoja de cálculo.

Si tienes alguna duda, consulta la documentación oficial de PlayFab y Google Apps Script o contáctame para mayor asistencia.

