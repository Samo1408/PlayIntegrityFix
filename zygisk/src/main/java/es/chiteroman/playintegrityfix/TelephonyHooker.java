package es.chiteroman.playintegrityfix;

  import android.util.Log;

  import org.json.JSONObject;

  import java.lang.reflect.Field;
  import java.util.HashMap;
  import java.util.Iterator;
  import java.util.Map;

  /**
   * Telephony spoofing performed at the Java level.
   *
   * Most spoofing is actually done at the native level by intercepting
   * __system_property_read_callback in zygisk.cpp (this covers
   * TelephonyProperties and SemSystemProperties paths used by
   * TelephonyManager / SubscriptionInfo internally).
   *
   * On top of that we patch any cached static fields that are populated
   * once at process start, so that a value already cached from a real
   * read is replaced with the spoofed one for classes that snapshot
   * properties: SubscriptionInfo, EmergencyNumber, etc.
   */
  public class TelephonyHooker {
      public static final String TAG = "TeleInject-J";
      private static final Map<String, String> values = new HashMap<>();

      public static void init(String json, boolean hookTM, boolean hookSI, boolean hookEN) {
          if (json == null || json.isEmpty()) {
              Log.i(TAG, "No telephony configuration provided");
              return;
          }
          try {
              JSONObject obj = new JSONObject(json);
              Iterator<String> keys = obj.keys();
              while (keys.hasNext()) {
                  String k = keys.next();
                  String v = obj.optString(k, "");
                  if (!v.isEmpty()) values.put(k, v);
              }
          } catch (Exception e) {
              Log.e(TAG, "Failed to parse telephony config", e);
              return;
          }
          Log.i(TAG, "Loaded " + values.size() + " spoof values");

          if (hookTM) hookTelephonyManager();
          if (hookSI) hookSubscriptionInfo();
          if (hookEN) hookEmergencyNumber();
      }

      /** Try to set a static or instance field by name, swallow errors. */
      private static void setField(Class<?> cls, Object instance, String fieldName, Object value) {
          if (value == null) return;
          try {
              Field f = findField(cls, fieldName);
              if (f == null) return;
              f.setAccessible(true);
              f.set(instance, value);
              Log.d(TAG, cls.getSimpleName() + "." + fieldName + " = " + value);
          } catch (Throwable t) {
              // silently ignore - field may not exist on this Android version
          }
      }

      private static Field findField(Class<?> cls, String name) {
          Class<?> c = cls;
          while (c != null && c != Object.class) {
              try { return c.getDeclaredField(name); }
              catch (NoSuchFieldException ignored) {}
              c = c.getSuperclass();
          }
          return null;
      }

      private static String s(String k) { return values.get(k); }
      private static Integer i(String k) {
          String v = values.get(k);
          if (v == null || v.isEmpty()) return null;
          try { return Integer.parseInt(v); } catch (NumberFormatException e) { return null; }
      }

      /**
       * android.telephony.TelephonyManager — most getters delegate to
       * binder calls so they cannot be spoofed by reflection alone.
       * What we can do: clear cached fields that some methods snapshot,
       * so the next call re-reads from the (now spoofed) system property.
       */
      private static void hookTelephonyManager() {
          try {
              Class<?> tm = Class.forName("android.telephony.TelephonyManager");
              // These cached fields exist on some Android versions:
              for (String f : new String[]{"sCachedCountryIso", "sCachedNetworkOperator",
                      "sCachedSimOperator", "sCachedSimOperatorName"}) {
                  try {
                      Field cf = tm.getDeclaredField(f);
                      cf.setAccessible(true);
                      cf.set(null, null);
                  } catch (Throwable ignored) {}
              }
              Log.i(TAG, "TelephonyManager caches cleared");
          } catch (Throwable t) {
              Log.e(TAG, "hookTelephonyManager", t);
          }
      }

      /**
       * android.telephony.SubscriptionInfo — instance fields populated by
       * the system. We patch the SubscriptionManager cache so the next
       * lookup is rebuilt with our spoofed property values.
       */
      private static void hookSubscriptionInfo() {
          try {
              Class<?> sm = Class.forName("android.telephony.SubscriptionManager");
              // Best effort: drop any cached SubscriptionInfo lists.
              for (String f : new String[]{"sCacheActiveList", "sCacheAllList",
                      "mSubInfoLocalCache"}) {
                  try {
                      Field cf = sm.getDeclaredField(f);
                      cf.setAccessible(true);
                      Object cur = cf.get(null);
                      if (cur instanceof Map) ((Map<?, ?>) cur).clear();
                  } catch (Throwable ignored) {}
              }
              Log.i(TAG, "SubscriptionInfo cache cleared");
          } catch (Throwable t) {
              Log.e(TAG, "hookSubscriptionInfo", t);
          }
      }

      /**
       * android.telephony.emergency.EmergencyNumber — we cannot easily
       * intercept binder calls but we can patch the static MNC/MCC fields
       * on EmergencyNumberTracker if it has been initialised in this
       * process so its lookups use spoofed values.
       */
      private static void hookEmergencyNumber() {
          try {
              Class<?> en = Class.forName("android.telephony.emergency.EmergencyNumber");
              String mcc = s("MCC_STRING");
              String mnc = s("MNC_STRING");
              if (mcc == null) mcc = s("MCC");
              if (mnc == null) mnc = s("MNC");
              // EmergencyNumber holds an mCountryIso field on most versions.
              for (String f : new String[]{"mCountryIso", "sDefaultCountryIso"}) {
                  String v = s("COUNTRY_ISO");
                  if (v != null) setField(en, null, f, v);
              }
              // Optional: try to update tracker's MCC.
              try {
                  Class<?> tracker = Class.forName("com.android.internal.telephony.emergency.EmergencyNumberTracker");
                  if (mcc != null) setField(tracker, null, "mLastKnownEmergencyCountryIso", s("COUNTRY_ISO"));
              } catch (Throwable ignored) {}
              Log.i(TAG, "EmergencyNumber patched");
          } catch (Throwable t) {
              Log.e(TAG, "hookEmergencyNumber", t);
          }
      }
  }
  