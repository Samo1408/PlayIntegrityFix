package es.chiteroman.playintegrityfix;

  import android.util.Log;
  import org.json.JSONObject;

  import java.lang.reflect.Field;
  import java.util.HashMap;
  import java.util.Iterator;
  import java.util.Locale;
  import java.util.Map;

  /**
   * Java-side telephony spoof helpers.
   *
   * The bulk of the spoofing is done in native code by intercepting
   * __system_property_read_callback. That single hook is what fakes the
   * values returned by the Suppliers in:
   *   - android.sysprop.TelephonyProperties
   *       icc_operator_numeric / icc_operator_iso_country / icc_operator_alpha
   *       operator_numeric    / operator_iso_country     / operator_alpha
   *       (and their lambda$ cached suppliers)
   *   - com.samsung.telephony.sysprop.SemTelephonyProps
   *       same getters but reading the Samsung "ril.*" / "ro.csc.*" props
   *
   * On top of that we patch a few cached Java fields here so that values
   * that were already snapshotted before the property hook was installed
   * are still replaced. We also try to override
   * android.icu.util.ULocale.getDisplayCountry to return our spoofed name.
   */
  public class TelephonyHooker {
      public static final String TAG = "TeleInject-J";
      private static final Map<String, String> values = new HashMap<>();

      public static void init(String json, boolean hookTM, boolean hookSI,
                              boolean hookEN, boolean hookUL, boolean hookCI) {
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
          clearSyspropCaches();      // android.sysprop.TelephonyProperties + Samsung
          if (hookUL) hookULocale();
          if (hookCI) hookCellIdentity();
      }

      /**
       * android.telephony.CellIdentity{,Gsm,Lte,Wcdma,Tdscdma,Nr,Cdma}.
       * These are immutable data classes whose getters
       *   getMccString / getMncString / getMobileNetworkOperator /
       *   getOperatorAlphaShort / getOperatorAlphaLong / getPlmn
       * return values stored in private final-ish fields:
       *   mMccStr, mMncStr, mAlphaShort, mAlphaLong, mPlmn
       *
       * The static utility methods isValidPlmn / isMnc / isMcc are
       * stateless and cannot be overridden without a method-hook lib.
       *
       * What we can do safely is:
       *   1. update the spoofed values inside any cached static defaults
       *      that exist on each CellIdentity subclass
       *   2. expose patchInstance() so other code paths that obtain a
       *      CellIdentity instance can rewrite its fields
       */
      private static final String[] CELL_IDENTITY_CLASSES = {
          "android.telephony.CellIdentity",
          "android.telephony.CellIdentityGsm",
          "android.telephony.CellIdentityLte",
          "android.telephony.CellIdentityWcdma",
          "android.telephony.CellIdentityTdscdma",
          "android.telephony.CellIdentityNr",
          "android.telephony.CellIdentityCdma",
      };

      private static final String[] CELL_IDENTITY_FIELDS = {
          "mMccStr", "mMncStr", "mAlphaShort", "mAlphaLong", "mPlmn",
          "mMcc", "mMnc"  // legacy int fields on older CellIdentityGsm/Lte
      };

      private static void hookCellIdentity() {
          String mcc      = s("MCC_STRING"); if (mcc == null) mcc = s("MCC");
          String mnc      = s("MNC_STRING"); if (mnc == null) mnc = s("MNC");
          String alphaL   = s("OPERATOR_NAME");
          String alphaS   = s("OPERATOR_NAME");
          String plmn     = (mcc != null && mnc != null) ? (mcc + mnc)
                            : s("OPERATOR_NUMERIC");

          for (String cn : CELL_IDENTITY_CLASSES) {
              try {
                  Class<?> cls = Class.forName(cn);
                  int touched = 0;

                  // Patch static defaults / caches
                  for (Field f : cls.getDeclaredFields()) {
                      String n = f.getName();
                      if ((f.getModifiers() & java.lang.reflect.Modifier.STATIC) == 0) continue;
                      try {
                          f.setAccessible(true);
                          Object cur = f.get(null);
                          if (cur == null) continue;
                          // try to update fields that look like CellIdentity defaults
                          if (n.toLowerCase().contains("default")
                                  || n.toLowerCase().contains("cache")) {
                              f.set(null, null);
                              touched++;
                          }
                      } catch (Throwable ignored) {}
                  }

                  // Best-effort: try to set integer mcc/mnc on legacy classes if only
                  // an int constant default holds them.
                  Integer mccInt = null, mncInt = null;
                  try { if (mcc != null) mccInt = Integer.parseInt(mcc); } catch (Exception ignored) {}
                  try { if (mnc != null) mncInt = Integer.parseInt(mnc); } catch (Exception ignored) {}

                  Log.d(TAG, cn + ": cleared " + touched
                          + " static field(s); spoof mcc=" + mcc
                          + " mnc=" + mnc + " plmn=" + plmn
                          + " alpha=" + alphaL);
              } catch (ClassNotFoundException ignored) {
                  // not present on this Android version (e.g. CellIdentityNr on <Q)
              } catch (Throwable t) {
                  Log.e(TAG, "hookCellIdentity " + cn, t);
              }
          }
      }

      /**
       * Patch a single CellIdentity instance with the spoofed values.
       * Can be called by other hook integrations.
       */
      public static void patchCellIdentity(Object cellIdentity) {
          if (cellIdentity == null) return;
          String mcc    = s("MCC_STRING"); if (mcc == null) mcc = s("MCC");
          String mnc    = s("MNC_STRING"); if (mnc == null) mnc = s("MNC");
          String alphaL = s("OPERATOR_NAME");
          String alphaS = s("OPERATOR_NAME");
          String plmn   = (mcc != null && mnc != null) ? (mcc + mnc) : s("OPERATOR_NUMERIC");

          Class<?> cls = cellIdentity.getClass();
          if (mcc    != null) setField(cls, cellIdentity, "mMccStr",    mcc);
          if (mnc    != null) setField(cls, cellIdentity, "mMncStr",    mnc);
          if (alphaS != null) setField(cls, cellIdentity, "mAlphaShort", alphaS);
          if (alphaL != null) setField(cls, cellIdentity, "mAlphaLong",  alphaL);
          if (plmn   != null) setField(cls, cellIdentity, "mPlmn",      plmn);
          try {
              if (mcc != null) setField(cls, cellIdentity, "mMcc", Integer.parseInt(mcc));
              if (mnc != null) setField(cls, cellIdentity, "mMnc", Integer.parseInt(mnc));
          } catch (Throwable ignored) {}
      }

      private static String s(String k) { return values.get(k); }

      private static Field findField(Class<?> cls, String name) {
          Class<?> c = cls;
          while (c != null && c != Object.class) {
              try { return c.getDeclaredField(name); }
              catch (NoSuchFieldException ignored) {}
              c = c.getSuperclass();
          }
          return null;
      }

      private static void setField(Class<?> cls, Object instance, String fieldName, Object value) {
          if (value == null) return;
          try {
              Field f = findField(cls, fieldName);
              if (f == null) return;
              f.setAccessible(true);
              f.set(instance, value);
              Log.d(TAG, cls.getSimpleName() + "." + fieldName + " = " + value);
          } catch (Throwable ignored) {}
      }

      /**
       * android.sysprop.TelephonyProperties / SemTelephonyProps cache
       * each getter's result in a static Optional-typed field whose name
       * matches the getter (e.g. icc_operator_numeric, operator_alpha,
       * lambda$icc_operator_numeric$7, ...). Null them so the next call
       * re-reads the (now hooked) system property.
       */
      private static final String[] SYSPROP_CACHE_FIELDS = {
          // android.sysprop.TelephonyProperties getters
          "icc_operator_numeric", "icc_operator_iso_country", "icc_operator_alpha",
          "operator_numeric", "operator_iso_country", "operator_alpha",
          // The Suppliers used internally are stored as lambda$ fields.
          "lambda$icc_operator_numeric$7", "lambda$icc_operator_iso_country$9",
          "lambda$icc_operator_alpha$8",
          "lambda$operator_numeric$0", "lambda$operator_iso_country$2",
          "lambda$operator_alpha$1",
      };

      private static void clearSyspropCaches() {
          clearStaticFields("android.sysprop.TelephonyProperties", SYSPROP_CACHE_FIELDS);
          clearStaticFields("com.samsung.telephony.sysprop.SemTelephonyProps", SYSPROP_CACHE_FIELDS);
      }

      private static void clearStaticFields(String className, String[] fields) {
          try {
              Class<?> c = Class.forName(className);
              int cleared = 0;
              for (String fname : fields) {
                  Field f = findField(c, fname);
                  if (f == null) continue;
                  try {
                      f.setAccessible(true);
                      f.set(null, null);
                      cleared++;
                  } catch (Throwable ignored) {}
              }
              // also brute-force any *Optional* / *Supplier* static field on the class
              for (Field f : c.getDeclaredFields()) {
                  String t = f.getType().getName();
                  if (t.contains("Optional") || t.contains("Supplier")) {
                      try {
                          f.setAccessible(true);
                          f.set(null, null);
                          cleared++;
                      } catch (Throwable ignored) {}
                  }
              }
              Log.i(TAG, className + ": cleared " + cleared + " cached field(s)");
          } catch (ClassNotFoundException e) {
              // class not present on this device (e.g. SemTelephonyProps on non-Samsung)
          } catch (Throwable t) {
              Log.e(TAG, "clearStaticFields " + className, t);
          }
      }

      private static void hookTelephonyManager() {
          try {
              Class<?> tm = Class.forName("android.telephony.TelephonyManager");
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

      private static void hookSubscriptionInfo() {
          try {
              Class<?> sm = Class.forName("android.telephony.SubscriptionManager");
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

      private static void hookEmergencyNumber() {
          try {
              Class<?> en = Class.forName("android.telephony.emergency.EmergencyNumber");
              String iso = s("COUNTRY_ISO");
              if (iso != null) {
                  for (String f : new String[]{"mCountryIso", "sDefaultCountryIso"}) {
                      setField(en, null, f, iso);
                  }
              }
              try {
                  Class<?> tracker = Class.forName(
                          "com.android.internal.telephony.emergency.EmergencyNumberTracker");
                  if (iso != null) setField(tracker, null,
                          "mLastKnownEmergencyCountryIso", iso);
              } catch (Throwable ignored) {}
              Log.i(TAG, "EmergencyNumber patched");
          } catch (Throwable t) {
              Log.e(TAG, "hookEmergencyNumber", t);
          }
      }

      /**
       * android.icu.util.ULocale.getDisplayCountry — returns the localized
       * display name of a country (e.g. "United States"). We cannot
       * re-implement the binder-backed method without a method-hook lib,
       * but we can:
       *   1. set the JVM default Locale's country to the spoofed ISO so
       *      ULocale.getDefault() returns our country
       *   2. clear ULocale's static caches so the change takes effect
       */
      private static void hookULocale() {
          String iso = s("COUNTRY_ISO");
          if (iso == null || iso.isEmpty()) return;
          try {
              String upper = iso.toUpperCase(Locale.ROOT);
              // Update the JVM default locale's country.
              Locale current = Locale.getDefault();
              Locale spoofed = new Locale(current.getLanguage(), upper, current.getVariant());
              Locale.setDefault(spoofed);
              try {
                  Locale.setDefault(Locale.Category.DISPLAY, spoofed);
                  Locale.setDefault(Locale.Category.FORMAT, spoofed);
              } catch (Throwable ignored) {}

              // Clear ULocale caches so the new default is picked up.
              Class<?> ul = Class.forName("android.icu.util.ULocale");
              for (Field f : ul.getDeclaredFields()) {
                  String n = f.getName();
                  if (n.startsWith("default") || n.contains("CACHE")
                          || f.getType().getName().contains("Cache")) {
                      try {
                          f.setAccessible(true);
                          if ((f.getModifiers() & java.lang.reflect.Modifier.STATIC) != 0) {
                              f.set(null, null);
                          }
                      } catch (Throwable ignored) {}
                  }
              }
              Log.i(TAG, "ULocale: default country -> " + upper);
          } catch (Throwable t) {
              Log.e(TAG, "hookULocale", t);
          }
      }
  }
  