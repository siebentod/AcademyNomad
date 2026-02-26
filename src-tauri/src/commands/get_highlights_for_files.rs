// Get highlights for files command

use tauri::command;

use super::types::FileResult;
use super::utils::get_file_highlights::get_file_highlights;
use super::utils::get_file_info::get_file_info;

// Эта функция всегда выдает все файлы в таком же порядке, даже если хайлайтов нет !
#[command]
pub async fn get_highlights_for_files(paths: Vec<String>) -> Result<Vec<FileResult>, String> {
    if paths.is_empty() {
        return Ok(Vec::new());
    }

    let mut results = Vec::with_capacity(paths.len());

    for path in paths {
        let path_ref = std::path::Path::new(&path);
        
        let file_name = path_ref
            .file_name()
            .map(|s| s.to_string_lossy().into_owned())
            .unwrap_or_default();
        
        let file_stem = path_ref
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or_default();
        
        let title = file_stem.to_string();
        
        let extension = path_ref
            .extension()
            .and_then(|s| s.to_str())
            .map(|s| s.to_lowercase());

        let info = get_file_info(&path);
        
        let highlights = match get_file_highlights(&path) {
            Ok(hl) => Some(hl),
            Err(_) => Some(Vec::new()),
        };

        results.push(FileResult {
            file_name,
            full_path: path.clone(),
            title,
            size: None,
            created_date: String::new(),
            modified_date: String::new(),
            extension,
            is_locked: info.is_locked,
            id: info.file_id,
            pdf_title: info.pdf_title,
            pdf_author: info.pdf_author,
            pdf_creator: info.pdf_creator,
            highlights,
        });
    }

    Ok(results)
}
