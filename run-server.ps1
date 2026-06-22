$ErrorActionPreference = "Stop"
$Node = "C:\Users\Yeica\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if (-not (Test-Path -LiteralPath $Node)) {
  $Node = "node"
}
& $Node .\server.mjs
