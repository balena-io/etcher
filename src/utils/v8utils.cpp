/*
 * Copyright 2017 resin.io
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

#include "utils/v8utils.h"

std::vector<std::string>
etcher::v8utils::GetArguments(v8::Local<v8::Array> arguments) {
  std::vector<std::string> result(0);

  for (uint32_t index = 0; index < arguments->Length(); index++) {
    std::string argument(
        *v8::String::Utf8Value(arguments->Get(index)->ToString()));
    result.push_back(argument);
  }

  return result;
}
