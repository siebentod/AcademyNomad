// Show in explorer command

use std::process::Command;
use tauri::command;

#[command]
pub async fn show_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| format!("Не удалось открыть проводник: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| format!("Не удалось открыть Finder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // Для Linux используем xdg-open или nautilus
        let parent = Path::new(&path)
            .parent()
            .ok_or("Не удалось получить родительскую директорию")?;

        Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| format!("Не удалось открыть файловый менеджер: {}", e))?;
    }

    Ok(())
}
