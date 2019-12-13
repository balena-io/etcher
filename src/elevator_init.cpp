/*
 * Copyright 2017 balena.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <string>
#include <vector>

#include "os/elevate.h"
#include "utils/v8utils.h"

class ElevateWorker : public Nan::AsyncWorker {
 public:
  ElevateWorker(Nan::Callback *callback,
                const std::vector<std::wstring> &arguments)
    : Nan::AsyncWorker(callback) {
    this->arguments = arguments;
  }

  ~ElevateWorker() {}

  void Execute() {
    etcher::ELEVATE_RESULT result = etcher::Elevate(
      this->arguments.front(),
      std::vector<std::wstring>(this->arguments.begin() + 1,
                                this->arguments.end()));

    switch (result) {
    case etcher::ELEVATE_RESULT::ELEVATE_SUCCESS:
      cancelled = false;
      break;
    case etcher::ELEVATE_RESULT::ELEVATE_CANCELLED:
      cancelled = true;
      break;
    default:
      this->SetErrorMessage(etcher::ElevateResultToString(result).c_str());
    }
  }

  void HandleOKCallback() {
    v8::Local<v8::Object> results = Nan::New<v8::Object>();
    Nan::Set(results, Nan::New<v8::String>("cancelled").ToLocalChecked(),
      this->cancelled ? Nan::True() : Nan::False());
    v8::Local<v8::Value> argv[2] = { Nan::Null(), results };
    callback->Call(2, argv);
  }

 private:
  std::vector<std::wstring> arguments;
  v8::Local<v8::Object> results;
  bool cancelled;
};

NAN_METHOD(elevate) {
  if (!info[0]->IsArray()) {
    return Nan::ThrowError("This function expects an array");
  }

  if (!info[1]->IsFunction()) {
    return Nan::ThrowError("Callback must be a function");
  }

  std::vector<std::wstring> arguments =
      etcher::v8utils::GetArguments(info[0].As<v8::Array>());
  Nan::Callback *callback = new Nan::Callback(info[1].As<v8::Function>());
  Nan::AsyncQueueWorker(new ElevateWorker(callback, arguments));
  info.GetReturnValue().SetUndefined();
}

NAN_MODULE_INIT(ElevatorInit) { NAN_EXPORT(target, elevate); }

NODE_MODULE(elevator, ElevatorInit)
