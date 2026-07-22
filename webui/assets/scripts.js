import { exec, toast } from "kernelsu-alt";
import '@material/web/all.js';

// ----- Country / Operator database (25+ countries) ------------------------
const COUNTRY_DATA = [
    { name: "🇸🇦 Saudi Arabia", iso: "SA", code: "420", sim: "420", net: "420",
      operators: [
        { name: "STC", mcc: "420", mnc: "01", op: "42001", opName: "STC" },
        { name: "Mobily", mcc: "420", mnc: "03", op: "42003", opName: "Mobily" },
        { name: "Zain SA", mcc: "420", mnc: "04", op: "42004", opName: "Zain SA" }
    ]},
    { name: "🇦🇪 UAE", iso: "AE", code: "424", sim: "424", net: "424",
      operators: [
        { name: "Etisalat", mcc: "424", mnc: "02", op: "42402", opName: "Etisalat" },
        { name: "du", mcc: "424", mnc: "03", op: "42403", opName: "du" }
    ]},
    { name: "🇪🇬 Egypt", iso: "EG", code: "602", sim: "602", net: "602",
      operators: [
        { name: "Orange EG", mcc: "602", mnc: "01", op: "60201", opName: "Orange Egypt" },
        { name: "Vodafone EG", mcc: "602", mnc: "02", op: "60202", opName: "Vodafone Egypt" },
        { name: "Etisalat EG", mcc: "602", mnc: "03", op: "60203", opName: "Etisalat Egypt" },
        { name: "WE", mcc: "602", mnc: "04", op: "60204", opName: "WE Telecom" }
    ]},
    { name: "🇮🇶 Iraq", iso: "IQ", code: "418", sim: "418", net: "418",
      operators: [
        { name: "Zain IQ", mcc: "418", mnc: "20", op: "41820", opName: "Zain Iraq" },
        { name: "Asiacell", mcc: "418", mnc: "05", op: "41805", opName: "Asiacell" },
        { name: "Korek", mcc: "418", mnc: "40", op: "41840", opName: "Korek Telecom" }
    ]},
    { name: "🇯🇴 Jordan", iso: "JO", code: "416", sim: "416", net: "416",
      operators: [
        { name: "Zain JO", mcc: "416", mnc: "01", op: "41601", opName: "Zain Jordan" },
        { name: "Orange JO", mcc: "416", mnc: "77", op: "41677", opName: "Orange Jordan" },
        { name: "Umniah", mcc: "416", mnc: "03", op: "41603", opName: "Umniah" }
    ]},
    { name: "🇰🇼 Kuwait", iso: "KW", code: "419", sim: "419", net: "419",
      operators: [
        { name: "Zain KW", mcc: "419", mnc: "02", op: "41902", opName: "Zain Kuwait" },
        { name: "Ooredoo KW", mcc: "419", mnc: "03", op: "41903", opName: "Ooredoo Kuwait" },
        { name: "STC KW", mcc: "419", mnc: "04", op: "41904", opName: "STC Kuwait" }
    ]},
    { name: "🇶🇦 Qatar", iso: "QA", code: "427", sim: "427", net: "427",
      operators: [
        { name: "Ooredoo QA", mcc: "427", mnc: "01", op: "42701", opName: "Ooredoo Qatar" },
        { name: "Vodafone QA", mcc: "427", mnc: "02", op: "42702", opName: "Vodafone Qatar" }
    ]},
    { name: "🇧🇭 Bahrain", iso: "BH", code: "426", sim: "426", net: "426",
      operators: [
        { name: "Batelco", mcc: "426", mnc: "01", op: "42601", opName: "Batelco" },
        { name: "Zain BH", mcc: "426", mnc: "02", op: "42602", opName: "Zain Bahrain" },
        { name: "STC BH", mcc: "426", mnc: "04", op: "42604", opName: "STC Bahrain" }
    ]},
    { name: "🇴🇲 Oman", iso: "OM", code: "422", sim: "422", net: "422",
      operators: [
        { name: "Omantel", mcc: "422", mnc: "02", op: "42202", opName: "Omantel" },
        { name: "Ooredoo OM", mcc: "422", mnc: "03", op: "42203", opName: "Ooredoo Oman" }
    ]},
    { name: "🇱🇧 Lebanon", iso: "LB", code: "415", sim: "415", net: "415",
      operators: [
        { name: "Alfa", mcc: "415", mnc: "01", op: "41501", opName: "Alfa" },
        { name: "Touch", mcc: "415", mnc: "03", op: "41503", opName: "Touch" }
    ]},
    { name: "🇸🇾 Syria", iso: "SY", code: "417", sim: "417", net: "417",
      operators: [
        { name: "Syriatel", mcc: "417", mnc: "01", op: "41701", opName: "Syriatel" },
        { name: "MTN Syria", mcc: "417", mnc: "02", op: "41702", opName: "MTN Syria" }
    ]},
    { name: "🇵🇸 Palestine", iso: "PS", code: "425", sim: "425", net: "425",
      operators: [
        { name: "Jawwal", mcc: "425", mnc: "05", op: "42505", opName: "Jawwal" },
        { name: "Ooredoo PS", mcc: "425", mnc: "06", op: "42506", opName: "Ooredoo Palestine" }
    ]},
    { name: "🇲🇦 Morocco", iso: "MA", code: "604", sim: "604", net: "604",
      operators: [
        { name: "Maroc Telecom", mcc: "604", mnc: "01", op: "60401", opName: "Maroc Telecom" },
        { name: "Orange MA", mcc: "604", mnc: "00", op: "60400", opName: "Orange Morocco" },
        { name: "Inwi", mcc: "604", mnc: "02", op: "60402", opName: "Inwi" }
    ]},
    { name: "🇩🇿 Algeria", iso: "DZ", code: "603", sim: "603", net: "603",
      operators: [
        { name: "Mobilis", mcc: "603", mnc: "01", op: "60301", opName: "Mobilis" },
        { name: "Djezzy", mcc: "603", mnc: "02", op: "60302", opName: "Djezzy" },
        { name: "Ooredoo DZ", mcc: "603", mnc: "03", op: "60303", opName: "Ooredoo Algeria" }
    ]},
    { name: "🇹🇳 Tunisia", iso: "TN", code: "605", sim: "605", net: "605",
      operators: [
        { name: "Tunisie Telecom", mcc: "605", mnc: "01", op: "60501", opName: "Tunisie Telecom" },
        { name: "Ooredoo TN", mcc: "605", mnc: "02", op: "60502", opName: "Ooredoo Tunisia" },
        { name: "Orange TN", mcc: "605", mnc: "03", op: "60503", opName: "Orange Tunisia" }
    ]},
    { name: "🇹🇷 Turkey", iso: "TR", code: "286", sim: "286", net: "286",
      operators: [
        { name: "Turkcell", mcc: "286", mnc: "01", op: "28601", opName: "Turkcell" },
        { name: "Vodafone TR", mcc: "286", mnc: "02", op: "28602", opName: "Vodafone Turkey" },
        { name: "Turk Telekom", mcc: "286", mnc: "03", op: "28603", opName: "Turk Telekom" }
    ]},
    { name: "🇮🇳 India", iso: "IN", code: "404", sim: "404", net: "405",
      operators: [
        { name: "Jio", mcc: "405", mnc: "840", op: "405840", opName: "Reliance Jio" },
        { name: "Airtel", mcc: "404", mnc: "02", op: "40402", opName: "Airtel" },
        { name: "Vi", mcc: "404", mnc: "04", op: "40404", opName: "Vodafone Idea" }
    ]},
    { name: "🇵🇰 Pakistan", iso: "PK", code: "410", sim: "410", net: "410",
      operators: [
        { name: "Jazz", mcc: "410", mnc: "01", op: "41001", opName: "Jazz" },
        { name: "Telenor PK", mcc: "410", mnc: "06", op: "41006", opName: "Telenor Pakistan" },
        { name: "Zong", mcc: "410", mnc: "04", op: "41004", opName: "Zong" }
    ]},
    { name: "🇧🇩 Bangladesh", iso: "BD", code: "470", sim: "470", net: "470",
      operators: [
        { name: "Grameenphone", mcc: "470", mnc: "01", op: "47001", opName: "Grameenphone" },
        { name: "Robi", mcc: "470", mnc: "02", op: "47002", opName: "Robi" }
    ]},
    { name: "🇮🇩 Indonesia", iso: "ID", code: "510", sim: "510", net: "510",
      operators: [
        { name: "Telkomsel", mcc: "510", mnc: "10", op: "51010", opName: "Telkomsel" },
        { name: "Indosat", mcc: "510", mnc: "01", op: "51001", opName: "Indosat" },
        { name: "XL Axiata", mcc: "510", mnc: "11", op: "51011", opName: "XL Axiata" }
    ]},
    { name: "🇲🇾 Malaysia", iso: "MY", code: "502", sim: "502", net: "502",
      operators: [
        { name: "Maxis", mcc: "502", mnc: "12", op: "50212", opName: "Maxis" },
        { name: "Celcom", mcc: "502", mnc: "19", op: "50219", opName: "Celcom" },
        { name: "Digi", mcc: "502", mnc: "16", op: "50216", opName: "Digi" }
    ]},
    { name: "🇬🇧 UK", iso: "GB", code: "234", sim: "234", net: "234",
      operators: [
        { name: "EE", mcc: "234", mnc: "30", op: "23430", opName: "EE" },
        { name: "Vodafone UK", mcc: "234", mnc: "15", op: "23415", opName: "Vodafone UK" },
        { name: "O2 UK", mcc: "234", mnc: "10", op: "23410", opName: "O2 UK" }
    ]},
    { name: "🇺🇸 USA", iso: "US", code: "310", sim: "310", net: "310",
      operators: [
        { name: "T-Mobile", mcc: "310", mnc: "260", op: "310260", opName: "T-Mobile US" },
        { name: "Verizon", mcc: "311", mnc: "480", op: "311480", opName: "Verizon" },
        { name: "AT&T", mcc: "310", mnc: "410", op: "310410", opName: "AT&T" }
    ]},
    { name: "🇩🇪 Germany", iso: "DE", code: "262", sim: "262", net: "262",
      operators: [
        { name: "Telekom", mcc: "262", mnc: "01", op: "26201", opName: "Deutsche Telekom" },
        { name: "Vodafone DE", mcc: "262", mnc: "02", op: "26202", opName: "Vodafone Germany" },
        { name: "O2 DE", mcc: "262", mnc: "03", op: "26203", opName: "O2 Germany" }
    ]},
    { name: "🇫🇷 France", iso: "FR", code: "208", sim: "208", net: "208",
      operators: [
        { name: "Orange FR", mcc: "208", mnc: "01", op: "20801", opName: "Orange France" },
        { name: "SFR", mcc: "208", mnc: "10", op: "20810", opName: "SFR" },
        { name: "Free", mcc: "208", mnc: "15", op: "20815", opName: "Free Mobile" }
    ]},
    { name: "🇪🇸 Spain", iso: "ES", code: "214", sim: "214", net: "214",
      operators: [
        { name: "Movistar", mcc: "214", mnc: "07", op: "21407", opName: "Movistar" },
        { name: "Vodafone ES", mcc: "214", mnc: "01", op: "21401", opName: "Vodafone Spain" },
        { name: "Orange ES", mcc: "214", mnc: "03", op: "21403", opName: "Orange Spain" }
    ]},
    { name: "🇷🇺 Russia", iso: "RU", code: "250", sim: "250", net: "250",
      operators: [
        { name: "MTS", mcc: "250", mnc: "01", op: "25001", opName: "MTS Russia" },
        { name: "MegaFon", mcc: "250", mnc: "02", op: "25002", opName: "MegaFon" },
        { name: "Beeline", mcc: "250", mnc: "99", op: "25099", opName: "Beeline" }
    ]},
    { name: "🇨🇳 China", iso: "CN", code: "460", sim: "460", net: "460",
      operators: [
        { name: "China Mobile", mcc: "460", mnc: "00", op: "46000", opName: "China Mobile" },
        { name: "China Unicom", mcc: "460", mnc: "01", op: "46001", opName: "China Unicom" },
        { name: "China Telecom", mcc: "460", mnc: "03", op: "46003", opName: "China Telecom" }
    ]},
    { name: "🇧🇷 Brazil", iso: "BR", code: "724", sim: "724", net: "724",
      operators: [
        { name: "Vivo", mcc: "724", mnc: "06", op: "72406", opName: "Vivo" },
        { name: "Claro", mcc: "724", mnc: "05", op: "72405", opName: "Claro Brasil" },
        { name: "TIM", mcc: "724", mnc: "02", op: "72402", opName: "TIM Brasil" }
    ]}
];

