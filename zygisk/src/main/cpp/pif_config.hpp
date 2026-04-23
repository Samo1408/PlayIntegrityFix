#pragma once

  #include <string>
  #include <string_view>
  #include <unordered_map>
  #include <unordered_set>

  namespace pif {
      struct Config {
          // Spoof values (key -> value), only telephony keys are used.
          std::unordered_map<std::string, std::string> telephonyMap;

          // Master switch
          bool spoofTelephony = true;

          // Per-class hook toggles
          bool hookTelephonyManager      = true;
          bool hookSubscriptionInfo      = true;
          bool hookEmergencyNumber       = true;
          bool hookTelephonyProperties   = true;
          bool hookSemSystemProperties   = true;

          // Allowed app process names (e.g. com.example.app). If empty, hook nothing.
          std::unordered_set<std::string> allowedApps;

          bool debug = false;

          [[nodiscard]] bool needsDex() const {
              // We always need the dex if telephony spoof is on (the dex
              // contains TelephonyHooker which performs Java-side hooks).
              return spoofTelephony && (hookTelephonyManager || hookSubscriptionInfo || hookEmergencyNumber);
          }

          [[nodiscard]] bool needsPropertyHook() const {
              // Property-level hook covers TelephonyProperties and SemSystemProperties.
              return spoofTelephony && (hookTelephonyProperties || hookSemSystemProperties);
          }

          [[nodiscard]] bool isAllowed(const std::string& pkg) const {
              return allowedApps.find(pkg) != allowedApps.end();
          }
      };

      [[nodiscard]] Config parseConfig(std::string_view content);
      [[nodiscard]] bool writeConfig(int fd, const Config &config);
      [[nodiscard]] bool readConfig(int fd, Config &config);
  }
  