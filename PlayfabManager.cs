using System;
using System.Collections.Generic;
using PlayFab;
using PlayFab.ClientModels;
using UnityEngine;

namespace Web
{
    public static class PlayfabManager
    {
        // Eventos para el inicio de sesión
        public static event Action<string> OnLoginSuccessEvent; // Evento para éxito de inicio de sesión
        public static event Action<string> OnLoginFailedEvent;  // Evento para fallo en el inicio de sesión

        // Parámetros predeterminados para el inicio de sesión
        private const string PASSWORD = "defaultPassword123"; // Contraseña por defecto
        private const string TITLE_ID = "TitleIdExample";     // ID del título en PlayFab
        private const string LAST_INDEX = "LastIndexKey";     // Clave del último índice para datos almacenados

        // Método para iniciar sesión con un usuario de PlayFab
        public static void LoginUser(string playfabUsername)
        {
            var request = new LoginWithPlayFabRequest
            {
                Username = playfabUsername,
                Password = PASSWORD,
                TitleId = TITLE_ID
            };

            // Llamada a la API de PlayFab para iniciar sesión
            PlayFabClientAPI.LoginWithPlayFab(
                request,
                result =>
                {
                    // Validar si hay una sesión activa
                    ValidateActiveSession(playfabUsername, isValid =>
                    {
                        if (isValid)
                        {
                            OnLoginSuccessEvent?.Invoke(playfabUsername); // Emitir evento de éxito
                            ResendStoredData(); // Intentar reenviar datos almacenados

                            // Generar un nuevo token de sesión y una marca de tiempo, luego almacenarlos
                            string newSessionToken = Guid.NewGuid().ToString();
                            string sessionTimestamp = DateTime.UtcNow.ToString("o"); // Formato ISO 8601
                            SavePlayerData(new Dictionary<string, string>
                            {
                                { "ActiveSessionToken", newSessionToken },
                                { "SessionTimestamp", sessionTimestamp }
                            });
                        }
                        else
                        {
                            Debug.LogError("La cuenta ya está en uso o la sesión está activa.");
                            OnLoginFailedEvent?.Invoke("La cuenta ya está en uso o la sesión está activa.");
                        }
                    });
                },
                error => OnLoginFailedEvent?.Invoke(error.ErrorMessage) // Manejo de errores
            );
        }

        // Método para validar si hay una sesión activa
        private static void ValidateActiveSession(string playfabUsername, Action<bool> onValidationComplete)
        {
            PlayFabClientAPI.GetUserData(new GetUserDataRequest(),
                result =>
                {
                    if (result.Data != null)
                    {
                        // Verificar si hay un token de sesión activo
                        if (result.Data.TryGetValue("ActiveSessionToken", out var sessionData) &&
                            result.Data.TryGetValue("SessionTimestamp", out var timestampData))
                        {
                            DateTime sessionTime;
                            if (DateTime.TryParse(timestampData.Value, out sessionTime))
                            {
                                // Comparar el tiempo de la sesión con el tiempo actual
                                TimeSpan sessionDuration = DateTime.UtcNow - sessionTime;
                                if (sessionDuration.TotalMinutes > 30) // Tiempo máximo de sesión: 30 minutos
                                {
                                    Debug.Log("Sesión expirada. Permitido iniciar sesión.");
                                    onValidationComplete(true); // Sesión expirada, permitir inicio
                                    return;
                                }
                                else
                                {
                                    Debug.Log("Sesión activa todavía válida.");
                                    onValidationComplete(false); // Sesión válida, no permitir inicio
                                    return;
                                }
                            }
                        }
                    }

                    // No hay sesión o los datos son inválidos, permitir inicio de sesión
                    onValidationComplete(true);
                },
                error =>
                {
                    Debug.LogError($"Error al validar sesión: {error.ErrorMessage}");
                    onValidationComplete(true); // Suponer que no hay sesión activa si falla la validación
                });
        }

        // Método para obtener información de la cuenta del jugador
        public static void FetchAccountInfo(Action<string> onSuccess, Action<string> onError)
        {
            PlayFabClientAPI.GetAccountInfo(new GetAccountInfoRequest(),
                result =>
                {
                    var displayName = result.AccountInfo.TitleInfo.DisplayName ?? "Jugador sin nombre";
                    onSuccess?.Invoke(displayName);
                },
                error =>
                {
                    onError?.Invoke(error.ErrorMessage);
                });
        }

