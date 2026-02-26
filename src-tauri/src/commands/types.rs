// Shared types for file commands

use serde::Deserialize;
use serde::Serialize;
use std::path::Path;

// Параметры для функции поиска
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchParams {
    pub query: String,
    pub path: Option<String>,
    pub count: Option<u32>,
    pub include_highlights: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileResult {
    pub file_name: String,
    pub full_path: String,
    pub title: String,

    pub size: Option<u64>,
    pub created_date: String,
    pub modified_date: String,
    pub extension: Option<String>,
    pub is_locked: bool,
    pub id: Option<String>,
    pub pdf_title: Option<String>,
    pub pdf_author: Option<String>,
    pub pdf_creator: Option<String>,
    pub highlights: Option<Vec<crate::commands::utils::get_file_highlights::Highlight>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub items: Vec<FileResult>,
    pub has_more: bool,
}

#[derive(Deserialize)]
pub struct OpenFileParams {
    pub path: String,
    pub page: Option<u32>,
    pub program_path: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct OpenFileResult {
    pub success: bool,
    pub path: String,
}

// Определяем FileMetadata здесь, так как она используется в watcher_commands
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileMetadata {
    pub file_name: String,
    pub full_path: String,
    pub title: String,
}

// Функция для парсинга метаданных файла, используется в watcher_commands
pub fn parse_file_metadata(path: &Path) -> Option<FileMetadata> {
    if !path.is_file() {
        return None;
    }

    if let Some(file_name) = path.file_stem().and_then(|s| s.to_str()) {
        let parts: Vec<&str> = file_name.splitn(4, ' ').collect();
        if parts.len() != 4 {
            return None;
        }

        return Some(FileMetadata {
            file_name: path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .into(),
            full_path: path.to_string_lossy().into(), // Сохраняем полный путь
            title: parts[3].to_string(),
        });
    }
    None
}