// ----- Pixel device fingerprints for Play Integrity -----------------------
const PIXEL_FINGERPRINTS = [
    { name: "Pixel 9 Pro XL (komodo)", finger: "google/komodo/komodo:15/AP4A.250105.002/12749217:user/release-keys", model: "Pixel 9 Pro XL", product: "komodo", brand: "google", device: "komodo", manufacturer: "Google", security_patch: "2025-01-05", sdk: "35" },
    { name: "Pixel 9 Pro (caiman)", finger: "google/caiman/caiman:15/AP4A.250105.002/12749217:user/release-keys", model: "Pixel 9 Pro", product: "caiman", brand: "google", device: "caiman", manufacturer: "Google", security_patch: "2025-01-05", sdk: "35" },
    { name: "Pixel 9 (tokay)", finger: "google/tokay/tokay:15/AP4A.250105.002/12749217:user/release-keys", model: "Pixel 9", product: "tokay", brand: "google", device: "tokay", manufacturer: "Google", security_patch: "2025-01-05", sdk: "35" },
    { name: "Pixel 8 Pro (husky)", finger: "google/husky/husky:15/AP4A.250105.002/12678482:user/release-keys", model: "Pixel 8 Pro", product: "husky", brand: "google", device: "husky", manufacturer: "Google", security_patch: "2025-01-05", sdk: "35" },
    { name: "Pixel 8 (shiba)", finger: "google/shiba/shiba:15/AP4A.250105.002/12678482:user/release-keys", model: "Pixel 8", product: "shiba", brand: "google", device: "shiba", manufacturer: "Google", security_patch: "2025-01-05", sdk: "35" },
    { name: "Pixel 7 Pro (cheetah)", finger: "google/cheetah/cheetah:15/AP4A.250105.002/12678482:user/release-keys", model: "Pixel 7 Pro", product: "cheetah", brand: "google", device: "cheetah", manufacturer: "Google", security_patch: "2025-01-05", sdk: "35" },
    { name: "Pixel 7 (panther)", finger: "google/panther/panther:15/AP4A.250105.002/12678482:user/release-keys", model: "Pixel 7", product: "panther", brand: "google", device: "panther", manufacturer: "Google", security_patch: "2025-01-05", sdk: "35" },
    { name: "Pixel 6 Pro (raven)", finger: "google/raven/raven:15/AP4A.250105.002/12317824:user/release-keys", model: "Pixel 6 Pro", product: "raven", brand: "google", device: "raven", manufacturer: "Google", security_patch: "2025-01-05", sdk: "35" },
    { name: "Pixel 6 (oriole)", finger: "google/oriole/oriole:15/AP4A.250105.002/12317824:user/release-keys", model: "Pixel 6", product: "oriole", brand: "google", device: "oriole", manufacturer: "Google", security_patch: "2025-01-05", sdk: "35" },
    { name: "Pixel 5 (redfin)", finger: "google/redfin/redfin:14/UP1A.231105.001/10821973:user/release-keys", model: "Pixel 5", product: "redfin", brand: "google", device: "redfin", manufacturer: "Google", security_patch: "2023-11-05", sdk: "34" },
    { name: "Pixel Fold (felix)", finger: "google/felix/felix:15/AP4A.250105.002/12749217:user/release-keys", model: "Pixel Fold", product: "felix", brand: "google", device: "felix", manufacturer: "Google", security_patch: "2025-01-05", sdk: "35" },
    { name: "Pixel Tablet (tangorpro)", finger: "google/tangorpro/tangorpro:15/AP4A.250105.002/12749217:user/release-keys", model: "Pixel Tablet", product: "tangorpro", brand: "google", device: "tangorpro", manufacturer: "Google", security_patch: "2025-01-05", sdk: "35" },
];

