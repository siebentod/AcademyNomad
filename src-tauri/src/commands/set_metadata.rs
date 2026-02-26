// Set metadata command

use tauri::command;

use super::utils::set_creator::set_creator;

#[command]
pub fn set_metadata(file_path: String) -> String {
    set_creator(&file_path).unwrap_or_default()
}
