// модуль, который связывает и реэкспортирует команды и типы

pub mod watcher_commands;
pub mod get_everything;
pub mod get_everything_with_meta;
pub mod get_highlights_for_files;
pub mod edit_filename;
pub mod open_file;
pub mod show_in_explorer;
pub mod open_file_with;
pub mod set_metadata;
pub mod delete_file;
pub mod types;

pub use watcher_commands::*;
pub use get_everything::*;
pub use get_everything_with_meta::*;
pub use get_highlights_for_files::*;
pub use edit_filename::*;
pub use open_file::*;
pub use show_in_explorer::*;
pub use open_file_with::*;
pub use set_metadata::*;
pub use delete_file::*;

mod utils;