const MODDIR = '/data/adb/modules/teleinject';
const CONFIG_PATH = MODDIR + '/telephony.conf';
const CUSTOM_CONFIG = '/data/adb/teleinject.conf';

const PIXEL_KEYS = [
    'DEVICE_INITIAL_SDK_INT', 'FINGERPRINT', 'MODEL', 'PRODUCT',
    'BRAND', 'DEVICE', 'MANUFACTURER', 'SECURITY_PATCH',
    'spoofBuild', 'spoofProps', 'spoofProvider', 'spoofSignature'
];

const TELEPHONY_KEYS = [
    'COUNTRY_ISO','COUNTRY_CODE','SIM_OPERATOR_NUMERIC','SIM_OPERATOR',
    'SIM_OPERATOR_NAME','SIM_COUNTRY_ISO','NETWORK_COUNTRY_ISO',
    'NETWORK_OPERATOR_NUMERIC','OPERATOR_NUMERIC','OPERATOR_NAME',
    'MCC','MCC_STRING','MNC','MNC_STRING'
];

const TOGGLE_KEYS = [
    'spoofTelephony',
    'hookTelephonyManager',
    'hookSubscriptionInfo',
    'hookEmergencyNumber',
    'hookTelephonyProperties',
    'hookSemTelephonyProps',
    'hookULocale',
    'hookCellIdentity'
];

