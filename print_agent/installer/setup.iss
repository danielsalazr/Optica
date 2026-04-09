#define MyAppName "Optica Print Agent"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "Optica"
#define MyAppExeName "OpticaPrintAgent.exe"
#define MyServiceExeName "OpticaPrintAgentService.exe"
#define MyServiceXmlName "OpticaPrintAgentService.xml"

[Setup]
AppId={{6F69447E-392A-4EFC-B803-OPTICA-PRINT-AGENT}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf64}\Optica Print Agent
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=admin
OutputDir=output
OutputBaseFilename=optica-print-agent-setup
Compression=lzma
SolidCompression=yes

[Files]
Source: "..\dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\{#MyServiceExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\{#MyServiceXmlName}"; DestDir: "{app}"; Flags: ignoreversion

[Run]
Filename: "{app}\{#MyAppExeName}"; Parameters: "--prepare-runtime"; Flags: runhidden waituntilterminated
Filename: "{sys}\certutil.exe"; Parameters: "-f -addstore Root ""{commonappdata}\OpticaPrintAgent\certs\localhost.crt"""; Flags: runhidden waituntilterminated
Filename: "{app}\{#MyServiceExeName}"; Parameters: "install"; Flags: runhidden waituntilterminated
Filename: "{app}\{#MyServiceExeName}"; Parameters: "start"; Flags: runhidden waituntilterminated
