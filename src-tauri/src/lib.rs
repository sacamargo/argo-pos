use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

const DB_FILE: &str = "argo-pos.db";
const BACKUPS_DIR: &str = "backups";
const IMAGES_DIR: &str = "images";
const MAX_IMAGE_BYTES: usize = 5 * 1024 * 1024;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BackupFileInfo {
    path: String,
    file_name: String,
    size_bytes: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProductImageInfo {
    file_name: String,
    path: String,
    size_bytes: u64,
}

fn app_config_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map_err(|error| format!("No se pudo resolver AppConfig: {error}"))
}

fn db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app_config_dir(app)?.join(DB_FILE))
}

fn backups_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app_config_dir(app)?.join(BACKUPS_DIR);
    fs::create_dir_all(&dir).map_err(|error| format!("No se pudo crear carpeta de backups: {error}"))?;
    Ok(dir)
}

fn images_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app_config_dir(app)?.join(IMAGES_DIR);
    fs::create_dir_all(&dir).map_err(|error| format!("No se pudo crear carpeta de imágenes: {error}"))?;
    Ok(dir)
}

fn normalize_image_extension(extension: &str) -> Result<&'static str, String> {
    match extension.trim().trim_start_matches('.').to_ascii_lowercase().as_str() {
        "jpg" | "jpeg" => Ok("jpg"),
        "png" => Ok("png"),
        "webp" => Ok("webp"),
        "gif" => Ok("gif"),
        _ => Err("Formato de imagen no soportado (usa jpg, png, webp o gif)".into()),
    }
}

fn is_safe_image_name(file_name: &str) -> bool {
    let bytes = file_name.as_bytes();
    if bytes.is_empty() || bytes.len() > 120 {
        return false;
    }
    let Some((stem, ext)) = file_name.rsplit_once('.') else {
        return false;
    };
    if normalize_image_extension(ext).is_err() {
        return false;
    }
    !stem.is_empty()
        && stem
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || ch == '-' || ch == '_')
}

fn is_safe_backup_name(file_name: &str) -> bool {
    let bytes = file_name.as_bytes();
    if bytes.is_empty() || bytes.len() > 120 {
        return false;
    }
    if !file_name.ends_with(".db") {
        return false;
    }
    file_name
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' || ch == '.')
}

fn remove_sidecar(path: &Path) {
    let _ = fs::remove_file(path);
}

#[tauri::command]
fn create_sqlite_backup(app: tauri::AppHandle, file_name: String) -> Result<BackupFileInfo, String> {
    if !is_safe_backup_name(&file_name) {
        return Err("Nombre de backup inválido".into());
    }

    let source = db_path(&app)?;
    if !source.exists() {
        return Err("No se encontró la base de datos para respaldar".into());
    }

    let dest = backups_dir(&app)?.join(&file_name);
    if dest.exists() {
        return Err("Ya existe un backup con ese nombre".into());
    }

    fs::copy(&source, &dest).map_err(|error| format!("No se pudo copiar el backup: {error}"))?;

    let size_bytes = fs::metadata(&dest)
        .map(|meta| meta.len())
        .unwrap_or(0);

    Ok(BackupFileInfo {
        path: dest.to_string_lossy().into_owned(),
        file_name,
        size_bytes,
    })
}

#[tauri::command]
fn restore_sqlite_backup(app: tauri::AppHandle, backup_path: String) -> Result<(), String> {
    let backups = backups_dir(&app)?;
    let source = PathBuf::from(&backup_path);
    let canonical_backups = backups
        .canonicalize()
        .map_err(|error| format!("No se pudo validar carpeta de backups: {error}"))?;
    let canonical_source = source
        .canonicalize()
        .map_err(|error| format!("Backup no encontrado: {error}"))?;

    if !canonical_source.starts_with(&canonical_backups) {
        return Err("La ruta del backup está fuera de la carpeta permitida".into());
    }

    let config = app_config_dir(&app)?;
    let target = config.join(DB_FILE);

    remove_sidecar(&config.join(format!("{DB_FILE}-wal")));
    remove_sidecar(&config.join(format!("{DB_FILE}-shm")));

    fs::copy(&canonical_source, &target)
        .map_err(|error| format!("No se pudo restaurar el backup: {error}"))?;

    Ok(())
}

#[tauri::command]
fn save_product_image(
    app: tauri::AppHandle,
    file_name: String,
    bytes: Vec<u8>,
) -> Result<ProductImageInfo, String> {
    if bytes.is_empty() {
        return Err("La imagen está vacía".into());
    }
    if bytes.len() > MAX_IMAGE_BYTES {
        return Err("La imagen supera el máximo de 5 MB".into());
    }
    if !is_safe_image_name(&file_name) {
        return Err("Nombre de imagen inválido".into());
    }

    let dest = images_dir(&app)?.join(&file_name);
    if dest.exists() {
        return Err("Ya existe una imagen con ese nombre".into());
    }

    fs::write(&dest, &bytes).map_err(|error| format!("No se pudo guardar la imagen: {error}"))?;

    Ok(ProductImageInfo {
        file_name,
        path: dest.to_string_lossy().into_owned(),
        size_bytes: bytes.len() as u64,
    })
}

#[tauri::command]
fn resolve_product_image(app: tauri::AppHandle, file_name: String) -> Result<String, String> {
    if !is_safe_image_name(&file_name) {
        return Err("Nombre de imagen inválido".into());
    }

    let images = images_dir(&app)?;
    let path = images.join(&file_name);
    let canonical_images = images
        .canonicalize()
        .map_err(|error| format!("No se pudo validar carpeta de imágenes: {error}"))?;
    let canonical_path = path
        .canonicalize()
        .map_err(|error| format!("Imagen no encontrada: {error}"))?;

    if !canonical_path.starts_with(&canonical_images) {
        return Err("La ruta de la imagen está fuera de la carpeta permitida".into());
    }

    Ok(canonical_path.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "bootstrap_core",
            sql: include_str!("../migrations/0000_bootstrap_core.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "schema_core_mvp",
            sql: include_str!("../migrations/0001_schema_core_mvp.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "catalog_codes_fulfillment",
            sql: include_str!("../migrations/0002_catalog_codes_fulfillment.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:argo-pos.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            create_sqlite_backup,
            restore_sqlite_backup,
            save_product_image,
            resolve_product_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
