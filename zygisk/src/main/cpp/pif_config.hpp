#pragma once

  #include <string>
  #include <string_view>
  #include <unordered_map>
  #include <unordered_set>

  namespace pif {
      struct Config {
          std::unordered_map<std::string, std::string> telephonyMap;

          bool spoofTelephony = true;

          // Per-class hook toggles (names match the real Android classes)
          bool hookTelephonyManager      = true; // android.telephony.TelephonyManager
          bool hookSubscriptionInfo      = true; // android.telephony.SubscriptionInfo
          bool hookEmergencyNumber       = true; // android.telephony.emergency.EmergencyNumber
          bool hookTelephonyProperties   = true; // android.sysprop.TelephonyProperties
          bool hookSemTelephonyProps     = true; // com.samsung.telephony.sysprop.SemTelephonyProps
          bool hookULocale               = true; // android.icu.util.ULocale (getDisplayCountry)

          std::unordered_set<std::string> allowedApps;
          bool debug = false;

          [[nodiscard]] bool needsDex() const {
              return spoofTelephony && (hookTelephonyManager || hookSubscriptionInfo
                  || hookEmergencyNumber || hookULocale);
          }
          [[nodiscard]] bool needsPropertyHook() const {
              return spoofTelephony && (hookTelephonyProperties || hookSemTelephonyProps);
          }
          [[nodiscard]] bool isAllowed(const std::string& pkg) const {
              return allowedApps.find(pkg) != allowedApps.end();
          }
      };

      [[nodiscard]] Config parseConfig(std::string_view content);
      [[nodiscard]] bool writeConfig(int fd, const Config &config);
      [[nodiscard]] bool readConfig(int fd, Config &config);
  }
  