let allowedApps = new Set();
let installedApps = [];
let userApps = [];
let sysApps = [];
let showSystemApps = false;

async function sh(cmd) {
    const r = await exec(cmd);
    if (r && r.stdout != null) return r.stdout;
    return '';
}

function parseConfig(text) {
    const map = {};
    text.split(/\r?\n/).forEach(l => {
        const line = l.replace(/#.*$/, '').trim();
        if (!line) return;
        const eq = line.indexOf('=');
        if (eq < 0) return;
        const k = line.slice(0, eq).trim();
        const v = line.slice(eq + 1).trim();
        map[k] = v;
    });
    return map;
}

function buildConfigFile(values, toggles, apps) {
    let out = '# TeleInject configuration (generated by WebUI)\n';
    TELEPHONY_KEYS.forEach(k => out += k + '=' + (values[k] || '') + '\n');
    PIXEL_KEYS.forEach(k => out += k + '=' + (values[k] || '') + '\n');
    out += '\n';
    TOGGLE_KEYS.forEach(k => out += k + '=' + (toggles[k] ? 'true' : 'false') + '\n');
    out += '\nallowedApps=' + Array.from(apps).join(',') + '\n';
    out += 'DEBUG=false\n';
    return out;
}

async function loadConfig() {
    let text = await sh('[ -f ' + CUSTOM_CONFIG + ' ] && cat ' + CUSTOM_CONFIG + ' || cat ' + CONFIG_PATH + ' 2>/dev/null');
    const map = parseConfig(text || '');
    TELEPHONY_KEYS.forEach(k => {
        const el = document.getElementById(k);
        if (el) el.value = map[k] || '';
    });
    PIXEL_KEYS.forEach(k => {
        const el = document.getElementById(k);
        if (el) {
            if (k.startsWith('spoof') && el.tagName === 'MD-SWITCH') {
                const v = (map[k] || '').toLowerCase();
                el.selected = (v === 'true' || v === '1');
            } else if (el.value !== undefined) {
                el.value = map[k] || '';
            }
        }
    });
    TOGGLE_KEYS.forEach(k => {
        const id = (k === 'spoofTelephony') ? 'spoofTelephony-toggle' : k;
        const el = document.getElementById(id);
        if (!el) return;
        const v = (map[k] || '').toLowerCase();
        el.selected = (v === 'true' || v === '1' || (map[k] === undefined && k.startsWith('hook')));
    });
    allowedApps = new Set();
    if (map.allowedApps) {
        map.allowedApps.split(/[,\s]+/).map(s => s.trim()).filter(Boolean).forEach(p => allowedApps.add(p));
    }
}

async function saveConfig() {
    const values = {};
    TELEPHONY_KEYS.forEach(k => {
        const el = document.getElementById(k);
        values[k] = el ? (el.value || '').trim() : '';
    });
    PIXEL_KEYS.forEach(k => {
        const el = document.getElementById(k);
        if (el) {
            if (k.startsWith('spoof') && el.tagName === 'MD-SWITCH') {
                values[k] = el.selected ? 'true' : 'false';
            } else {
                values[k] = (el.value || '').trim();
            }
        }
    });
    const toggles = {};
    TOGGLE_KEYS.forEach(k => {
        const id = (k === 'spoofTelephony') ? 'spoofTelephony-toggle' : k;
        const el = document.getElementById(id);
        toggles[k] = el ? !!el.selected : false;
    });
    const content = buildConfigFile(values, toggles, allowedApps);
    const b64 = btoa(unescape(encodeURIComponent(content)));
    const cmd = "echo '" + b64 + "' | base64 -d > " + CONFIG_PATH;
    const r = await exec(cmd);
    const status = document.getElementById('save-status');
    if (r && r.errno === 0) {
        status.textContent = 'Saved. Reboot or restart hooked apps to apply.';
        toast('Settings saved');
    } else {
        status.textContent = 'Save failed: ' + (r ? r.stderr : 'unknown error');
        toast('Save failed');
    }
}

async function forceStopApp(pkg) {
    try {
        await exec('am force-stop ' + pkg);
        toast('Force stopped: ' + pkg);
    } catch (e) {
        toast('Failed to force-stop: ' + pkg);
    }
}

async function loadInstalledApps() {
    const list = document.getElementById('app-list');
    list.innerHTML = '<div class="hint">Loading installed packages...</div>';
    const userOut = await sh('pm list packages -3 2>/dev/null');
    const userSet = new Set();
    userOut.split(/\r?\n/).forEach(l => {
        const m = l.match(/^package:(.+)$/);
        if (m) userSet.add(m[1].trim());
    });
    const sysOut = await sh('pm list packages -s 2>/dev/null');
    const sysSet = new Set();
    sysOut.split(/\r?\n/).forEach(l => {
        const m = l.match(/^package:(.+)$/);
        if (m) {
            const pkg = m[1].trim();
            if (!userSet.has(pkg)) sysSet.add(pkg);
        }
    });
    userApps = Array.from(userSet).sort().map(pkg => ({ pkg, label: pkg, isSystem: false }));
    sysApps = Array.from(sysSet).sort().map(pkg => ({ pkg, label: pkg, isSystem: true }));
    allowedApps.forEach(p => {
        if (p && p !== '*' && !userSet.has(p) && !sysSet.has(p)) {
            userApps.push({ pkg: p, label: p + ' (manual)', isSystem: false });
        }
    });
    // Populate country select
    const cSel = document.getElementById('country-select');
    cSel.innerHTML = '<option value="-1">-- Choose a country --</option>';
    COUNTRY_DATA.forEach((c, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = c.name;
        cSel.appendChild(opt);
    });
    // Populate pixel select
    const pSel = document.getElementById('pixel-select');
    pSel.innerHTML = '<option value="-1">-- Choose a Pixel device --</option>';
    PIXEL_FINGERPRINTS.forEach((p, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = p.name;
        pSel.appendChild(opt);
    });
    buildInstalledApps();
    renderAppList('');
}

function buildInstalledApps() {
    if (showSystemApps) {
        installedApps = [...userApps, ...sysApps].sort((a, b) => a.pkg.localeCompare(b.pkg));
    } else {
        installedApps = [...userApps];
    }
}

function renderAppList(filter) {
    const list = document.getElementById('app-list');
    list.innerHTML = '';
    const q = (filter || '').toLowerCase();
    const items = installedApps.filter(a => !q || a.pkg.toLowerCase().includes(q));
    if (items.length === 0) {
        list.innerHTML = '<div class="hint">No matching packages</div>';
        return;
    }
    items.forEach(a => {
        const row = document.createElement('div');
        row.className = 'app-row';
        const sw = document.createElement('md-switch');
        sw.className = 'app-switch';
        sw.selected = allowedApps.has(a.pkg);
        sw.addEventListener('change', () => {
            if (sw.selected) allowedApps.add(a.pkg);
            else allowedApps.delete(a.pkg);
        });
        const span = document.createElement('span');
        span.className = 'app-label';
        span.textContent = a.label;
        if (a.isSystem) span.classList.add('system-app');
        const stopBtn = document.createElement('md-outlined-icon-button');
        stopBtn.className = 'app-force-stop';
        stopBtn.title = 'Force stop';
        stopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            forceStopApp(a.pkg);
        });
        const stopIcon = document.createElement('md-icon');
        stopIcon.textContent = 'stop_circle';
        stopBtn.appendChild(stopIcon);
        row.appendChild(sw);
        row.appendChild(span);
        row.appendChild(stopBtn);
        list.appendChild(row);
    });
}

