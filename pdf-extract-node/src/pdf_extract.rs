use napi::bindgen_prelude::*;
use napi_derive::napi;
use pdf_extract::extract_text;
use napi::Task;

#[derive(Clone)]
pub struct ExtractTextTask {
    path: String,
}

impl Task for ExtractTextTask {
    type Output = String;
    type JsValue = String;

    fn compute(&mut self) -> napi::Result<Self::Output> {
        extract_text(&self.path)
            .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to extract text: {}", e)))
    }

    fn resolve(&mut self, _env: napi::Env, output: Self::Output) -> napi::Result<Self::JsValue> {
        Ok(output)
    }
}

#[derive(Clone)]
pub struct ExtractTextFromBufferTask {
    buffer: Vec<u8>,
}

impl Task for ExtractTextFromBufferTask {
    type Output = String;
    type JsValue = String;

    fn compute(&mut self) -> napi::Result<Self::Output> {
        let temp_dir = std::env::temp_dir();
        let temp_file = temp_dir.join(format!("pdf_{}.pdf", uuid::Uuid::new_v4()));
        
        std::fs::write(&temp_file, &self.buffer)
            .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to write temp file: {}", e)))?;
        
        let result = extract_text(temp_file.to_str().unwrap())
            .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to extract text: {}", e)));
        
        let _ = std::fs::remove_file(temp_file);
        
        result
    }

    fn resolve(&mut self, _env: napi::Env, output: Self::Output) -> napi::Result<Self::JsValue> {
        Ok(output)
    }
}

#[napi]
pub fn extract_text_from_file(path: String) -> Result<String> {
    extract_text(&path)
        .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to extract text: {}", e)))
}

#[napi(ts_return_type = "Promise<string>")]
pub fn extract_text_from_file_async(path: String) -> AsyncTask<ExtractTextTask> {
    AsyncTask::new(ExtractTextTask { path })
}

#[napi]
pub fn extract_text_from_buffer(buffer: Buffer) -> Result<String> {
    let temp_dir = std::env::temp_dir();
    let temp_file = temp_dir.join(format!("pdf_{}.pdf", uuid::Uuid::new_v4()));
    
    std::fs::write(&temp_file, buffer.to_vec())
        .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to write temp file: {}", e)))?;
    
    let result = extract_text(temp_file.to_str().unwrap())
        .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to extract text: {}", e)));
    
    let _ = std::fs::remove_file(temp_file);
    
    result
}

#[napi(ts_return_type = "Promise<string>")]
pub fn extract_text_from_buffer_async(buffer: Buffer) -> AsyncTask<ExtractTextFromBufferTask> {
    AsyncTask::new(ExtractTextFromBufferTask {
        buffer: buffer.to_vec(),
    })
}
