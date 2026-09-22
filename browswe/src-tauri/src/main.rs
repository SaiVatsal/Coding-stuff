// main.rs — Desktop entry point
//
// The #[cfg_attr] hides the console window on release builds (Windows).
// All actual setup lives in lib.rs so the library can also be used from tests.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    april_browser::run();
}