function toggleSystemApps() {
    showSystemApps = !showSystemApps;
    const btn = document.getElementById('system-apps-toggle-btn');
    if (showSystemApps) {
        btn.classList.add('active');
        btn.innerHTML = '<md-icon>apps</md-icon> Hide System Apps';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<md-icon>apps</md-icon> Show System Apps';
    }
    buildInstalledApps();
    renderAppList(document.getElementById('app-search').value);
}

// ----- country auto-fill -------------------------------------------------

function onCountryChange() {
    const sel = document.getElementById('country-select');
    const idx = parseInt(sel.value || '-1');
    if (idx < 0 || idx >= COUNTRY_DATA.length) return;
    const c = COUNTRY_DATA[idx];
    setField('COUNTRY_ISO', c.iso);
    setField('COUNTRY_CODE', c.code);
    setField('SIM_COUNTRY_ISO', c.sim);
    setField('NETWORK_COUNTRY_ISO', c.net);
    // Populate operator dropdown
    const oSel = document.getElementById('operator-select');
    oSel.innerHTML = '<option value="-1">-- Choose operator --</option>';
    c.operators.forEach((op, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = op.name + ' (MCC:' + op.mcc + ' MNC:' + op.mnc + ')';
        oSel.appendChild(opt);
    });
    if (c.operators.length > 0) {
        oSel.value = '0';
        fillOperatorFields(c.operators[0]);
    }
    toast('Applied: ' + c.name);
}

