#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <signal.h>
#include <windows.h>

char *getInfoPath()
{
  // Get the binary path
  char self[MAX_PATH];
  int selflen = GetModuleFileName(NULL, self, sizeof self);

  char const *ext = ".info";
  int extlen = strlen(ext);

  // Add the .info extension
  char *def = calloc(selflen + extlen + 1, 1);
  strcpy(def, self);
  strcpy(def + selflen, ext);

  return def;
}

void parseArguments(char *source, char *commandLine, long *commandIndex, char prepass)
{
  long index = (*commandIndex);

  {
    if (!prepass)
    {
      commandLine[index] = '"';
    }
    index++;
  }

  long i = 0;
  do
  {
    switch (source[i])
    {
    case '\0':
      if (!prepass)
      {
        commandLine[index] = '"';
      }
      (*commandIndex) = ++index;
      return;
    case '\n':
      if (!prepass)
      {
        commandLine[index + 0] = '"';
        commandLine[index + 1] = ' ';
        commandLine[index + 2] = '"';
      }
      index += 3;
      break;
    case '"':
      if (!prepass)
      {
        commandLine[index + 0] = '\\';
        commandLine[index + 1] = '\"';
      }
      index += 2;
      break;
    default:
      if (!prepass)
      {
        commandLine[index] = source[i];
      }
      index++;
      break;
    }
  } while (++i);
}

int main(int argc, char **argv)
{
  // We don't want SIGINT to kill our process; we want it to kill the
  // innermost process, whose end will cause our own to exit.
  signal(SIGINT, SIG_IGN);

  char *infoPath = getInfoPath();

  // Open the .info file
  FILE *f = fopen(infoPath, "r");
  if (f == NULL)
  {
    perror(infoPath);
    return 1;
  }

  // Get the filesize
  fseek(f, 0, SEEK_END);
  long fsize = ftell(f);
  fseek(f, 0, SEEK_SET);

  // Read all its content
  char *buffer = calloc(fsize + 1, 1);
  buffer[fsize] = '\0';
  fread(buffer, 1, fsize, f);
  fclose(f);

  free(infoPath);

#pragma region Preparse to find space needed
  // Start at argc-1 since we need one space for each argument and we skip the first
  long spaceNeeded = argc - 1;

  parseArguments(buffer, NULL, &spaceNeeded, 1);

  for (long t = 1; t < argc; ++t)
  {
    parseArguments(argv[t], NULL, &spaceNeeded, 1);
  }
#pragma endregion

  char *commandLine = calloc(spaceNeeded + 1, 1);
  commandLine[spaceNeeded] = '\0';

  long commandIndex = 0;

  parseArguments(buffer, commandLine, &commandIndex, 0);

  free(buffer);

  for (long t = 1; t < argc; ++t)
  {
    commandLine[commandIndex++] = ' ';
    parseArguments(argv[t], commandLine, &commandIndex, 0);
  }

  if (commandIndex != spaceNeeded)
  {
    printf("Parsing failed, expected %d, got %d\n, Parsed: '%s'", spaceNeeded, commandIndex, commandLine);
    return 1;
  }

  // Execute the requested binary
  STARTUPINFO si;
  PROCESS_INFORMATION pi;

  ZeroMemory(&si, sizeof(si));
  si.cb = sizeof(si);
  ZeroMemory(&pi, sizeof(pi));

  // Start the child process.
  if (!CreateProcess(NULL,        // No module name (use command line)
                     commandLine, // Command line
                     NULL,        // Process handle not inheritable
                     NULL,        // Thread handle not inheritable
                     FALSE,       // Set handle inheritance to FALSE
                     0,           // No creation flags
                     NULL,        // Use parent's environment block
                     NULL,        // Use parent's starting directory
                     &si,         // Pointer to STARTUPINFO structure
                     &pi)         // Pointer to PROCESS_INFORMATION structure
  )
  {
    printf("CreateProcess failed (%d).\n", GetLastError());
    return 1;
  }

  // Wait until child process exits.
  WaitForSingleObject(pi.hProcess, INFINITE);

  DWORD exitCode;
  GetExitCodeProcess(pi.hProcess, &exitCode);

  // Close process and thread handles.
  CloseHandle(pi.hProcess);
  CloseHandle(pi.hThread);

  free(commandLine);

  return exitCode;
}
