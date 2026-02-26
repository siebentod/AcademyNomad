use anyhow::{Context, Result};
use rand::{distributions::Alphanumeric, Rng};
use std::path::Path;
use std::io::Write;
use xmp_toolkit::{xmp_ns::XMP, OpenFileOptions, XmpFile, XmpMeta, XmpValue};

pub fn set_creator(file_path: &str) -> Result<String> {
    println!("=== Starting set_creator for: {}", file_path);
    
    let path = Path::new(file_path);
    let mut xmp_file = XmpFile::new()?;

    // Try to open and read existing metadata
    println!("Opening file for reading...");
    let open_result = xmp_file.open_file(
        path,
        OpenFileOptions::default().use_packet_scanning(),
    );

    let current_creator = if open_result.is_ok() {
        // File opened, try to read existing metadata
        if let Some(xmp_meta) = xmp_file.xmp() {
            println!("XMP metadata found");
            let creator = xmp_meta
                .property(XMP, "CreatorTool")
                .map(|p| p.value.to_string())
                .unwrap_or_default();
            
            xmp_file.close();
            
            if creator.starts_with("id_") {
                println!("Found existing ID: {}", creator);
                return Ok(creator);
            }
            creator
        } else {
            println!("No XMP metadata in file");
            xmp_file.close();
            String::new()
        }
    } else {
        println!("Could not open file for reading XMP");
        String::new()
    };

    println!("Need to create new ID");
    
    // Generate new ID
    let id: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(12)
        .map(char::from)
        .collect();
    let new_creator = format!("id_{}", id);
    
    println!("Generated ID: {}", new_creator);

    // Try using exiftool as fallback
    println!("Attempting to write using exiftool...");
    let output = std::process::Command::new("exiftool")
        .arg("-overwrite_original")
        .arg(format!("-xmp:CreatorTool={}", new_creator))
        .arg(file_path)
        .output();

    match output {
        Ok(result) => {
            if result.status.success() {
                println!("Successfully wrote metadata using exiftool");
                return Ok(new_creator);
            } else {
                let stderr = String::from_utf8_lossy(&result.stderr);
                println!("exiftool failed: {}", stderr);
            }
        }
        Err(e) => {
            println!("exiftool not available: {}", e);
        }
    }

    // If exiftool failed, try lopdf approach
    println!("Falling back to lopdf...");
    set_creator_with_lopdf(file_path, &new_creator)
}

fn set_creator_with_lopdf(file_path: &str, creator_id: &str) -> Result<String> {
    use lopdf::{Document, Object, Dictionary};
    
    println!("Loading PDF with lopdf...");
    let mut doc = Document::load(file_path)
        .with_context(|| format!("Failed to load PDF: {}", file_path))?;
    
    println!("PDF loaded successfully");
    
    // Get or create Info dictionary
    let info_id = if let Ok(info_ref) = doc.trailer.get(b"Info") {
        if let Object::Reference(id) = info_ref {
            *id
        } else {
            // Create new info dictionary
            let mut info = Dictionary::new();
            info.set("Creator", Object::String(creator_id.as_bytes().to_vec(), lopdf::StringFormat::Literal));
            doc.add_object(info)
        }
    } else {
        // Create new info dictionary
        let mut info = Dictionary::new();
        info.set("Creator", Object::String(creator_id.as_bytes().to_vec(), lopdf::StringFormat::Literal));
        let info_id = doc.add_object(info);
        doc.trailer.set("Info", Object::Reference(info_id));
        info_id
    };
    
    // Update the Creator field
    if let Ok(Object::Dictionary(ref mut info)) = doc.get_object_mut(info_id) {
        println!("Setting Creator field in PDF Info dictionary");
        info.set("Creator", Object::String(creator_id.as_bytes().to_vec(), lopdf::StringFormat::Literal));
    }
    
    println!("Saving PDF...");
    doc.save(file_path)
        .with_context(|| format!("Failed to save PDF: {}", file_path))?;
    
    println!("PDF saved successfully with ID: {}", creator_id);
    Ok(creator_id.to_string())
}