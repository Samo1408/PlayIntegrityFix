#!/system/bin/sh
#
# TeleInject - service.sh (boot-time script)
# Uses resetprop-rs when available for stealth property manipulation.
#

MODDIR="/data/adb/modules/teleinject"
LOG_TAG="TeleInject"

log() { echo "[$LOG_TAG] $1"; }

# ----- Resolve resetprop binary (prefer resetprop-rs) -----
RESETPROP=""
if [ -x "$MODDIR/resetprop-rs" ]; then
    RESETPROP="$MODDIR/resetprop-rs"
elif command -v resetprop-rs >/dev/null 2>&1; then
    RESETPROP="resetprop-rs"
elif command -v resetprop >/dev/null 2>&1; then
    RESETPROP="resetprop"
fi

if [ -z "$RESETPROP" ]; then
    log "No resetprop binary found; skipping boot-time property tweaks."
    return 0
fi

log "Using resetprop: $RESETPROP"

# ----- resetprop-rs quick reference -----
# Old syntax                      -> New resetprop-rs syntax
# resetprop NAME VALUE            -> resetprop-rs NAME VALUE
# resetprop -n NAME VALUE         -> resetprop-rs -n NAME VALUE  (no-op compat)
# resetprop --delete NAME         -> resetprop-rs -d NAME
# resetprop -p --delete NAME      -> resetprop-rs -p -d NAME
# resetprop -f props.txt          -> resetprop-rs -f props.txt
# (none)                          -> resetprop-rs --stealth NAME VALUE
# (none)                          -> resetprop-rs --nuke NAME
# (none)                          -> resetprop-rs --init NAME VALUE
# (none)                          -> resetprop-rs --hexpatch-delete NAME

# ----- Telephony Network Mode Fix -----
# Force network type to LTE/WCDMA/GSM auto (9 = NR/LTE/WCDMA/GSM)
if [ "$RESETPROP" ]; then
    "$RESETPROP" --init ro.telephony.default_network 9,1 2>/dev/null || true
    log "Applied telephony default_network via $RESETPROP"
fi

# ----- TeleInject boot complete -----
log "service.sh completed."