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

#include "os/elevate.h"

static std::wstring JoinArguments(std::vector<std::wstring> arguments) {
  std::wostringstream result;

  std::copy(arguments.begin(), arguments.end(),
            std::ostream_iterator<std::wstring, wchar_t>(result, L" "));

  return result.str();
}

// Make sure to delete the result after you're done
// with it by calling `delete[] result;`.
// See http://stackoverflow.com/a/1201471
static LPCWSTR ConvertStringToLPCWSTR(const std::wstring &string) {
  wchar_t *result = new wchar_t[string.size() + 1];
  std::copy(string.begin(), string.end(), result);
  result[string.size()] = 0;
  return result;
}

etcher::ELEVATE_RESULT etcher::Elevate(const std::wstring &command,
                                       std::vector<std::wstring> arguments) {
  // Initialize the SHELLEXECUTEINFO structure. We zero it out
  // in order to be on the safe side, and set cbSize to the size
  // of the structure as recommend by MSDN
  // See: https://msdn.microsoft.com/en-us/library/windows/desktop/bb759784(v=vs.85).aspx
  SHELLEXECUTEINFOW shellExecuteInfo;
  ZeroMemory(&shellExecuteInfo, sizeof(shellExecuteInfo));
  shellExecuteInfo.cbSize = sizeof(SHELLEXECUTEINFOW);

  // Flags that indicate the content and validity of the other structure member.
  shellExecuteInfo.fMask =

      // Used to indicate that the hProcess member receives the process handle.
      // This handle is typically used to allow an application to find out
      // when a process created with ShellExecuteEx terminates.
      SEE_MASK_NOCLOSEPROCESS |

      // Wait for the execute operation to complete before returning.
      SEE_MASK_NOASYNC |

      // Do not display an error message box if an error occurs.
      SEE_MASK_FLAG_NO_UI;

  // The action to be performed.
  shellExecuteInfo.lpVerb = L"runas";

  // Run the file in the background
  shellExecuteInfo.nShow = SW_HIDE;

  // Use the current directory as the working directory
  shellExecuteInfo.lpDirectory = NULL;

  // Set file and parameters
  // We can't just assign the result of `.c_str()`, since
  // that pointer is owned by the `std::wstring` instance,
  // and will not be safe after the instance is destroyed.
  LPCWSTR file = ConvertStringToLPCWSTR(command);
  LPCWSTR argv = ConvertStringToLPCWSTR(JoinArguments(arguments));
  shellExecuteInfo.lpFile = file;
  shellExecuteInfo.lpParameters = argv;

  BOOL executeResult = ShellExecuteExW(&shellExecuteInfo);

  delete[] file;
  delete[] argv;

  // Finally, let's try to elevate the command
  if (!executeResult) {
    DWORD executeError = GetLastError();

    // We map Windows error codes to our own enum class
    // so we can normalize all Windows error handling mechanisms.
    switch (executeError) {
    case ERROR_FILE_NOT_FOUND:
      return etcher::ELEVATE_RESULT::ELEVATE_FILE_NOT_FOUND;
    case ERROR_PATH_NOT_FOUND:
      return etcher::ELEVATE_RESULT::ELEVATE_PATH_NOT_FOUND;
    case ERROR_DDE_FAIL:
      return etcher::ELEVATE_RESULT::ELEVATE_DDE_FAIL;
    case ERROR_NO_ASSOCIATION:
      return etcher::ELEVATE_RESULT::ELEVATE_NO_ASSOCIATION;
    case ERROR_ACCESS_DENIED:
      return etcher::ELEVATE_RESULT::ELEVATE_ACCESS_DENIED;
    case ERROR_DLL_NOT_FOUND:
      return etcher::ELEVATE_RESULT::ELEVATE_DLL_NOT_FOUND;
    case ERROR_CANCELLED:
      return etcher::ELEVATE_RESULT::ELEVATE_CANCELLED;
    case ERROR_NOT_ENOUGH_MEMORY:
      return etcher::ELEVATE_RESULT::ELEVATE_NOT_ENOUGH_MEMORY;
    case ERROR_SHARING_VIOLATION:
      return etcher::ELEVATE_RESULT::ELEVATE_SHARING_VIOLATION;
    default:
      return etcher::ELEVATE_RESULT::ELEVATE_UNKNOWN_ERROR;
    }
  }

  // Since we passed SEE_MASK_NOCLOSEPROCESS, the
  // process handle is accessible from hProcess.
  if (shellExecuteInfo.hProcess) {
    // Wait for the process to exit before continuing.
    // See: https://msdn.microsoft.com/en-us/library/windows/desktop/ms687032(v=vs.85).aspx
    WaitForSingleObject(shellExecuteInfo.hProcess, INFINITE);

    if (!CloseHandle(shellExecuteInfo.hProcess)) {
      return etcher::ELEVATE_RESULT::ELEVATE_UNKNOWN_ERROR;
    }
  }

  return etcher::ELEVATE_RESULT::ELEVATE_SUCCESS;
}

std::string
etcher::ElevateResultToString(const etcher::ELEVATE_RESULT &result) {
  switch (result) {
  case etcher::ELEVATE_RESULT::ELEVATE_SUCCESS:
    return "Success";
  case etcher::ELEVATE_RESULT::ELEVATE_CANCELLED:
    return "The user cancelled the elevation request";
  case etcher::ELEVATE_RESULT::ELEVATE_FILE_NOT_FOUND:
    return "The specified file was not found";
  case etcher::ELEVATE_RESULT::ELEVATE_PATH_NOT_FOUND:
    return "The specified path was not found";
  case etcher::ELEVATE_RESULT::ELEVATE_DDE_FAIL:
    return "The Dynamic Data Exchange (DDE) transaction failed";
  case etcher::ELEVATE_RESULT::ELEVATE_NO_ASSOCIATION:
    return "There is no application associated with the "
           "specified file name extension";
  case etcher::ELEVATE_RESULT::ELEVATE_ACCESS_DENIED:
    return "Access to the specified file is denied";
  case etcher::ELEVATE_RESULT::ELEVATE_DLL_NOT_FOUND:
    return "One of the library files necessary to run the "
           "application can't be found";
  case etcher::ELEVATE_RESULT::ELEVATE_NOT_ENOUGH_MEMORY:
    return "There is not enough memory to perform the specified action";
  case etcher::ELEVATE_RESULT::ELEVATE_SHARING_VIOLATION:
    return "A sharing violation occurred";
  default:
    return "Unknown error";
  }
}
