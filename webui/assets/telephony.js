// Telephony Spoofing Configuration Handler

const telephonyFields = [
    'countryIso',
    'countryCode',
    'simOperatorNumeric',
    'simOperator',
    'simOperatorName',
    'simCountryIso',
    'networkCountryIso',
    'networkOperatorNumeric',
    'operatorNumeric',
    'operatorName',
    'mcc',
    'mccString',
    'mnc',
    'mncString'
];

const telephonyConfig = {
    countryIso: 'COUNTRY_ISO',
    countryCode: 'COUNTRY_CODE',
    simOperatorNumeric: 'SIM_OPERATOR_NUMERIC',
    simOperator: 'SIM_OPERATOR',
    simOperatorName: 'SIM_OPERATOR_NAME',
    simCountryIso: 'SIM_COUNTRY_ISO',
    networkCountryIso: 'NETWORK_COUNTRY_ISO',
    networkOperatorNumeric: 'NETWORK_OPERATOR_NUMERIC',
    operatorNumeric: 'OPERATOR_NUMERIC',
    operatorName: 'OPERATOR_NAME',
    mcc: 'MCC',
    mccString: 'MCC_STRING',
    mnc: 'MNC',
    mncString: 'MNC_STRING'
};

// Save telephony configuration to pif.prop
export async function saveTelephonyConfig(exec) {
    const telephonyData = {};
    let hasData = false;

    for (const field of telephonyFields) {
        const element = document.getElementById(field);
        if (element && element.value.trim()) {
            telephonyData[telephonyConfig[field]] = element.value.trim();
            hasData = true;
        }
    }

    if (!hasData) {
        return { success: false, message: 'No telephony data to save' };
    }

    try {
        // Get the pif.prop file path
        const pathResult = await exec(`echo "${moddir}/pif.prop"; [ ! -f /data/adb/pif.prop ] || echo "/data/adb/pif.prop"`);
        const pifPath = pathResult.stdout.trim().split('\n')[0];

        // Read current pif.prop
        const readResult = await exec(`cat ${pifPath}`);
        if (readResult.errno !== 0) {
            return { success: false, message: 'Failed to read pif.prop' };
        }

        let content = readResult.stdout;
        
        // Add or update telephony settings
        for (const [key, value] of Object.entries(telephonyData)) {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            if (regex.test(content)) {
                content = content.replace(regex, `${key}=${value}`);
            } else {
                content += `\n${key}=${value}`;
            }
        }

        // Write back to pif.prop
        const writeResult = await exec(`cat > ${pifPath} << 'EOF'\n${content}\nEOF`);
        if (writeResult.errno !== 0) {
            return { success: false, message: 'Failed to write pif.prop' };
        }

        return { success: true, message: 'Telephony configuration saved successfully' };
    } catch (error) {
        return { success: false, message: `Error: ${error.message}` };
    }
}

// Load telephony configuration from pif.prop
export async function loadTelephonyConfig(exec) {
    try {
        const result = await exec(`cat /data/adb/pif.prop || cat ${moddir}/pif.prop`);
        if (result.errno !== 0) {
            return { success: false, message: 'Failed to read pif.prop' };
        }

        const lines = result.stdout.split('\n');
        const configMap = {};

        for (const line of lines) {
            const [key, value] = line.split('=');
            if (key && value) {
                configMap[key.trim()] = value.trim();
            }
        }

        // Populate UI fields
        for (const [fieldId, configKey] of Object.entries(telephonyConfig)) {
            const element = document.getElementById(fieldId);
            if (element && configMap[configKey]) {
                element.value = configMap[configKey];
            }
        }

        return { success: true, message: 'Telephony configuration loaded' };
    } catch (error) {
        return { success: false, message: `Error: ${error.message}` };
    }
}

// Clear all telephony fields
export function clearTelephonyFields() {
    for (const field of telephonyFields) {
        const element = document.getElementById(field);
        if (element) {
            element.value = '';
        }
    }
}

// Toggle telephony section visibility
export function toggleTelephonySection(show) {
    const section = document.getElementById('telephony-section');
    if (section) {
        section.style.display = show ? 'block' : 'none';
    }
}

// Setup telephony event listeners
export function setupTelephonyListeners(exec, appendToOutput) {
    const spoofTelephonyToggle = document.getElementById('spoofTelephony-toggle');
    const saveTelephonyBtn = document.getElementById('save-telephony');
    const loadTelephonyBtn = document.getElementById('load-telephony');
    const clearTelephonyBtn = document.getElementById('clear-telephony');
    const telephonySection = document.getElementById('telephony-section');

    if (spoofTelephonyToggle) {
        spoofTelephonyToggle.addEventListener('change', () => {
            toggleTelephonySection(spoofTelephonyToggle.selected);
            if (spoofTelephonyToggle.selected) {
                loadTelephonyConfig(exec).then(result => {
                    if (appendToOutput) {
                        appendToOutput(result.message);
                    }
                });
            }
        });
    }

    if (saveTelephonyBtn) {
        saveTelephonyBtn.addEventListener('click', async () => {
            const result = await saveTelephonyConfig(exec);
            if (appendToOutput) {
                appendToOutput(result.message, !result.success);
            }
        });
    }

    if (loadTelephonyBtn) {
        loadTelephonyBtn.addEventListener('click', async () => {
            const result = await loadTelephonyConfig(exec);
            if (appendToOutput) {
                appendToOutput(result.message, !result.success);
            }
        });
    }

    if (clearTelephonyBtn) {
        clearTelephonyBtn.addEventListener('click', () => {
            clearTelephonyFields();
            if (appendToOutput) {
                appendToOutput('Telephony fields cleared');
            }
        });
    }
}
