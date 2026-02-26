// Everything search command

use tauri::command;

use super::types::{SearchParams, SearchResult};
use super::utils::everything_search::everything_search;

#[command]
pub async fn get_everything(params: SearchParams) -> Result<SearchResult, String> {
    if params.query.trim().is_empty() {
        return Ok(SearchResult {
            items: Vec::new(),
            has_more: false,
        });
    }

    match everything_search(&params, false).await {
        Some((items, has_more)) => Ok(SearchResult { items, has_more }),
        None => Err("Ошибка выполнения поиска".to_string()),
    }
}
