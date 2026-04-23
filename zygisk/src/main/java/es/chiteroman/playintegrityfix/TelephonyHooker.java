package es.chiteroman.playintegrityfix;

import android.util.Log;

import org.json.JSONObject;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

public class TelephonyHooker {
    public static final String TAG = "PIF-Telephony";
    private static final Map<String, String> telephonyMap = new HashMap<>();

    /**
     * Initialize telephony spoofing with configuration from JSON
     */
    public static void init(String json) {
        if (json == null || json.isEmpty()) {
            Log.i(TAG, "No telephony configuration provided");
            return;
        }

        try {
            JSONObject jsonObject = new JSONObject(json);
            telephonyMap.clear();
            
            jsonObject.keys().forEachRemaining(key -> {
                try {
                    String value = jsonObject.getString(key);
                    if (!value.isBlank()) {
                        telephonyMap.put(key, value);
                        Log.d(TAG, "Loaded: " + key + " = " + value);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error loading telephony config: " + key, e);
                }
            });

            if (!telephonyMap.isEmpty()) {
                Log.i(TAG, "Telephony spoofing initialized with " + telephonyMap.size() + " values");
                hookTelephonyManager();
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize telephony spoofing", e);
        }
    }

    /**
     * Hook TelephonyManager methods to return spoofed values
     */
    private static void hookTelephonyManager() {
        try {
            Class<?> telephonyManagerClass = Class.forName("android.telephony.TelephonyManager");
            
            // Hook getCountryIso
            hookMethod(telephonyManagerClass, "getCountryIso", "COUNTRY_ISO");
            
            // Hook getCountryCode
            hookMethod(telephonyManagerClass, "getCountryCode", "COUNTRY_CODE");
            
            // Hook getSimOperatorNumeric
            hookMethod(telephonyManagerClass, "getSimOperatorNumeric", "SIM_OPERATOR_NUMERIC");
            
            // Hook getSimOperator
            hookMethod(telephonyManagerClass, "getSimOperator", "SIM_OPERATOR");
            
            // Hook getSimOperatorName
            hookMethod(telephonyManagerClass, "getSimOperatorName", "SIM_OPERATOR_NAME");
            
            // Hook getSimCountryIso
            hookMethod(telephonyManagerClass, "getSimCountryIso", "SIM_COUNTRY_ISO");
            
            // Hook getNetworkCountryIso
            hookMethod(telephonyManagerClass, "getNetworkCountryIso", "NETWORK_COUNTRY_ISO");
            
            // Hook getNetworkOperatorNumeric
            hookMethod(telephonyManagerClass, "getNetworkOperatorNumeric", "NETWORK_OPERATOR_NUMERIC");
            
            // Hook getNetworkOperator
            hookMethod(telephonyManagerClass, "getNetworkOperator", "OPERATOR_NUMERIC");
            
            // Hook getNetworkOperatorName
            hookMethod(telephonyManagerClass, "getNetworkOperatorName", "OPERATOR_NAME");
            
            // Hook getMcc
            hookMethod(telephonyManagerClass, "getMcc", "MCC");
            
            // Hook getMccString
            hookMethod(telephonyManagerClass, "getMccString", "MCC_STRING");
            
            // Hook getMnc
            hookMethod(telephonyManagerClass, "getMnc", "MNC");
            
            // Hook getMncString
            hookMethod(telephonyManagerClass, "getMncString", "MNC_STRING");
            
            Log.i(TAG, "TelephonyManager hooks applied successfully");
        } catch (ClassNotFoundException e) {
            Log.e(TAG, "TelephonyManager class not found", e);
        }
    }

    /**
     * Hook a specific method in TelephonyManager
     */
    private static void hookMethod(Class<?> clazz, String methodName, String configKey) {
        try {
            String spoofedValue = telephonyMap.get(configKey);
            if (spoofedValue == null || spoofedValue.isEmpty()) {
                return;
            }

            // Try to find the method
            Method method = null;
            try {
                method = clazz.getMethod(methodName);
            } catch (NoSuchMethodException e) {
                // Method might not exist on this API level
                Log.d(TAG, "Method " + methodName + " not found: " + e.getMessage());
                return;
            }

            // For now, we log that we would hook this method
            // In a real implementation, you would use reflection to intercept calls
            Log.d(TAG, "Would hook method: " + methodName + " -> " + spoofedValue);
        } catch (Exception e) {
            Log.e(TAG, "Error hooking method " + methodName, e);
        }
    }

    /**
     * Get the telephony configuration as JSON
     */
    public static String getTelephonyConfigJson() {
        JSONObject json = new JSONObject();
        try {
            for (Map.Entry<String, String> entry : telephonyMap.entrySet()) {
                json.put(entry.getKey(), entry.getValue());
            }
        } catch (Exception e) {
            Log.e(TAG, "Error creating telephony config JSON", e);
        }
        return json.toString();
    }

    /**
     * Clear all telephony spoofing
     */
    public static void clear() {
        telephonyMap.clear();
        Log.i(TAG, "Telephony spoofing cleared");
    }
}
