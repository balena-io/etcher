#ifndef SRC_OS_ELEVATE_H_
#define SRC_OS_ELEVATE_H_

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

#ifdef _WIN32

// Fix winsock.h redefinition errors
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif

// Note that windows.h has to be included before any
// other Windows library to avoid declaration issues
#include <windows.h>
#include <shellapi.h>

#endif

#include <algorithm>
#include <iterator>
#include <sstream>
#include <string>
#include <vector>

namespace etcher {

enum class ELEVATE_RESULT {
  ELEVATE_SUCCESS,
  ELEVATE_FILE_NOT_FOUND,
  ELEVATE_PATH_NOT_FOUND,
  ELEVATE_DDE_FAIL,
  ELEVATE_NO_ASSOCIATION,
  ELEVATE_ACCESS_DENIED,
  ELEVATE_DLL_NOT_FOUND,
  ELEVATE_CANCELLED,
  ELEVATE_NOT_ENOUGH_MEMORY,
  ELEVATE_SHARING_VIOLATION,
  ELEVATE_UNKNOWN_ERROR
};

ELEVATE_RESULT Elevate(const std::wstring &command,
                       std::vector<std::wstring> arguments);

std::string ElevateResultToString(const ELEVATE_RESULT &result);

}  // namespace etcher

#endif  // SRC_OS_ELEVATE_H_
