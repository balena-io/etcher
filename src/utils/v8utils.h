#ifndef SRC_UTILS_V8UTILS_H_
#define SRC_UTILS_V8UTILS_H_

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

#include <nan.h>
#include <string>
#include <vector>
#include <codecvt>

namespace etcher {
namespace v8utils {
std::vector<std::wstring> GetArguments(v8::Local<v8::Array> arguments);
}  // namespace v8utils
}  // namespace etcher

#define YIELD_ERROR(CALLBACK, ERROR)                                           \
  {                                                                            \
    const wchar_t *message = (ERROR).c_str();                                  \
    v8::Local<v8::Value> argv[1] = {                                           \
      Nan::Error(v8::String::NewFromTwoByte(isolate,                           \
                                            (const uint16_t *)message))        \
    };                                                                         \
    Nan::MakeCallback(Nan::GetCurrentContext()->Global(), (CALLBACK),          \
                      1, argv);                                                \
  }                                                                            \
  return;

#define YIELD_OBJECT(CALLBACK, OBJECT)                                         \
  {                                                                            \
    v8::Local<v8::Value> argv[2] = {Nan::Null(), (OBJECT)};                    \
    Nan::MakeCallback(Nan::GetCurrentContext()->Global(), (CALLBACK), 2,       \
                      argv);                                                   \
  }                                                                            \
  return;

#define YIELD_NOTHING(CALLBACK)                                                \
  Nan::MakeCallback(Nan::GetCurrentContext()->Global(), (CALLBACK), 0, 0);

#define NAN_SET_FUNCTION(JSSYMBOL, FUNCTION)                                   \
  Nan::Set(target, Nan::New((JSSYMBOL)).ToLocalChecked(),                      \
           Nan::GetFunction(Nan::New<v8::FunctionTemplate>((FUNCTION)))        \
               .ToLocalChecked());

#endif  // SRC_UTILS_V8UTILS_H_