function fillOperatorFields(op) {
    setField('MCC', op.mcc); setField('MCC_STRING', op.mcc);
    setField('MNC', op.mnc); setField('MNC_STRING', op.mnc);
    setField('OPERATOR_NUMERIC', op.op); setField('SIM_OPERATOR_NUMERIC', op.op);
    setField('NETWORK_OPERATOR_NUMERIC', op.op);
    setField('OPERATOR_NAME', op.opName); setField('SIM_OPERATOR_NAME', op.opName);
    setField('SIM_OPERATOR', op.op);
}

function setField(id, value) {
    const el = document.getElementById(id);
    if (el && el.value !== undefined) el.value = value;
}

// ----- pixel device auto-fill --------------------------------------------

function onPixelChange() {
    const sel = document.getElementById('pixel-select');
    const idx = parseInt(sel.value || '-1');
    if (idx < 0 || idx >= PIXEL_FINGERPRINTS.length) return;
    const p = PIXEL_FINGERPRINTS[idx];
    setField('FINGERPRINT', p.finger);
    setField('MODEL', p.model);
    setField('PRODUCT', p.product);
    setField('BRAND', p.brand);
    setField('DEVICE', p.device);
    setField('MANUFACTURER', p.manufacturer);
    setField('SECURITY_PATCH', p.security_patch);
    setField('DEVICE_INITIAL_SDK_INT', p.sdk);
    toast('Applied: ' + p.name);
}

