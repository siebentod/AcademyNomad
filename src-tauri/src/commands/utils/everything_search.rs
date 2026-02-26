// Shared search functionality for everything commands

use chrono::{DateTime, TimeZone, Utc};
use everything_rs::{Everything, EverythingRequestFlags, EverythingSort};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;
use tokio::time::{sleep, timeout};

use super::filetime_to_datetime::filetime_to_datetime;
use super::get_file_info::get_file_info;
use super::get_file_highlights::get_file_highlights;
use super::get_file_info_all_meta::get_file_info_all_meta;
use crate::commands::types::{SearchParams, FileResult};

lazy_static::lazy_static! {
    pub static ref EVERYTHING_LOCK: Arc<Mutex<()>> = Arc::new(Mutex::new(()));
    pub static ref LAST_SEARCH_TIME: Arc<Mutex<Option<Instant>>> = Arc::new(Mutex::new(None));
}

// Второй параметр false -> быстрый поиск без метаданных, true - с метаданными
// Возвращает (Vec<FileResult>, bool) где bool это has_more
pub async fn everything_search(params: &SearchParams, use_full_meta: bool) -> Option<(Vec<FileResult>, bool)> {
    const MIN_SEARCH_INTERVAL_MS: u64 = 50;
    const MAX_TOTAL_HIGHLIGHT_SEARCHES: u32 = 9;
    const MAX_FILES_WITH_HIGHLIGHTS: usize = 6;
    const DEFAULT_RESULTS_COUNT: u32 = 20;

    let include_highlights = use_full_meta || params.include_highlights.unwrap_or(false);
    let max_results = params.count.unwrap_or(DEFAULT_RESULTS_COUNT);

    let sleep_duration = {
        let last_time = LAST_SEARCH_TIME.lock().await;
        if let Some(last) = *last_time {
            let elapsed = last.elapsed();
            if elapsed < Duration::from_millis(MIN_SEARCH_INTERVAL_MS) {
                Some(Duration::from_millis(MIN_SEARCH_INTERVAL_MS) - elapsed)
            } else {
                None
            }
        } else {
            None
        }
    };

    if let Some(duration) = sleep_duration {
        sleep(duration).await;
    }

    let result = {
        // Пытаемся получить блокировку с таймаутом 5 секунд
        let lock_result = timeout(Duration::from_secs(5), EVERYTHING_LOCK.lock()).await;
        let _lock = match lock_result {
            Ok(lock) => lock,
            Err(_) => return None,
        };

        {
            let mut last_time = LAST_SEARCH_TIME.lock().await;
            *last_time = Some(Instant::now());
        }

        let everything = Everything::new();
        everything.set_search(params.query.as_str());

        if include_highlights {
            // Set the request flags for the search
            everything.set_request_flags(
                EverythingRequestFlags::FullPathAndFileName
                    | EverythingRequestFlags::DateCreated
                    | EverythingRequestFlags::DateModified
                    | EverythingRequestFlags::Size
                    | EverythingRequestFlags::Extension
                    | EverythingRequestFlags::FileListFileName,
            );
            everything.set_sort(EverythingSort::DateModifiedDescending);
            // Запрашиваем на 1 больше для проверки has_more
            everything.set_max_results(max_results + 1);

            if let Err(e) = everything.query() {
                eprintln!("Ошибка запроса: {}", e);
                return None;
            }

            let num_results = everything.get_result_count();
            let has_more = num_results > max_results;
            // Ограничиваем количество результатов до max_results
            let items_count = num_results.min(max_results);
            
            let mut files_with_highlights = 0;
            let mut files_searched_for_highlights = 0;
            let mut should_search_highlights = true;

            let results: Vec<FileResult> = (0..items_count)
                .filter_map(|idx| {
                    if let Ok(path) = everything.get_result_full_path(idx) {
                        use std::path::Path;

                        let path_ref = Path::new(&path);
                        let file_name = path_ref
                            .file_name()
                            .map(|s| s.to_string_lossy().into_owned())
                            .unwrap_or_default();
                        let file_stem = path_ref
                            .file_stem()
                            .and_then(|s| s.to_str())
                            .unwrap_or_default();
                        let title = file_stem.to_string();

                        let info = if use_full_meta {
                            get_file_info_all_meta(&path)
                        } else {
                            get_file_info(&path)
                        };

                        // Определяем, нужно ли искать хайлайты в этом файле
                        let highlights = if should_search_highlights {
                            files_searched_for_highlights += 1;
                            
                            match get_file_highlights(&path) {
                                Ok(hl) => {
                                    if !hl.is_empty() {
                                        files_with_highlights += 1;
                                    }
                                    
                                    // Проверяем условия остановки поиска хайлайтов
                                    if files_with_highlights >= MAX_FILES_WITH_HIGHLIGHTS 
                                        || files_searched_for_highlights >= MAX_TOTAL_HIGHLIGHT_SEARCHES {
                                        should_search_highlights = false;
                                    }
                                    
                                    Some(hl)
                                }
                                Err(_) => {
                                    // Если не удалось получить хайлайты, возвращаем пустой массив
                                    Some(Vec::new())
                                }
                            }
                        } else {
                            // Хайлайты не ищем - None означает, что поиск не проводился
                            None
                        };

                        Some(FileResult {
                            file_name,
                            full_path: path.clone(),
                            title: title.to_string(),
                            size: everything.get_result_size(idx).ok(),
                            created_date: everything
                                .get_result_created_date(idx)
                                .ok()
                                .map_or(String::new(), filetime_to_datetime),
                            modified_date: everything
                                .get_result_count_modified_date(idx)
                                .ok()
                                .map_or(String::new(), filetime_to_datetime),
                            extension: everything.get_result_extension(idx).ok(),
                            is_locked: info.is_locked,
                            id: info.file_id,
                            pdf_title: info.pdf_title,
                            pdf_author: info.pdf_author,
                            pdf_creator: info.pdf_creator,
                            highlights,
                        })
                    } else {
                        None
                    }
                })
                .collect();

            Some((results, has_more))
        } else {
            // Original logic for when highlights are not needed
            // Запрашиваем на 1 больше для проверки has_more
            everything.set_max_results(max_results + 1);
            everything.set_request_flags(
                EverythingRequestFlags::FullPathAndFileName
                    | EverythingRequestFlags::DateCreated
                    | EverythingRequestFlags::DateModified
                    | EverythingRequestFlags::Size
                    | EverythingRequestFlags::Extension
                    | EverythingRequestFlags::FileListFileName,
            );
            everything.set_sort(EverythingSort::DateModifiedDescending);

            if let Err(e) = everything.query() {
                eprintln!("Ошибка запроса: {}", e);
                return None;
            }

            let num_results = everything.get_result_count();
            let has_more = num_results > max_results;
            // Ограничиваем количество результатов до max_results
            let items_count = num_results.min(max_results);
            
            let results: Vec<FileResult> = (0..items_count)
                .filter_map(|idx| {
                    if let Ok(path) = everything.get_result_full_path(idx) {
                        use std::path::Path;

                        let path_ref = Path::new(&path);
                        let file_name = path_ref
                            .file_name()
                            .map(|s| s.to_string_lossy().into_owned())
                            .unwrap_or_default();
                        let file_stem = path_ref
                            .file_stem()
                            .and_then(|s| s.to_str())
                            .unwrap_or_default();
                        let title = file_stem.to_string();

                        let info = if use_full_meta {
                            get_file_info_all_meta(&path)
                        } else {
                            get_file_info(&path)
                        };

                        let highlights = if include_highlights {
                            get_file_highlights(&path).ok()
                        } else {
                            None
                        };

                        Some(FileResult {
                            file_name,
                            full_path: path.clone(),
                            title: title.to_string(),
                            size: everything.get_result_size(idx).ok(),
                            created_date: everything
                                .get_result_created_date(idx)
                                .ok()
                                .map_or(String::new(), filetime_to_datetime),
                            modified_date: everything
                                .get_result_count_modified_date(idx)
                                .ok()
                                .map_or(String::new(), filetime_to_datetime),
                            extension: everything.get_result_extension(idx).ok(),
                            is_locked: info.is_locked,
                            id: info.file_id,
                            pdf_title: info.pdf_title,
                            pdf_author: info.pdf_author,
                            pdf_creator: info.pdf_creator,
                            highlights,
                        })
                    } else {
                        None
                    }
                })
                .collect();

            Some((results, has_more))
        }
    };

    sleep(Duration::from_millis(10)).await;

    result
}
