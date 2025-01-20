// Main Function
function fetchPlayersCustomDataToSheet() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Player_Database");
    sheet.clear();

    const headers = CONFIG.headers;
    const playersData = [];
    let continuationToken = null;

    do {
        const json = fetchPlayers(CONFIG.segmentId, continuationToken);
        const players = json.data?.PlayerProfiles || [];
        continuationToken = json.data?.ContinuationToken;

        players.forEach(player => {
            const username = player.LinkedAccounts?.[0]?.Username || "N/A";
            const customData = fetchUserData(player.PlayerId);

            // Build the player row
            const playerRow = {
                original_cod_estudiante: customData.original_cod_estudiante?.Value || "N/A",
                Username: username
            };

            // Map other headers dynamically
            headers.slice(2).forEach(header => {
                playerRow[header] = mapCustomFields(header, customData[header]?.Value);
            });

            // Calculate Stars
            const starKeys = ["Stars_Map0", "Stars_Map1", "Stars_Map2", "Stars_Map3"];
            playerRow.Stars = starKeys
              .map(key => {
                  const value = parseInt(playerRow[key], 10);
                  return isNaN(value) ? 0 : value; // Default to 0 if the value is missing or invalid
                })
              .reduce((total, current) => total + current, 0);

            playersData.push(playerRow);
        });

        Utilities.sleep(100); // Prevent rate limiting
    } while (continuationToken);

    // Write data to sheet
    const displayHeaders = headers.map(header => CONFIG.translatedHeaders[header] || header);
    displayHeaders.push("Estrellas Totales"); // Add Stars column header

    sheet.appendRow(displayHeaders);

    // Map data to rows
    const rows = playersData.map(playerRow => 
        [...headers.map(header => playerRow[header] || ""), playerRow.Stars]
    );

    sheet.getRange(2, 1, rows.length, displayHeaders.length).setValues(rows);

    // Format sheet
    formatSheet(sheet);
}

// Configuration
const CONFIG = {
    titleId: "8803E",
    secretKey: "E63XSN3DX6DFRK4169J3GU4Y4PH4WAIOK5M5MGRYW99FXPXZHR",
    segmentId: "8185414243FAC36C",
    headers: [
        "original_cod_estudiante",
        "Username",
        "first_name",
        "second_name",
        "first_last_name",
        "second_last_name",
        "school",
        "Gender",
        "Stars_Map0",
        "PlayTime_Map0",
        "Hits_Map0",
        "Fails_Map0",
        "Streak_Map0",
        "Map_Completed0",
        "Stars_Map1",
        "PlayTime_Map1",
        "Hits_Map1",
        "Fails_Map1",
        "Streak_Map1",
        "Map_Completed1",
        "Stars_Map2",
        "PlayTime_Map2",
        "Hits_Map2",
        "Fails_Map2",
        "Streak_Map2",
        "Map_Completed2",
        "Stars_Map3",
        "PlayTime_Map3",
        "Hits_Map3",
        "Fails_Map3",
        "Streak_Map3",
        "Map_Completed3"
    ],
    translatedHeaders: {
        original_cod_estudiante: "Código Original",
        Username: "Nombre de Usuario",
        first_name: "Nombre",
        second_name: "Segundo Nombre",
        first_last_name: "Apellido",
        second_last_name: "Segundo Apellido",
        school: "Escuela",
        Gender: "Género",
        Stars_Map0: "Estrellas Mundo 1",
        PlayTime_Map0: "Tiempo de Juego Mundo 1",
        Hits_Map0: "Aciertos Mundo 1",
        Fails_Map0: "Errores Mundo 1",
        Streak_Map0: "Racha Mundo 1",
        Map_Completed0: "Completado Mundo 1",
        Stars_Map1: "Estrellas Mundo 2",
        PlayTime_Map1: "Tiempo de Juego Mundo 2",
        Hits_Map1: "Aciertos Mundo 2",
        Fails_Map1: "Errores Mundo 2",
        Streak_Map1: "Racha Mundo 2",
        Map_Completed1: "Completado Mundo 2",
        Stars_Map2: "Estrellas Mundo 3",
        PlayTime_Map2: "Tiempo de Juego Mundo 3",
        Hits_Map2: "Aciertos Mundo 3",
        Fails_Map2: "Errores Mundo 3",
        Streak_Map2: "Racha Mundo 3",
        Map_Completed2: "Completado Mundo 3",
        Stars_Map3: "Estrellas Mundo 4",
        PlayTime_Map3: "Tiempo de Juego Mundo 4",
        Hits_Map3: "Aciertos Mundo 4",
        Fails_Map3: "Errores Mundo 4",
        Streak_Map3: "Racha Mundo 4",
        Map_Completed3: "Completado Mundo 4"
    }
};

