#[macro_use]
extern crate napi_derive;

mod pdf_extract;

use napi::bindgen_prelude::*;

#[napi]
pub fn init() -> Result<()> {
    Ok(())
}
