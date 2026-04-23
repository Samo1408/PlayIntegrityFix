MODDIR="/data/adb/modules/teleinject"

  if [ -z "$MMRL" ] && [ ! -z "$MAGISKTMP" ]; then
      pm path io.github.a13e300.ksuwebui > /dev/null 2>&1 && {
          echo "- Launching WebUI in KSUWebUIStandalone..."
          am start -n "io.github.a13e300.ksuwebui/.WebUIActivity" -e id "teleinject"
          exit 0
      }
      pm path com.dergoogler.mmrl.wx > /dev/null 2>&1 && {
          echo "- Launching WebUI in WebUI X..."
          am start -n "com.dergoogler.mmrl.wx/.ui.activity.webui.WebUIActivity" -e MOD_ID "teleinject"
          exit 0
      }
  fi

  echo "Open WebUI from Magisk / KernelSU / APatch manager."
  