// ----- bind UI ----------------------------------------------------------

function bind() {
    document.getElementById('save-btn').addEventListener('click', saveConfig);
    document.getElementById('reload-apps-btn').addEventListener('click', loadInstalledApps);
    document.getElementById('system-apps-toggle-btn').addEventListener('click', toggleSystemApps);
    document.getElementById('country-select').addEventListener('change', onCountryChange);
    document.getElementById('operator-select').addEventListener('change', () => {
        const cSel = document.getElementById('country-select');
        const oSel = document.getElementById('operator-select');
        const cIdx = parseInt(cSel.value || '-1');
        const oIdx = parseInt(oSel.value || '-1');
        if (cIdx < 0 || cIdx >= COUNTRY_DATA.length) return;
        const c = COUNTRY_DATA[cIdx];
        if (oIdx < 0 || oIdx >= c.operators.length) return;
        fillOperatorFields(c.operators[oIdx]);
    });
    document.getElementById('apply-country-btn').addEventListener('click', onCountryChange);
    document.getElementById('pixel-select').addEventListener('change', onPixelChange);
    document.getElementById('select-all-btn').addEventListener('click', () => {
        installedApps.forEach(a => allowedApps.add(a.pkg));
        renderAppList(document.getElementById('app-search').value);
    });
    document.getElementById('clear-all-btn').addEventListener('click', () => {
        allowedApps.clear();
        renderAppList(document.getElementById('app-search').value);
    });
    document.getElementById('app-search').addEventListener('input', e => {
        renderAppList(e.target.value);
    });
    document.getElementById('add-pkg-btn').addEventListener('click', () => {
        const inp = document.getElementById('manual-pkg');
        const v = (inp.value || '').trim();
        if (!v) return;
        allowedApps.add(v);
        if (v !== '*' && !installedApps.some(a => a.pkg === v)) {
            installedApps.push({ pkg: v, label: v + ' (manual)', isSystem: false });
            installedApps.sort((a, b) => a.pkg.localeCompare(b.pkg));
        }
        inp.value = '';
        renderAppList(document.getElementById('app-search').value);
        toast('Added ' + v);
    });
}

async function init() {
    bind();
    try {
        const ver = await sh("grep '^version=' " + MODDIR + "/module.prop | cut -d= -f2");
        const verEl = document.getElementById('version-text');
        if (verEl && ver) verEl.textContent = ver.trim();
    } catch {}
    await loadConfig();
    await loadInstalledApps();
    document.querySelector('.content')?.removeAttribute('unresolved');
}

document.addEventListener('DOMContentLoaded', init);