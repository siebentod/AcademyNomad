// Open file command

use std::path::Path;
use std::process::Command;
use tauri::command;

use super::types::{OpenFileParams, OpenFileResult};

#[command]
pub async fn open_file(params: OpenFileParams) -> Result<OpenFileResult, String> {
    let OpenFileParams { path, page, program_path } = params;

    #[cfg(target_os = "windows")]
    {
        let (success, used_path) = if let Some(page_num) = page {
            // Если указана страница и это PDF
            if path.to_lowercase().ends_with(".pdf") {
                // Сначала проверяем, передан ли program_path
                if let Some(prog_path) = program_path {
                    // Используем переданную программу
                    if Path::new(&prog_path).exists() {
                        match Command::new(&prog_path)
                            .arg("/A")
                            .arg(format!("page={}", page_num))
                            .arg(&path)
                            .spawn() {
                            Ok(_) => (true, prog_path),
                            Err(_) => {
                                // Если program_path не сработал, открываем через explorer
                                match Command::new("explorer").arg(&path).spawn() {
                                    Ok(_) => (false, "explorer".to_string()),
                                    Err(_) => (false, "explorer".to_string()),
                                }
                            }
                        }
                    } else {
                        // program_path не существует, открываем через explorer
                        match Command::new("explorer").arg(&path).spawn() {
                            Ok(_) => (false, "explorer".to_string()),
                            Err(_) => (false, "explorer".to_string()),
                        }
                    }
                } else {
                    // Ищем Adobe Acrobat в стандартных путях
                    let adobe_paths = [
                        r"C:\Program Files\Adobe\Acrobat DC\Acrobat\Acrobat.exe",
                        r"C:\Program Files (x86)\Adobe\Acrobat Reader DC\Reader\AcroRd32.exe",
                        r"C:\Program Files (x86)\Adobe\Acrobat DC\Acrobat\Acrobat.exe"
                    ];

                    let mut opened_with = None;
                    for adobe_path in &adobe_paths {
                        if Path::new(adobe_path).exists() {
                            println!("Найден Adobe Acrobat: {}", adobe_path);
                            match Command::new(adobe_path)
                                .arg("/A")
                                .arg(format!("page={}", page_num))
                                .arg(&path)
                                .spawn() {
                                Ok(_) => {
                                    opened_with = Some(adobe_path.to_string());
                                    break;
                                }
                                Err(_) => continue,
                            }
                        }
                    }

                    match opened_with {
                        Some(adobe_path) => (true, adobe_path),
                        None => {
                            // Если ни один Adobe не найден, открываем через explorer
                            match Command::new("explorer").arg(&path).spawn() {
                                Ok(_) => (true, "explorer".to_string()),
                                Err(_) => (false, "explorer".to_string()),
                            }
                        }
                    }
                }
            } else {
                // Не PDF файл с указанной страницей - открываем через explorer
                match Command::new("explorer").arg(&path).spawn() {
                    Ok(_) => (true, "explorer".to_string()),
                    Err(_) => (false, "explorer".to_string()),
                }
            }
        } else {
            // Если страница не указана - обычное открытие через explorer
            match Command::new("explorer").arg(&path).spawn() {
                Ok(_) => (true, "explorer".to_string()),
                Err(_) => (false, "explorer".to_string()),
            }
        };

        Ok(OpenFileResult { success, path: used_path })
    }

    #[cfg(target_os = "macos")]
    {
        match Command::new("open").arg(&path).spawn() {
            Ok(_) => Ok(OpenFileResult { success: true, path: "open".to_string() }),
            Err(e) => Err(format!("Ошибка при открытии файла: {}", e)),
        }
    }

    #[cfg(target_os = "linux")]
    {
        match Command::new("xdg-open").arg(&path).spawn() {
            Ok(_) => Ok(OpenFileResult { success: true, path: "xdg-open".to_string() }),
            Err(e) => Err(format!("Ошибка при открытии файла: {}", e)),
        }
    }
}
