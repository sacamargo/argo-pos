use tauri_plugin_sql::{Migration, MigrationKind};

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
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:argo-pos.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
