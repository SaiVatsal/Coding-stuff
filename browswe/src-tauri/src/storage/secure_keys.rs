// storage/secure_keys.rs — OS keychain wrapper for API keys
//
// Uses the `keyring` crate which maps to:
//   - Windows Credential Manager on Windows
//   - macOS Keychain on macOS
//   - Secret Service (GNOME Keyring / KWallet) on Linux
//
// Keys are stored under service "april-browser" with usernames like "api-key-openai".
// This is far more secure than localStorage, .env files, or config JSON.

const SERVICE_NAME: &str = "april-browser";

/// Known providers that we support storing keys for.
const KNOWN_PROVIDERS: &[&str] = &["openai", "anthropic", "groq"];

/// Internal function — used by both Tauri commands and the agent module.
pub fn read_key(provider: &str) -> Result<Option<String>, String> {
    let username = format!("api-key-{}", provider);
    let entry = keyring::Entry::new(SERVICE_NAME, &username).map_err(|e| {
        format!(
            "Failed to access keychain entry for '{}': {}",
            provider, e
        )
    })?;

    match entry.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(keyring::Error::Ambiguous(_)) => {
            // Multiple credentials found — shouldn't happen, but handle gracefully
            log::warn!(
                "Ambiguous keychain entries for '{}/{}', returning None",
                SERVICE_NAME,
                username
            );
            Ok(None)
        }
        Err(e) => Err(format!("Keychain read error for '{}': {}", provider, e)),
    }
}

/// Store a key in the OS keychain. Overwrites any existing value.
pub fn write_key(provider: &str, key: &str) -> Result<(), String> {
    let username = format!("api-key-{}", provider);
    let entry = keyring::Entry::new(SERVICE_NAME, &username)
        .map_err(|e| format!("Failed to create keychain entry for '{}': {}", provider, e))?;

    entry
        .set_password(key)
        .map_err(|e| format!("Failed to store key for '{}': {}", provider, e))
}

pub fn remove_key(provider: &str) -> Result<(), String> {
    let username = format!("api-key-{}", provider);
    let entry = keyring::Entry::new(SERVICE_NAME, &username)
        .map_err(|e| format!("Failed to access keychain entry for '{}': {}", provider, e))?;

    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()), // Already gone — idempotent
        Err(e) => Err(format!("Failed to delete key for '{}': {}", provider, e)),
    }
}

// ─── Tauri Commands ─────────────────────────────────────────────────────────

#[tauri::command]
pub fn store_api_key(provider: String, key: String) -> Result<(), String> {
    if key.trim().is_empty() {
        return Err("API key cannot be empty".to_string());
    }
    write_key(&provider, key.trim())
}

#[tauri::command]
pub fn get_api_key(provider: String) -> Result<Option<String>, String> {
    read_key(&provider)
}

#[tauri::command]
pub fn delete_api_key(provider: String) -> Result<(), String> {
    remove_key(&provider)
}

/// Returns a list of providers that have a stored API key.
#[tauri::command]
pub fn list_providers() -> Result<Vec<String>, String> {
    let mut configured = Vec::new();
    for &provider in KNOWN_PROVIDERS {
        if let Ok(Some(_)) = read_key(provider) {
            configured.push(provider.to_string());
        }
    }
    Ok(configured)
}
