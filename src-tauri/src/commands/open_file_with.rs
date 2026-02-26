// Open file with command

use std::process::Command;
use tauri::command;

#[command]
pub async fn open_file_with(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("rundll32")
            .args(["shell32.dll,OpenAs_RunDLL", &path])
            .spawn()
            .map_err(|e| format!("Не удалось открыть диалог 'Открыть с помощью': {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(["-a", "Choose Application", &path])
            .spawn()
            .map_err(|e| format!("Не удалось открыть диалог выбора приложения: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // Для Linux можно использовать различные команды в зависимости от DE
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Не удалось открыть файл: {}", e))?;
    }

    Ok(())
}