// Helper Functions
function mapCustomFields(header, value) {
    if (header === "Gender") {
        return value === "0" ? "Hombre" : value === "1" ? "Mujer" : "N/A";
    }
    return value || "N/A";
}

// Helper Functions
function getApiOptions(payload) {
    return {
        method: "post",
        contentType: "application/json",
        headers: { "X-SecretKey": CONFIG.secretKey },
        payload: JSON.stringify(payload)
    };
}

function mapCustomFields(header, value) {
    if (header === "Gender") {
        return value === "0" ? "Hombre" : value === "1" ? "Mujer" : "N/A";
    }
    return value || "N/A";
}

function fetchPlayers(segmentId, continuationToken) {
    const url = `https://${CONFIG.titleId}.playfabapi.com/Admin/GetPlayersInSegment`;
    const payload = {
        SegmentId: segmentId,
        ContinuationToken: continuationToken,
        ProfileConstraints: { ShowDisplayName: true, ShowUsername: true }
    };
    const response = UrlFetchApp.fetch(url, getApiOptions(payload));
    return JSON.parse(response.getContentText());
}

function fetchUserData(playerId) {
    const url = `https://${CONFIG.titleId}.playfabapi.com/Admin/GetUserData`;
    const payload = { PlayFabId: playerId };
    const response = UrlFetchApp.fetch(url, getApiOptions(payload));
    return JSON.parse(response.getContentText()).data?.Data || {};
}

function formatSheet(sheet) {
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    const headers = CONFIG.headers;
    const headerRange = sheet.getRange(1, 1, 1, lastColumn);
    const dataRange = sheet.getRange(1, 1, lastRow, lastColumn);

    // Define high-contrast colors for map groups
    const mapColors = {
        Map0: "#D32F2F", // Dark red
        Map1: "#1976D2", // Dark blue
        Map2: "#388E3C", // Dark green
        Map3: "#FBC02D"  // Dark yellow
    };

    // Apply header styles
    headerRange.setFontWeight("bold").setFontColor("#ffffff").setBackground("#009688");
    sheet.setRowHeight(1, 40);
    dataRange.setBorder(true, true, true, true, true, true);
    sheet.autoResizeColumns(1, lastColumn);
    sheet.setFrozenRows(1);

    // Apply colors to map group headers
    headers.forEach((header, index) => {
        const columnIndex = index + 1; // Convert zero-based index to one-based index for Google Sheets
        const headerKey = header.match(/Map\d+/); // Match headers like "Map0", "Map_Completed0", etc.
        if (headerKey) {
            const color = mapColors[headerKey[0]]; // Get the color for the map group
            sheet.getRange(1, columnIndex).setBackground(color);
        }

        // Additional logic for Map_CompletedX headers
        if (header.includes("Map_Completed")) {
            const mapNumber = header.match(/Map_Completed(\d+)/)?.[1];
            if (mapNumber) {
                const color = mapColors[`Map${mapNumber}`];
                if (color) {
                    sheet.getRange(1, columnIndex).setBackground(color);
                }
            }
        }
    });
}