        // Guardar datos del jugador en PlayFab
        public static void SavePlayerData(Dictionary<string, string> data, Action onSuccess = null, Action<string> onError = null)
        {
            var request = new UpdateUserDataRequest
            {
                Data = data,
                Permission = UserDataPermission.Private // Los datos son privados, solo visibles para el jugador
            };

            PlayFabClientAPI.UpdateUserData(request,
                result =>
                {
                    Debug.Log("Datos del jugador guardados correctamente.");
                    onSuccess?.Invoke();
                },
                error =>
                {
                    Debug.LogError($"Error al guardar los datos del jugador: {error.ErrorMessage}");
                    onError?.Invoke(error.ErrorMessage);
                    StoreData(data); // Almacenar datos localmente si falla la operación
                });
        }

        // Cargar datos del jugador desde PlayFab
        public static void LoadPlayerData(Action<Dictionary<string, string>> onSuccess, Action<string> onError)
        {
            PlayFabClientAPI.GetUserData(new GetUserDataRequest(),
                result =>
                {
                    if (result.Data != null && result.Data.Count > 0)
                    {
                        Debug.Log("Datos del jugador cargados correctamente.");

                        var transformedData = new Dictionary<string, string>();
                        foreach (var kvp in result.Data)
                        {
                            transformedData[kvp.Key] = kvp.Value.Value; // Extraer valores de los datos
                        }

                        onSuccess?.Invoke(transformedData);
                    }
                    else
                    {
                        Debug.Log("No se encontraron datos del jugador.");
                        onSuccess?.Invoke(new Dictionary<string, string>());
                    }
                },
                error =>
                {
                    Debug.LogError($"Error al cargar datos del jugador: {error.ErrorMessage}");
                    onError?.Invoke(error.ErrorMessage);
                });
        }

        // Almacenar datos localmente en caso de fallo
        private static void StoreData(Dictionary<string, string> data)
        {
            var storedData = new StoredData
            {
                key = PlayerPrefs.GetInt(LAST_INDEX, 0),
                data = new DictionaryData[data.Count]
            };

            var i = 0;
            foreach (var kvp in data)
            {
                storedData.data[i] = new DictionaryData
                {
                    key = kvp.Key,
                    value = kvp.Value
                };
                i++;
            }

            var json = JsonUtility.ToJson(storedData);
            PlayerPrefs.SetString(storedData.key.ToString(), json);
        }

        // Reenviar datos almacenados localmente
        public static void ResendStoredData()
        {
            if (IsInternetAvailable())
            {
                int lastIndex = PlayerPrefs.GetInt(LAST_INDEX, 0);
                for (int i = 0; i <= lastIndex; i++)
                {
                    string json = PlayerPrefs.GetString(i.ToString(), null);
                    if (!string.IsNullOrEmpty(json))
                    {
                        var storedData = JsonUtility.FromJson<StoredData>(json);
                        var data = new Dictionary<string, string>();
                        foreach (var item in storedData.data)
                        {
                            data[item.key] = item.value;
                        }

                        SavePlayerData(data,
                            () => PlayerPrefs.DeleteKey(i.ToString()), // Eliminar datos locales si se envían con éxito
                            error => Debug.LogError($"Error al reenviar datos: {error}")
                        );
                    }
                }
            }
        }

        // Cerrar sesión del usuario
        public static void LogoutUser(Action onSuccess = null, Action<string> onError = null)
        {
            PlayFabClientAPI.UpdateUserData(new UpdateUserDataRequest
            {
                Data = new Dictionary<string, string> { { "ActiveSessionToken", null } }
            },
            result =>
            {
                PlayFabClientAPI.ForgetAllCredentials();
                Debug.Log("Usuario desconectado correctamente.");
                onSuccess?.Invoke();
            },
            error =>
            {
                Debug.LogError($"Error al cerrar sesión: {error.ErrorMessage}");
                onError?.Invoke(error.ErrorMessage);
            });
        }

        // Comprobar si hay conexión a Internet
        public static bool IsInternetAvailable()
        {
            return Application.internetReachability != NetworkReachability.NotReachable;
        }
    }

    // Clases para serialización de datos locales
    [Serializable]
    public class StoredData
    {
        public int key;
        public DictionaryData[] data;
    }

    [Serializable]
    public class DictionaryData
    {
        public string key;
        public string value;
    }
}
