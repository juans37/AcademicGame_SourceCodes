function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu("Funciones")
        .addItem("Crear usuarios", "uploadStudentsToPlayFab")
        .addToUi();
}

function uploadStudentsToPlayFab() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Student_Database");
    const data = sheet.getDataRange().getValues();
    const apiKey = "E63XSN3DX6DFRK4169J3GU4Y4PH4WAIOK5M5MGRYW99FXPXZHR";
    const titleId = "8803E";

    for (let i = 1; i < data.length; i++) {
        const student = data[i];
        let codEstudiante = student[0]; // cod_estudiante
        const priNom = student[1];     // pri_nom
        const segNom = student[2];     // seg_nom
        const priApe = student[3];     // pri_ape
        const segApe = student[4];     // seg_ape
        const colegio = student[5];    // Colegio

        if (!codEstudiante) {
            Logger.log(`Skipping row ${i + 1} due to missing cod_estudiante`);
            continue; // Skip rows with missing IDs
        }

        // Save the full codEstudiante for reference
        const originalCodEstudiante = codEstudiante;

        // Sanitize the username
        codEstudiante = sanitizeUsername(codEstudiante);

        if (codEstudiante.length < 3 || codEstudiante.length > 20) {
            Logger.log(`Skipping row ${i + 1} due to invalid username length: ${codEstudiante}`);
            continue; // Skip invalid usernames
        }

        Logger.log(`Processing user: ${codEstudiante}`);

        const payload = {
            TitleId: titleId,
            Username: codEstudiante,
            DisplayName: priNom,
            Password: "defaultPassword123",
            RequireBothUsernameAndEmail: false
        };

        try {
            const registerResponse = UrlFetchApp.fetch(
                `https://${titleId}.playfabapi.com/Client/RegisterPlayFabUser`,
                {
                    method: "post",
                    contentType: "application/json",
                    headers: { "X-SecretKey": apiKey },
                    payload: JSON.stringify(payload)
                }
            );

            const registerResult = JSON.parse(registerResponse.getContentText());

            if (registerResult.code === 200) {
                Logger.log(`User ${codEstudiante} created successfully`);

                const playFabId = registerResult.data.PlayFabId;

                // Update custom data, including full codEstudiante for reference
                const customData = {
                    original_cod_estudiante: originalCodEstudiante || '', // Save full codEstudiante
                    first_name: priNom || '',
                    second_name: segNom || '',
                    first_last_name: priApe || '',
                    second_last_name: segApe || '',
                    school: colegio || ''
                };

                UrlFetchApp.fetch(
                    `https://${titleId}.playfabapi.com/Server/UpdateUserData`,
                    {
                        method: "post",
                        contentType: "application/json",
                        headers: { "X-SecretKey": apiKey },
                        payload: JSON.stringify({
                            PlayFabId: playFabId,
                            Data: customData
                        })
                    }
                );
            } else {
                Logger.log(`Error registering user: ${registerResult.errorMessage}`);
            }
        } catch (error) {
            Logger.log(`Error processing row ${i + 1}: ${error.message}`);
        }
    }
}

function sanitizeUsername(username) {
    // Remove invalid characters and trim whitespace
    const sanitized = username.replace(/[^a-zA-Z0-9]/g, '').trim();

    // Return the last 6 characters
    return sanitized.length > 6 ? sanitized.substring(sanitized.length - 6) : sanitized;
}
