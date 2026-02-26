// Edit filename command

use std::fs;
use std::io;
use std::path::PathBuf;
use tauri::command;

#[command]
pub async fn edit_filename(
    original_full_path: String,
    new_filename: String,
) -> Result<String, String> {
    let original_path = PathBuf::from(&original_full_path);

    // Проверяем, существует ли оригинальный файл
    if !original_path.exists() {
        return Err(format!(
            "Оригинальный файл не найден: {}",
            original_full_path
        ));
    }

    // Создаем полный путь к новому файлу в той же директории
    let parent_dir = original_path
        .parent()
        .ok_or_else(|| "Не удалось получить родительскую директорию файла".to_string())?;
    let new_full_path = parent_dir.join(&new_filename);

    // Проверяем, существует ли файл с новым именем (чтобы избежать перезаписи)
    if new_full_path.exists() {
        return Err(format!(
            "Файл с именем '{}' уже существует в этой директории.",
            new_filename
        ));
    }

    // Переименовываем файл
    match fs::rename(&original_path, &new_full_path) {
        Ok(_) => Ok(new_full_path.to_string_lossy().into_owned()),
        Err(e) => {
            // Обработка конкретных ошибок для более информативных сообщений
            if e.kind() == io::ErrorKind::PermissionDenied {
                Err(format!("Ошибка доступа при переименовании файла: {}. Убедитесь, что у приложения есть необходимые разрешения.", e))
            } else {
                Err(format!("Не удалось переименовать файл: {}", e))
            }
        }
    }
}
