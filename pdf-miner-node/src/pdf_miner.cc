#include <napi.h>
#include <string>
#include <cstdlib>
#include <fstream>
#include <sstream>

namespace {
    std::string getTempFilePath(const std::string& suffix) {
        char tmpPathBuf[L_tmpnam];
        std::tmpnam(tmpPathBuf);
        std::string tmpPath = tmpPathBuf;
        return tmpPath + suffix;
    }
}

Napi::Value ExtractText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsString()) {
        Napi::TypeError::New(env, "First argument must be a string").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string filePath = info[0].As<Napi::String>().Utf8Value();
    std::string outputPath = getTempFilePath(".txt");
    
    // Find the location of the miner.py script
    std::string scriptDir = __FILE__;
    size_t lastSlash = scriptDir.find_last_of("/\\");
    scriptDir = scriptDir.substr(0, lastSlash);
    lastSlash = scriptDir.find_last_of("/\\");
    scriptDir = scriptDir.substr(0, lastSlash + 1);
    std::string scriptPath = scriptDir + "miner.py";
    
    // Run the Python script with the file path and output path
    std::string command = "python3 \"" + scriptPath + "\" \"" + filePath + "\" \"" + outputPath + "\"";
    int result = std::system(command.c_str());
    
    if (result != 0) {
        Napi::Error::New(env, "Failed to extract text from PDF").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // Read the output file
    std::ifstream outputFile(outputPath);
    if (!outputFile.is_open()) {
        Napi::Error::New(env, "Failed to open output file").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::stringstream buffer;
    buffer << outputFile.rdbuf();
    std::string text = buffer.str();
    
    // Clean up temporary file
    outputFile.close();
    std::remove(outputPath.c_str());
    
    return Napi::String::New(env, text);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(
        Napi::String::New(env, "extractText"),
        Napi::Function::New(env, ExtractText)
    );
    return exports;
}

NODE_API_MODULE(pdf_miner, Init) 