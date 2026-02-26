// Delete file command

use std::fs;
use std::path::Path;
use tauri::command;

#[command]
pub async fn delete_file(path: String) -> Result<(), String> {
    let file_path = Path::new(&path);

    if !file_path.exists() {
        return Err("Файл не существует".to_string());
    }

    if file_path.is_file() {
        fs::remove_file(&path).map_err(|e| format!("Не удалось удалить файл: {}", e))?;
    } else if file_path.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| format!("Не удалось удалить папку: {}", e))?;
    }

    Ok(())
}
