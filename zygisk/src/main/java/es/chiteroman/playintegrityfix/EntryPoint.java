package es.chiteroman.playintegrityfix;

  import android.util.Log;
  import org.json.JSONObject;

  public final class EntryPoint {
      public static final String TAG = "TeleInject";

      public static void init(String telephonyJson, String flagsJson) {
          try {
              JSONObject flags = (flagsJson == null || flagsJson.isEmpty())
                      ? new JSONObject() : new JSONObject(flagsJson);
              boolean hookTM = flags.optBoolean("hookTelephonyManager", true);
              boolean hookSI = flags.optBoolean("hookSubscriptionInfo", true);
              boolean hookEN = flags.optBoolean("hookEmergencyNumber", true);
              boolean hookUL = flags.optBoolean("hookULocale", true);
              boolean hookCI = flags.optBoolean("hookCellIdentity", true);
              TelephonyHooker.init(telephonyJson, hookTM, hookSI, hookEN, hookUL, hookCI);
          } catch (Throwable t) {
              Log.e(TAG, "EntryPoint.init failed", t);
          }
      }
  }
  