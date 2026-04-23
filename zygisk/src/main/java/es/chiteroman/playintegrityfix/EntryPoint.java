package es.chiteroman.playintegrityfix;

  import android.util.Log;

  import org.json.JSONObject;

  public final class EntryPoint {
      public static final String TAG = "TeleInject";

      /**
       * Called from native code after the dex is injected.
       *
       * @param telephonyJson JSON object with telephony spoof values
       *                      (keys: COUNTRY_ISO, SIM_OPERATOR_NUMERIC, ...)
       * @param flagsJson     JSON object with hook flags
       *                      (hookTelephonyManager / hookSubscriptionInfo / hookEmergencyNumber)
       */
      public static void init(String telephonyJson, String flagsJson) {
          try {
              JSONObject flags = (flagsJson == null || flagsJson.isEmpty())
                      ? new JSONObject()
                      : new JSONObject(flagsJson);
              boolean hookTM = flags.optBoolean("hookTelephonyManager", true);
              boolean hookSI = flags.optBoolean("hookSubscriptionInfo", true);
              boolean hookEN = flags.optBoolean("hookEmergencyNumber", true);
              TelephonyHooker.init(telephonyJson, hookTM, hookSI, hookEN);
          } catch (Throwable t) {
              Log.e(TAG, "EntryPoint.init failed", t);
          }
      }
  }
  